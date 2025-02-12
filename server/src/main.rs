use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::services::ServeDir;

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

struct AppState {
    client: reqwest::Client,
    openalex_base_url: String,
}

#[tokio::main]
async fn main() {
    // Initialize application state
    let state = Arc::new(AppState {
        client: reqwest::Client::new(),
        openalex_base_url: "https://api.openalex.org".to_string(),
    });

    // Create our application with routes
    let app = Router::new()
        .route("/api/search", post(handle_search))
        .route("/check-health", get(health_check))
        .nest_service("/public", ServeDir::new("public"))
        .with_state(state);

    // Run it with hyper
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "Hello!"
}

async fn perform_search(
    state: Arc<AppState>,
    title: String,
) -> Result<Vec<SearchResult>, (StatusCode, ErrorResponse)> {
    let commaless_title = title.replace(",", "");
    let quoted_title = format!("\"{}\"", commaless_title);
    let search_query = "/works?filter=title.search:";
    let url = format!(
        "{}{}{}&select=id,display_name,publication_year,cited_by_count",
        state.openalex_base_url, search_query, quoted_title
    );
    println!("{:?}", url);

    // Make request to OpenAlex
    let response = state.client.get(&url).send().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            ErrorResponse {
                error: format!("Request failed: {}", e),
            },
        )
    })?;

    if !response.status().is_success() {
        let response_status = response.status().as_u16();
        return Err((
            StatusCode::from_u16(response_status).unwrap(),
            ErrorResponse {
                error: "External API error".to_string(),
            },
        ));
    }

    let query_result = response.json::<OpenAlexResponse>().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            ErrorResponse {
                error: format!("Failed to parse response: {}", e),
            },
        )
    })?;

    Ok(query_result.results)
}

async fn handle_search(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SearchRequest>,
) -> Response {
    // Validate title
    let title = match payload.title {
        Some(title) => title,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Title is required".to_string(),
                }),
            )
                .into_response();
        }
    };

    if title.len() >= 500 {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "The title's length is too big (over 500 characters)".to_string(),
            }),
        )
            .into_response();
    }

    // First attempt with full title
    let mut results = match perform_search(state.clone(), title.clone()).await {
        Ok(results) => results,
        Err((status, error)) => return (status, Json(error)).into_response(),
    };

    // OpenAlex has some works whose title is only the text until the paper title's colon.
    // As such, if we didn't receive any results and the title has a colon,
    // then get the text up to the colon and try the query again
    if results.is_empty() {
        if let Some(index) = title.find(':') {
            let text_before_colon = title[..index].to_string();
            match perform_search(state, text_before_colon).await {
                Ok(new_results) => results = new_results,
                Err((status, error)) => return (status, Json(error)).into_response(),
            }
        }
    }
    Json(results).into_response()
}
