# MongoDB Atlas: M10 to Flex Migration Runbook

## Why migrate

Your M10 dedicated cluster costs ~$65/month (3 nodes x $0.03/hr). Flex costs ~$8/month at low ops. Atlas cannot downgrade M10 to Flex in place — you must create a new cluster and migrate data.

## Pre-migration checklist

- [ ] Code optimizations deployed (projections, slower crons, TTL indexes)
- [ ] Data size under 5 GB (run `node scripts/verify-mongodb-connection.js`)
- [ ] Only one API replica running (each replica duplicates cron load)

## Step 1: Create Flex cluster (Atlas UI)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → your project → **Database** → **Create**
2. Choose **Flex** cluster type
3. Provider: **AWS**, Region: **Singapore (ap-southeast-1)** (same as current M10)
4. Cluster name: e.g. `Cluster0-flex`
5. Copy **Network Access** rules from M10 cluster (IP allowlist)
6. Copy or create the same **Database User** with readWrite on `syra` database

## Step 2: Migrate data

### Option A: PowerShell script (Windows)

```powershell
cd api/scripts

# Set URIs (get from Atlas → Connect → Drivers)
$env:MONGODB_URI_SOURCE = "mongodb+srv://user:pass@cluster0.xxx.mongodb.net/syra?retryWrites=true&w=majority"
$env:MONGODB_URI_TARGET = "mongodb+srv://user:pass@cluster0-flex.xxx.mongodb.net/syra?retryWrites=true&w=majority"

.\migrate-mongodb-to-flex.ps1
```

Requires [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools).

**Windows install (winget):**
```powershell
winget install MongoDB.DatabaseTools
```

After install, restart your terminal so `mongodump` is on PATH.

### Option B: Manual commands

```bash
mongodump --uri="<M10 URI>" --out=./mongodb-dump
mongorestore --uri="<Flex URI>" --drop ./mongodb-dump/syra
```

## Step 3: Switch connection string

1. Update `MONGODB_URI` in your deployment environment (Railway, Fly, VPS `.env`, etc.)
2. Restart the API process
3. Verify:

```bash
cd api
node scripts/verify-mongodb-connection.js
```

Expected: connects to Flex host, shows collection sizes, "Flex (5 GB): OK".

## Step 4: Smoke test

- Hit API health endpoint
- Open one page that reads from MongoDB (e.g. BTC dashboard, agent chat)
- Check API logs for MongoDB connection success

## Step 5: Terminate M10 cluster

**Only after Flex is verified working:**

1. Atlas → Database → M10 cluster (`Cluster0`) → **...** → **Terminate**
2. Confirm termination

This stops:
- M10 instance charges (~$2.16/day)
- Continuous Cloud Backup charges (~$1.28 and growing)

## Step 6: Monitor Flex billing

- Atlas → Billing → check daily ops stay low
- If ops spike, check Atlas Metrics → Operations for hot collections
- Env vars to tune if needed:
  - `LP_EXPERIMENT_RESOLVE_MS=120000` (slow LP resolve to 2 min)
  - `BTC_INTELLIGENCE_TICK_MS=120000`
  - `BTC_INTELLIGENCE_CRON_ENABLED=false` (disable if not needed)

## Optional: M0 Free tier later

If after 1 month Flex ops stay minimal and data stays under 512 MB, repeat this migration to M0 for $0/month. M0 has no backups and throttled ops — only for pure dev/experiment.

## Rollback

If Flex has issues, point `MONGODB_URI` back to M10 URI and restart. Do not terminate M10 until Flex is confirmed stable.
