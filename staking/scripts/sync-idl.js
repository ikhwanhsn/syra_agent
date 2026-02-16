/**
 * Copy Anchor-generated IDL to lib so the frontend uses the same instruction layout.
 * Run after `anchor build` so unstake/claim accounts stay in sync with the program.
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "target", "idl", "staking.json");
const dest = path.join(__dirname, "..", "lib", "idl", "staking.json");

if (!fs.existsSync(src)) {
  console.error("Run 'anchor build' first. Not found:", src);
  process.exit(1);
}
fs.copyFileSync(src, dest);
console.log("Synced IDL:", dest);
