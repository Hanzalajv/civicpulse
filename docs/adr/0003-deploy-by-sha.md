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

The prod overlay uses ${IMAGE_TAG}, substituted by CI:

yaml
images:
  - name: backend
    newName: ghcr.io/hanzalajv/civicpulse-backend
    newTag: ${IMAGE_TAG}
CI sets IMAGE_TAG=${{ github.sha }} before kubectl apply -k k8s/overlays/prod.

Consequences
Easier:

Reproducible deploys: same SHA runs same bytes

"What is production running?" answerable with one kubectl describe

Rollback is kubectl rollout undo or re-applying a previous SHA overlay

CI can skip rebuilding an image if the SHA tag already exists

Harder:

Every deploy needs variable substitution (envsubst in CI)

Tags are less human-readable than v1.2.3 — mitigated by release.yml emitting semver tags on v* tags

Accepted trade-off: slightly more CI plumbing in exchange for reproducible, auditable deploys.

text

---

## Check All Files Exist

```powershell
Test-Path docs\RUNBOOK.md
Test-Path docs\TRIAGE.md
Test-Path docs\adr\0001-provider-interface.md
Test-Path docs\adr\0003-deploy-by-sha.md
All should return True.