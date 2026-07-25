# One-command go-live (after OTP)

Agentic Wallet session is currently **expired**. Complete this once:

```powershell
$env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH"
cd d:\business\syra-monorepo

# 1) Login (check email for OTP)
onchainos wallet login ikhwanulhusna111@gmail.com

# 2) Confirm
onchainos wallet status
# expect: "loggedIn": true

# 3) Create + activate Finance Copilot ASP (validated payload)
node okx-asp/register-syra-asp.mjs

# If ASP #2311 already exists:
# node okx-asp/register-syra-asp.mjs --activate-only 2311

# 4) Confirm agents
onchainos agent get-my-agents
```

`node okx-asp/validate-listing.mjs` already returns **`pass: true`** for the Finance Copilot `services.json`.

Then continue: record demo → publish #OKXAI Post A → submit Google form  
(see [GENESIS-HACKATHON.md](./GENESIS-HACKATHON.md)).
