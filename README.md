# Flooring Layout Tool

The Flooring Layout Tool is a web application that allows users to design and visualize flooring layouts. It consists of a Vue.js frontend for the user interface and a Rust backend for handling server-side operations.

## Project Structure

The project is organized into two main components:

1. Frontend (Vue.js)
2. Backend (Rust)

## Frontend

The frontend is built using Vue.js 3 and includes the following features:

- A home page welcoming users to the Flooring Layout Tool
- A drawing workspace where users can create and manipulate floor plans
- Vue Router for navigation between different views
- Konva.js integration for interactive canvas drawing

### Key Components

- Home view: Displays a welcome message and a link to the workspace
- DrawingWorkspace view: Contains the main floor plan drawing area
- FloorPlan component: Implements the interactive canvas for creating floor layouts

### Setup and Running

To set up and run the frontend:

1. Navigate to the `frontend` directory
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run serve
   ```

## Backend

The backend is built using Rust with the Warp web framework. It provides a simple API endpoint for demonstration purposes.

### Setup and Running

To set up and run the backend:

1. Navigate to the `backend` directory
2. Build and run the project:
   ```
   cargo run
   ```

The server will start on `http://localhost:3030`.

## Development

This project uses a workspace structure for the Rust backend. The main `Cargo.toml` file in the root directory defines the workspace, while the backend has its own `Cargo.toml` file for dependencies.

## Dependencies

### Frontend
- Vue.js 3
- Vue Router
- Konva.js and vue-konva for canvas manipulation
- @vue/cli-service for development and building

### Backend
- Warp for the web framework
- Tokio for asynchronous runtime

## Contributing

Contributions to the Flooring Layout Tool are welcome. Please ensure that you update tests as appropriate and adhere to the existing coding style.

## License

[Add your chosen license here]

