# ADR 0002: Frontend Runtime Configuration

## Status
Accepted

## Context

A Vite build bakes `import.meta.env.*` values into the static JavaScript at build time. If our API URL were baked in, the frontend image would be environment-specific — one image for local, another for staging, another for production. That destroys **build-once-deploy-many**. The same image would be rebuilt for every environment, and every rebuild is a chance for drift.

The frontend needs to reach the backend at `/api`. In development, Vite's dev server proxies `/api` to `http://localhost:8000`. In production, nginx serves the static files and must proxy `/api` to the backend Service.

We need a runtime configuration mechanism that keeps the image environment-agnostic.

## Decision

Two complementary choices, both environment-agnostic:

**1. nginx proxies `/api` to a Service name.**

`frontend/nginx.conf` contains:

```nginx
location /api {
    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}