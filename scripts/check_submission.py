#!/usr/bin/env python3
"""
check_submission.py — a lint, not a grader.

Catches the mechanical failures behind most automatic deductions in §5.3.
Run from the repository root:

    python scripts/check_submission.py

Exit code 0 = clean. Non-zero = at least one failure.
"""

import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FAILS: list[str] = []
WARNS: list[str] = []


def fail(msg: str) -> None:
    FAILS.append(msg)


def warn(msg: str) -> None:
    WARNS.append(msg)


def run(cmd: list[str]) -> tuple[int, str]:
    try:
        result = subprocess.run(
            cmd, cwd=ROOT, capture_output=True, text=True, timeout=30
        )
        return result.returncode, result.stdout + result.stderr
    except Exception as e:
        return 1, str(e)


def check_gitignore() -> None:
    path = ROOT / ".gitignore"
    if not path.exists():
        fail(".gitignore is missing")
        return
    content = path.read_text()
    for entry in [".env", "__pycache__", "node_modules"]:
        if entry not in content:
            fail(f".gitignore does not include {entry}")


def check_env_not_tracked() -> None:
    code, out = run(["git", "ls-files", ".env"])
    if code == 0 and out.strip():
        fail(".env is tracked by Git — this is a -20 deduction")


def check_env_example_exists() -> None:
    if not (ROOT / ".env.example").exists():
        warn(".env.example is missing (recommended)")


def check_secret_placeholders() -> None:
    secret = ROOT / "k8s" / "base" / "secret.yaml"
    if not secret.exists():
        warn("k8s/base/secret.yaml is missing")
        return
    content = secret.read_text()
    if re.search(r"gsk_[A-Za-z0-9]{20,}", content):
        fail("k8s/base/secret.yaml contains a real Groq key")
    if re.search(r"AIza[A-Za-z0-9_\-]{30,}", content):
        fail("k8s/base/secret.yaml contains a real Gemini key")


def check_no_secrets_in_tracked_files() -> None:
    code, out = run(["git", "ls-files"])
    if code != 0:
        return
    secret_patterns = [
        re.compile(r"gsk_[A-Za-z0-9]{30,}"),
        re.compile(r"AIza[A-Za-z0-9_\-]{30,}"),
        re.compile(r"ghp_[A-Za-z0-9]{30,}"),
    ]
    for line in out.splitlines():
        path = ROOT / line.strip()
        if not path.is_file():
            continue
        if path.suffix in {".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf"}:
            continue
        try:
            text = path.read_text(errors="ignore")
        except Exception:
            continue
        for pattern in secret_patterns:
            if pattern.search(text):
                fail(f"Possible real key in tracked file: {line.strip()}")


def check_no_latest_in_k8s() -> None:
    k8s = ROOT / "k8s"
    if not k8s.exists():
        return
    for path in k8s.rglob("*.yaml"):
        text = path.read_text(errors="ignore")
        if re.search(r":latest\b", text):
            fail(f":latest tag found in {path.relative_to(ROOT)}")


def check_no_localhost_in_k8s() -> None:
    k8s = ROOT / "k8s"
    if not k8s.exists():
        return
    for path in k8s.rglob("*.yaml"):
        text = path.read_text(errors="ignore")
        if "localhost" in text or "127.0.0.1" in text:
            warn(f"localhost/127.0.0.1 in {path.relative_to(ROOT)} — verify it is not service-to-service")


