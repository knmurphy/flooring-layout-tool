use warp::Filter;

#[tokio::main]
async fn main() {
    // Define a simple route that returns a message
    let hello = warp::path!("hello" / String)
        .map(|name| format!("Hello, {}!", name));

    // Run the warp server on port 3030
    warp::serve(hello)
        .run(([0, 0, 0, 0], 3030))
        .await;
}
