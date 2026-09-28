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

The hostname backend is:

A Docker Compose service name (in compose.yaml)

A Kubernetes Service name (in k8s/base/services.yaml)

The same nginx.conf works in both environments without modification. No IP address, no port, no environment variable.

2. The frontend never uses an absolute API URL.

Frontend code calls relative paths:

ts
fetch('/api/complaints', { method: 'POST', ... })
Not:

ts
fetch('http://backend:8000/api/complaints', ...)  // ❌ hardcoded
fetch(import.meta.env.VITE_API_URL + '/api/complaints', ...)  // ❌ baked at build
Because the browser resolves /api/... against whatever host served the page, the same static build works behind any ingress, any port-forward, any domain.

Alternatives Considered
1. Baked-in VITE_API_URL. Rejected. Would force a rebuild per environment. The image would carry the API URL in its JavaScript bundle forever.

2. /config.js generated at container start. A small shell script in the frontend image reads $API_BASE_URL from the environment and writes /usr/share/nginx/html/config.js before nginx starts. The frontend reads window.API_BASE_URL at runtime.

This is a valid pattern and works well when the API host changes per environment (e.g., multi-tenant deployments). We did not need it here, because the /api reverse proxy already abstracts the backend host.

If future requirements introduce per-environment API hosts, this is the pattern to add. The nginx proxy stays; the frontend reads window.API_BASE_URL with a fallback to /api.

3. Runtime fetch of a JSON config from the backend. Adds a network round-trip before first paint. Rejected as unnecessary overhead for our use case.

Consequences
Easier:

One image runs in any environment

The same frontend image works in Docker Compose, k3d, and any future cluster

No build-time environment variables to inject

CI can build and push the image once, then deploy it everywhere

No CORS in production — the browser sees same-origin requests because nginx serves both the static files and the API proxy on the same host

Harder:

The frontend cannot call a different backend than the one nginx proxies to. If we ever need multi-tenant routing (customer A's frontend → customer A's backend), we would need either /config.js or a per-tenant ingress rule.

Debugging requires knowing that /api goes through nginx, not directly to the backend. The browser network tab shows /api/..., but the backend logs show nginx's container IP, not the client's.

Accepted trade-off: simplicity for our single-environment-per-deployment use case, at the cost of flexibility if requirements change to multi-tenant.

Evidence
frontend/nginx.conf — the /api proxy block

frontend/Dockerfile — copies nginx.conf into the runtime stage

frontend/src/api/client.ts — uses relative paths only

compose.yaml — backend Service name is backend

k8s/base/services.yaml — backend Service name is backend

No VITE_API_URL reference anywhere in the frontend source