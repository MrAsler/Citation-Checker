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
    year: String,
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
        .nest_service("/", ServeDir::new("public"))
        .with_state(state);

    // Run it with hyper
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "Hello!"
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

    // Prepare URL
    // 3 tries: first search by purey the display tite, then check if only the first name exists
    //   and matches
    // The openAlex API has issues with titles that have commas, so we remove them
    let commaless_title = title.replace(",", "");
    let quoted_title = format!("\"{}\"", commaless_title);
    //    let encoded_title = urlencoding::encode(commaless_title.as_str());

    //   let search_query = "/works?search=";
    let search_query = "/works?filter=title.search:";
    let url = format!(
        "{}{}{}&select=id,display_name,cited_by_count,publication_year",
        state.openalex_base_url, search_query, quoted_title
    );
    println!("{:?}", url);

    // Make request to OpenAlex
    let response = match state.client.get(&url).send().await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Request failed: {}", e),
                }),
            )
                .into_response()
        }
    };
    if !response.status().is_success() {
        let response_status = response.status().as_u16();
        return (
            StatusCode::from_u16(response_status).unwrap(),
            Json(ErrorResponse {
                error: "External API error".to_string(),
            }),
        )
            .into_response();
    }

    let query_result = match response.json::<OpenAlexResponse>().await {
        Ok(data) => data.results,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to parse response: {}", e),
                }),
            )
                .into_response()
        }
    };

    // OpenAlex has some works whose title is only the text until the paper title's colon.
    // As such, if we didn't receive any results and the title has a colon,
    // then get the text up to the colon and try the query again
    if query_result.len() == 0 {
        if let Some(index) = title.find(':') {
            // Slice the string up to the colon
            let text_before_colon = &title[..index];
            return handle_search(
                axum::extract::State(state),
                axum::Json(SearchRequest {
                    title: Some(text_before_colon.to_string()),
                }),
            )
            .await;
        }
    }

    Json(query_result).into_response()
}

fn inner_search()
