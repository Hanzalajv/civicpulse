# CivicPulse Runbook

Operational guide for deploying, rolling back, and debugging CivicPulse.

---

## Deploy Locally (Docker Compose)

```powershell
docker compose -f compose.yaml up -d --build


docker compose -f compose.yaml exec backend alembic upgrade head
docker compose -f compose.yaml exec backend python -m scripts.seed


stop:
docker compose -f compose.yaml down

docker compose -f compose.yaml down -v

Deploy to Kubernetes (k3d)


k3d cluster create civicpulse -p "8080:80@loadbalancer"

docker build -t civicpulse-backend:dev ./backend
docker build -t civicpulse-frontend:dev ./frontend

k3d image import civicpulse-backend:dev -c civicpulse
k3d image import civicpulse-frontend:dev -c civicpulse

kubectl apply -k k8s/overlays/dev

## secret created maually


kubectl create secret generic civicpulse-secrets -n civicpulse `
  --from-literal=POSTGRES_PASSWORD=civicpulse_dev `
  --from-literal=DATABASE_URL="postgresql+psycopg://civicpulse:civicpulse_dev@postgres:5432/civicpulse" `
  --from-literal=GROQ_API_KEY="<your key>" `
  --from-literal=GEMINI_API_KEY="<your key>" `
  --dry-run=client -o yaml | kubectl apply -f -

kubectl rollout restart deployment/backend -n civicpulse



kubectl exec -n civicpulse deploy/backend -- alembic upgrade head
kubectl exec -n civicpulse deploy/backend -- python -m scripts.seed


Rollback
Fast — imperative
powershell
kubectl rollout undo deployment/backend -n civicpulse
Use when: production is broken now and you need the previous revision immediately.

Auditable — declarative
powershell
git log --oneline -10
$env:IMAGE_TAG = "<previous-sha>"
kubectl apply -k k8s/overlays/prod
Use when: you have time to make the change traceable.

Read Logs
Local:

powershell
docker compose -f compose.yaml logs -f backend
docker compose -f compose.yaml logs -f frontend
K8s:

powershell
kubectl logs -n civicpulse deploy/backend --tail=100
kubectl logs -n civicpulse deploy/backend -f
All logs are JSON with request_id. Grep by request ID:

powershell
kubectl logs -n civicpulse deploy/backend | Select-String "<request-id>"
When Triage Starts Failing
Check active provider:

powershell
Invoke-RestMethod http://localhost:8000/api/meta/providers
Grep logs for fallbacks:

powershell
kubectl logs -n civicpulse deploy/backend | Select-String "rules:fallback"
Check the Prometheus counter:

powershell
Invoke-WebRequest http://localhost:8000/metrics | Select-String "triage_fallback_total"
Test Groq and Gemini directly:

powershell
docker compose -f compose.yaml exec backend python -c "from app.providers.triage.llm import LLMTriage; print(LLMTriage()._call_groq('test', 'loc'))"
If both fail, the system falls back to RuleBasedTriage. Requests still return 201 with triaged_by: rules:fallback.

Force rules-only:

powershell
# .env
TRIAGE_PROVIDER=rules
Then docker compose down && up -d.

Check Health
powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/ready
/ready returns 503 with the failed dependency named:

json
{"status":"not_ready","failed":["postgres"]}


