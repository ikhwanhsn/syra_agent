"""Call Syra API to produce ERC-8183 deliverables."""
from __future__ import annotations

import json
import os
from typing import Any

import httpx

SYRA_API_BASE = (os.getenv("SYRA_API_BASE_URL") or "http://127.0.0.1:3000").rstrip("/")
INTERNAL_SECRET = (os.getenv("ERC8183_INTERNAL_SECRET") or "").strip()
TIMEOUT = float(os.getenv("SYRA_JOB_TIMEOUT_SEC") or "120")


def execute_via_syra(job: dict[str, Any]) -> str:
    if not INTERNAL_SECRET:
        raise RuntimeError("ERC8183_INTERNAL_SECRET is not set")

    job_id = str(job.get("jobId") or "").strip()
    description = str(job.get("description") or "").strip()
    if not job_id or not description:
        raise ValueError("job must include jobId and description")

    payload = {
        "jobId": job_id,
        "description": description,
        "budget": job.get("budget"),
        "client": job.get("client"),
        "metadata": {
            "provider": job.get("provider"),
            "expiredAt": job.get("expiredAt"),
            "status": job.get("status"),
        },
    }

    with httpx.Client(timeout=TIMEOUT) as client:
        res = client.post(
            f"{SYRA_API_BASE}/agent/bnb8183/execute",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "x-erc8183-internal-secret": INTERNAL_SECRET,
            },
        )

    if res.status_code != 200:
        detail = res.text[:500]
        raise RuntimeError(f"Syra execute failed HTTP {res.status_code}: {detail}")

    body = res.json()
    if not body.get("success"):
        raise RuntimeError(body.get("error") or "syra_execute_failed")

    data = body.get("data") or {}
    deliverable = data.get("deliverable")
    if not deliverable or not str(deliverable).strip():
        raise RuntimeError("empty deliverable from Syra API")

    return str(deliverable)
