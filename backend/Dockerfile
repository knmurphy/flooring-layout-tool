# Use the official Rust image to build the application
FROM rust:latest AS builder

# Set the working directory
WORKDIR /usr/src/backend

# Copy the manifest and source code
COPY Cargo.toml .
COPY src ./src

# Build the backend application
RUN cargo build --release

# Use a smaller image to run the application
FROM debian:buster-slim

WORKDIR /usr/src/backend

# Copy the built application from the builder image
COPY --from=builder /usr/src/backend/target/release/backend /usr/src/backend

# Expose the port the app runs on
EXPOSE 3030

# Run the backend server
CMD ["./backend"]
