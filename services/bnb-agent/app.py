"""
Syra BNB Chain agent — ERC-8183 provider server (bnbagent-sdk).

Run: uvicorn app:app --host 0.0.0.0 --port 8003
"""
from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

from bnbagent.erc8183.server import create_erc8183_app

from syra_job import execute_via_syra


def on_job(job: dict) -> str:
    return execute_via_syra(job)


app = create_erc8183_app(on_job=on_job)

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT") or "8003")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
