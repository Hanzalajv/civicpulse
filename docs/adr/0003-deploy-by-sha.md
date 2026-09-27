# ADR 0003: Deploy by SHA, Not by Tag

## Status
Accepted

## Context

Container images can be tagged many ways: `latest`, `v1.2.3`, `main`, or a commit SHA. The tag determines what a Kubernetes Deployment actually runs.

If we deploy `:latest`, the cluster pulls whichever image was pushed last. Two pods in the same Deployment can run different code — one from yesterday's `latest`, one from today's. "What is production running?" has no honest answer. Rollback is impossible because reverting the manifest still points to `latest`, which is the broken image.

## Decision

Every image is tagged with its commit SHA:

```yaml
docker push ghcr.io/hanzalajv/civicpulse-backend:${{ github.sha }}
docker push ghcr.io/hanzalajv/civicpulse-frontend:${{ github.sha }}