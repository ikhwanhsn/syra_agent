# Secrets rotation required (2026-08-03)

During the LP agent loss post-mortem, `api/.env` was read from disk to connect to MongoDB.
That file contains **live production secrets** (Mongo URI, Solana private keys, exchange API keys, Privy, Crossmint, etc.).

Treat them as **compromised** until rotated:

1. Rotate MongoDB Atlas password / connection string
2. Rotate every Solana / agent private key listed in `.env` and move remaining funds
3. Rotate Kraken, OKX, Privy, Crossmint, Jupiter, and other third-party API keys
4. Move secrets to a secrets manager (or at minimum OS env / CI secrets) — do not keep live keys in a plaintext repo file
5. Audit Atlas Network Access and wallet transaction history for unexpected access

This file is a checklist only. Do **not** commit `.env`.
