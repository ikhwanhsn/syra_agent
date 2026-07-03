# Migrate MongoDB Atlas data from M10 (source) to Flex (target).
#
# Prerequisites:
#   1. MongoDB Database Tools installed: https://www.mongodb.com/try/download/database-tools
#   2. New Flex cluster created in Atlas (same region: AWS Singapore)
#   3. Network access + DB user copied to Flex cluster
#
# Usage (PowerShell):
#   cd api/scripts
#   $env:MONGODB_URI_SOURCE = "mongodb+srv://user:pass@cluster0.xxx.mongodb.net/syra"
#   $env:MONGODB_URI_TARGET = "mongodb+srv://user:pass@flex-cluster.xxx.mongodb.net/syra"
#   .\migrate-mongodb-to-flex.ps1
#
# After migration:
#   1. Update MONGODB_URI in your deployment to the Flex URI
#   2. Restart the API
#   3. Run: node scripts/verify-mongodb-connection.js
#   4. Terminate the M10 cluster in Atlas UI

param(
    [string]$SourceUri = $env:MONGODB_URI_SOURCE,
    [string]$TargetUri = $env:MONGODB_URI_TARGET,
    [string]$DumpDir = ".\mongodb-dump-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
)

$ErrorActionPreference = "Stop"

if (-not $SourceUri) {
    Write-Error "Set MONGODB_URI_SOURCE to your current M10 connection string."
}
if (-not $TargetUri) {
    Write-Error "Set MONGODB_URI_TARGET to your new Flex cluster connection string."
}

# Verify tools are installed
$mongodump = Get-Command mongodump -ErrorAction SilentlyContinue
$mongorestore = Get-Command mongorestore -ErrorAction SilentlyContinue
if (-not $mongodump -or -not $mongorestore) {
    Write-Error "mongodump/mongorestore not found. Install MongoDB Database Tools first."
}

Write-Host "=== Step 1: Dump from M10 (source) ===" -ForegroundColor Cyan
Write-Host "Dump directory: $DumpDir"
mongodump --uri="$SourceUri" --out="$DumpDir"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== Step 2: Restore to Flex (target) ===" -ForegroundColor Cyan
# Find the database folder inside dump (usually 'syra')
$dbFolders = Get-ChildItem -Path $DumpDir -Directory
if ($dbFolders.Count -eq 0) {
    Write-Error "No database folders found in dump directory."
}
$dbName = $dbFolders[0].Name
Write-Host "Restoring database: $dbName"

mongorestore --uri="$TargetUri" --drop "$DumpDir\$dbName"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== Migration complete ===" -ForegroundColor Green
Write-Host @"

Next steps:
  1. Update MONGODB_URI in your deployment env to the Flex URI
  2. Restart the API server
  3. Verify: cd api && node scripts/verify-mongodb-connection.js
  4. Test the app (health check, one API call)
  5. Terminate M10 cluster in Atlas UI to stop billing

Dump kept at: $DumpDir
Delete the dump folder after confirming Flex works.
"@