def check_required_files() -> None:
    required = [
        "README.md",
        "LICENSE",
        "compose.yaml",
        "compose.prod.yaml",
        ".env.example",
        "backend/Dockerfile",
        "backend/.dockerignore",
        "backend/pyproject.toml",
        "backend/alembic.ini",
        "backend/app/main.py",
        "backend/app/models/enums.py",
        "backend/app/models/orm.py",
        "backend/app/models/schemas.py",
        "backend/app/providers/triage/base.py",
        "backend/app/providers/triage/rules.py",
        "backend/app/providers/triage/simulated.py",
        "backend/app/providers/triage/llm.py",
        "backend/app/providers/triage/factory.py",
        "backend/app/services/complaint_service.py",
        "backend/app/services/state_machine.py",
        "backend/app/services/rate_limiter.py",
        "backend/app/services/stats_service.py",
        "backend/app/services/triage_cache.py",
        "backend/app/routes/health.py",
        "backend/app/routes/complaints.py",
        "backend/app/routes/status.py",
        "backend/app/routes/stats.py",
        "backend/app/routes/meta.py",
        "backend/app/repositories/complaint_repo.py",
        "backend/tests/test_fallback.py",
        "backend/tests/test_injection.py",
        "frontend/Dockerfile",
        "frontend/.dockerignore",
        "frontend/nginx.conf",
        "k8s/base/namespace.yaml",
        "k8s/base/configmap.yaml",
        "k8s/base/secret.yaml",
        "k8s/base/postgres.yaml",
        "k8s/base/redis.yaml",
        "k8s/base/backend.yaml",
        "k8s/base/frontend.yaml",
        "k8s/base/services.yaml",
        "k8s/base/ingress.yaml",
        "k8s/base/hpa.yaml",
        "k8s/base/pdb.yaml",
        "k8s/base/kustomization.yaml",
        "k8s/overlays/dev/kustomization.yaml",
        "k8s/overlays/prod/kustomization.yaml",
        "docs/CONTRACT.md",
        "docs/RUNBOOK.md",
        "docs/TRIAGE.md",
        "docs/ENGINEERING-NOTES.md",
        "docs/AI-USAGE.md",
        "docs/adr/0001-provider-interface.md",
        "docs/adr/0002-frontend-runtime-config.md",
        "docs/adr/0003-deploy-by-sha.md",
        "docs/adr/0004-pii-data-governance.md",
        ".github/workflows/ci.yml",
        ".github/workflows/cd.yml",
        ".github/workflows/release.yml",
    ]
    for rel in required:
        if not (ROOT / rel).exists():
            fail(f"Missing required file: {rel}")


def check_evidence_files() -> None:
    evidence = ROOT / "docs" / "evidence"
    if not evidence.exists():
        fail("docs/evidence/ is missing")
        return
    required = [
        "branch-protection.png",
        "hpa-w.txt",
    ]
    for name in required:
        if not (evidence / name).exists():
            warn(f"Evidence file missing: docs/evidence/{name}")
    optional = [
        "vpa-recommendations.txt",
        "k3d-pods.txt",
        "network-isolation.txt",
    ]
    for name in optional:
        if not (evidence / name).exists():
            warn(f"Optional evidence file missing: docs/evidence/{name}")


def check_main_direct_push() -> None:
    code, out = run(["git", "log", "main", "--oneline", "-5"])
    if code != 0:
        warn("Could not inspect main branch")
        return
    if not out.strip():
        warn("main branch has no commits")


def check_compose_prod_no_build() -> None:
    path = ROOT / "compose.prod.yaml"
    if not path.exists():
        return
    text = path.read_text()
    if re.search(r"^\s*build:", text, re.MULTILINE):
        fail("compose.prod.yaml contains a build: key (should use image:)")


def check_compose_prod_no_published_db_port() -> None:
    path = ROOT / "compose.prod.yaml"
    if not path.exists():
        return
    text = path.read_text()
    if re.search(r"postgres:.*?ports:", text, re.DOTALL):
        fail("compose.prod.yaml publishes a port for postgres")
    if re.search(r"redis:.*?ports:", text, re.DOTALL):
        fail("compose.prod.yaml publishes a port for redis")


def main() -> int:
    print("Running submission checks...\n")

    check_gitignore()
    check_env_not_tracked()
    check_env_example_exists()
    check_secret_placeholders()
    check_no_secrets_in_tracked_files()
    check_no_latest_in_k8s()
    check_no_localhost_in_k8s()
    check_required_files()
    check_evidence_files()
    check_main_direct_push()
    check_compose_prod_no_build()
    check_compose_prod_no_published_db_port()

    if WARNS:
        print("Warnings:")
        for w in WARNS:
            print(f"  ⚠  {w}")
        print()

    if FAILS:
        print("Failures:")
        for f in FAILS:
            print(f"  ✗  {f}")
        print(f"\n{len(FAILS)} failure(s), {len(WARNS)} warning(s).")
        return 1

    print(f"No failures. {len(WARNS)} warning(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())