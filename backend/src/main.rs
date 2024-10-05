use warp::Filter;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone, Debug, Deserialize, Serialize)]
struct Layout {
    walls: Vec<Wall>,
    patterns: Vec<Pattern>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
struct Wall {
    points: Vec<f64>,
    stroke: String,
    stroke_width: f64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
struct Pattern {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    fill: String,
}

type Layouts = Arc<Mutex<Vec<Layout>>>;

#[tokio::main]
async fn main() {
    let layouts: Layouts = Arc::new(Mutex::new(Vec::new()));

    let cors = warp::cors()
        .allow_any_origin()
        .allow_headers(vec!["Content-Type"])
        .allow_methods(vec!["GET", "POST"]);

    let save_layout = warp::post()
        .and(warp::path("save_layout"))
        .and(warp::body::json())
        .and(with_layouts(layouts.clone()))
        .and_then(save_layout_handler);

    let load_layout = warp::get()
        .and(warp::path("load_layout"))
        .and(with_layouts(layouts.clone()))
        .and_then(load_layout_handler);

    let routes = save_layout.or(load_layout).with(cors);

    warp::serve(routes)
        .run(([127, 0, 0, 1], 3030))
        .await;
}

fn with_layouts(layouts: Layouts) -> impl Filter<Extract = (Layouts,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || layouts.clone())
}

async fn save_layout_handler(layout: Layout, layouts: Layouts) -> Result<impl warp::Reply, warp::Rejection> {
    layouts.lock().await.push(layout);
    Ok(warp::reply::json(&"Layout saved successfully"))
}

async fn load_layout_handler(layouts: Layouts) -> Result<impl warp::Reply, warp::Rejection> {
    let layouts = layouts.lock().await;
    if let Some(layout) = layouts.last() {
        Ok(warp::reply::json(layout))
    } else {
        Err(warp::reject::not_found())
    }
}
