use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::post,
    Json, Router,
};
use axum::routing::get;
use reqwest::Url;
use serde::{Deserialize, Serialize};
use tower_http::services::ServeDir;
use tower_http::cors::CorsLayer;

#[derive(Clone)]
struct AppState {
    client: reqwest::Client,
    openalex_base_url: Url,
}

// Request and response types
#[derive(Deserialize)]
struct SearchRequest {
    title: Option<String>,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

#[derive(Deserialize, Serialize)]
struct SearchResult {
    id: String,
    display_name: String,
    publication_year: i32,
    cited_by_count: i32,
}

#[derive(Deserialize)]
struct OpenAlexResponse {
    results: Vec<SearchResult>,
}

#[derive(Debug)]
struct AppError {
    status: StatusCode,
    msg: String,
}

impl AppError {
    fn bad_request(msg: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            msg: msg.into(),
        }
    }
}

impl From<reqwest::Error> for AppError {
    fn from(e: reqwest::Error) -> Self {
        // If upstream returned a non-2xx, preserve its status when possible.
        if let Some(s) = e.status() {
            return Self {
                status: s,
                msg: "External API error".to_string(),
            };
        }
        // If JSON decoding failed, report a bad gateway (upstream response unexpected).
        if e.is_decode() {
            return Self {
                status: StatusCode::BAD_GATEWAY,
                msg: format!("Failed to parse upstream response: {}", e),
            };
        }
        // Network/timeouts/etc.
        Self {
            status: StatusCode::BAD_GATEWAY,
            msg: e.to_string(),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (self.status, Json(ErrorResponse { error: self.msg })).into_response()
    }
}

#[tokio::main]
async fn main() {
    let state = AppState {
        client: reqwest::Client::new(),
        openalex_base_url: Url::parse("https://api.openalex.org").unwrap(),
    };

    let app = Router::new()
        .route("/api/search", post(handle_search))
        .route("/check-health", get(|| async { "Hello!" }))
        .nest_service("/public", ServeDir::new("public"))
        .fallback(|| async { (StatusCode::NOT_FOUND, "Not Found") })
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .unwrap();

    println!("Listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

async fn handle_search(
    State(state): State<AppState>,
    Json(payload): Json<SearchRequest>,
) -> Result<impl IntoResponse, AppError> {
    let title = match payload.title {
        Some(t) if !t.is_empty() => t,
        _ => return Err(AppError::bad_request("Title is required")),
    };

    println!("parsing to #{}", title);

    if title.len() >= 500 {
        return Err(AppError::bad_request(
            "The title's length is too big (over 500 characters)",
        ));
    }

    // First attempt with full title
    let mut results = perform_search(&state, &title).await?;

    // If empty and there's a colon, try text before the colon
    if results.is_empty() {
        if let Some(index) = title.find(':') {
            let text_before_colon = &title[..index];
            results = perform_search(&state, text_before_colon).await?;
        }
    }

    Ok(Json(results))
}

async fn perform_search(state: &AppState, title: &str) -> Result<Vec<SearchResult>, AppError> {
    // Build URL with proper query encoding
    let mut url = state.openalex_base_url.clone();
    url.set_path("works");

    let commaless_title = title.replace(',', "");
    let filter = format!("title.search:\"{}\"", commaless_title);

    url.query_pairs_mut()
        .append_pair("filter", &filter)
        .append_pair(
            "select",
            "id,display_name,publication_year,cited_by_count",
        );

    // Send request, convert non-2xx to errors, parse JSON
    println!("Making a request to #{}", url);
    let res = state.client.get(url).send().await?.error_for_status()?;
    let body = res.json::<OpenAlexResponse>().await?; // if this fails, AppError maps it
    Ok(body.results)
}