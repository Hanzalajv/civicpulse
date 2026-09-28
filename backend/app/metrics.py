from prometheus_client import Counter, Histogram

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["method", "path"],
)

TRIAGE_LATENCY = Histogram(
    "triage_duration_seconds",
    "Triage provider latency",
    ["provider"],
)

TRIAGE_FALLBACK_COUNT = Counter(
    "triage_fallback_total",
    "Number of triage fallbacks",
)
