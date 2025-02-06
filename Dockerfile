# syntax = docker/dockerfile:1

# This dockerfile uses 3 different base images:
# - Bun base image (Frontend): Uses bun, vite, tailwind
# - Rust base image (Backend): Compiles a very slim backend server 
# - Debian slim image: Uses the backend server binary while serving the compiled frontend

ARG APP_NAME=citation_checker

# -------------- FRONTEND --------------  #
# Based on https://bun.sh/guides/ecosystem/docker

ARG BUN_VERSION=1.2.2
FROM oven/bun:${BUN_VERSION}-slim AS frontend-base
WORKDIR /app

# First install dependencies in another layer, so that they are cached
FROM frontend-base AS frontend-dependencies

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3
COPY client/package.json client/package-lock.json client/bun.lock ./
RUN bun install --frozen-lockfile

# Then bring the application code and execute it 
FROM frontend-base AS frontend-builder

COPY --from=frontend-dependencies /app .
COPY client/ .
RUN bun run build

# -------------- BACKEND -------------- # 

FROM lukemathwalker/cargo-chef:latest AS chef
WORKDIR /app

FROM chef AS backend-planner
COPY server/ .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS backend-builder
COPY --from=backend-planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY server/ .
RUN cargo build --release
RUN mv ./target/release/server ./server


FROM debian:stable-slim AS runtime
RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-builder /app/server .
COPY --from=frontend-builder /app/src/dist /app/public/
EXPOSE 3000
CMD ["./server"]
