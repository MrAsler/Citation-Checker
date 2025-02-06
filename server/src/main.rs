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
    let encoded_title = urlencoding::encode(title.as_str());
    let url = format!(
        "{}/works?filter=title.search:{}&select=id,cited_by_count",
        state.openalex_base_url, encoded_title
    );

    // Make request to OpenAlex
    match state.client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<OpenAlexResponse>().await {
                    Ok(data) => Json(data.results).into_response(),
                    Err(e) => (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(ErrorResponse {
                            error: format!("Failed to parse response: {}", e),
                        }),
                    )
                        .into_response(),
                }
            } else {
                (
                    StatusCode::from_u16(response.status().as_u16()).unwrap(),
                    Json(ErrorResponse {
                        error: "External API error".to_string(),
                    }),
                )
                    .into_response()
            }
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Request failed: {}", e),
            }),
        )
            .into_response(),
    }
}
