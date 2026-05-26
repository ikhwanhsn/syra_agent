#!/usr/bin/env python3
"""
Permissionless ERC-8183 settle loop — call router.settle(jobId) after dispute window.

Run via cron every few minutes, e.g.:
  */5 * * * * cd /path/to/services/bnb-agent && python settle_jobs.py
"""
from __future__ import annotations

import os
import sys
import time

from dotenv import load_dotenv

load_dotenv()

from bnbagent.erc8183 import ERC8183Client, JobStatus
from bnbagent.wallets import EVMWalletProvider


def main() -> None:
    password = os.getenv("WALLET_PASSWORD")
    if not password:
        print("WALLET_PASSWORD required", file=sys.stderr)
        sys.exit(1)

    wallet = EVMWalletProvider(password=password, private_key=os.getenv("PRIVATE_KEY"))
    network = os.getenv("NETWORK", "bsc-testnet")
    client = ERC8183Client(wallet, network=network)

    # Optional: comma-separated job IDs from env; otherwise no-op without indexer
    raw = (os.getenv("ERC8183_SETTLE_JOB_IDS") or "").strip()
    if not raw:
        print("Set ERC8183_SETTLE_JOB_IDS=1,2,3 or extend this script with event indexing.")
        return

    for part in raw.split(","):
        job_id = part.strip()
        if not job_id:
            continue
        try:
            status = client.get_job_status(job_id)
            if status != JobStatus.SUBMITTED:
                print(f"skip {job_id} status={status}")
                continue
            client.settle(job_id)
            print(f"settled {job_id}")
        except Exception as exc:
            print(f"settle failed {job_id}: {exc}", file=sys.stderr)
        time.sleep(0.5)


if __name__ == "__main__":
    main()
