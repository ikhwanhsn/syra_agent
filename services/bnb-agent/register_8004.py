#!/usr/bin/env python3
"""Register Syra on BSC ERC-8004 (BNB Chain agent identity)."""
from __future__ import annotations

import os
import sys

from dotenv import load_dotenv

load_dotenv()

from bnbagent import AgentEndpoint, ERC8004Agent, EVMWalletProvider

NETWORK = os.getenv("NETWORK", "bsc-testnet")
AGENT_URL = (os.getenv("ERC8183_AGENT_URL") or os.getenv("BNB_AGENT_PUBLIC_URL") or "").rstrip("/")
MCP_URL = (os.getenv("SYRA_MCP_URL") or "https://api.syraa.fun").rstrip("/")


def main() -> None:
    password = os.getenv("WALLET_PASSWORD")
    if not password:
        print("WALLET_PASSWORD is required", file=sys.stderr)
        sys.exit(1)

    wallet = EVMWalletProvider(
        password=password,
        private_key=os.getenv("PRIVATE_KEY"),
    )

    sdk = ERC8004Agent(network=NETWORK, wallet_provider=wallet)

    endpoints = [
        AgentEndpoint(name="MCP", endpoint=MCP_URL, version="1.0.0"),
    ]
    if AGENT_URL:
        endpoints.append(
            AgentEndpoint(
                name="ERC-8183",
                endpoint=f"{AGENT_URL}/erc8183/status",
                version="0.1.0",
            )
        )

    agent_uri = sdk.generate_agent_uri(
        name=os.getenv("SYRA_AGENT_NAME", "Syra"),
        description=os.getenv(
            "SYRA_AGENT_DESCRIPTION",
            "Machine money for agents on Solana — x402 pay-per-call APIs, agent wallets, treasury policy, and autonomous execution. Multi-chain: Solana, Base, BNB Chain with ERC-8183 on BSC.",
        ),
        endpoints=endpoints,
    )

    result = sdk.register_agent(agent_uri=agent_uri)
    print("Registered on BSC ERC-8004:")
    print(f"  agentId: {result.get('agentId')}")
    print(f"  tx: {result.get('transactionHash')}")


if __name__ == "__main__":
    main()
