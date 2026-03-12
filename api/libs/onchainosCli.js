/**
 * Run onchainos CLI (OKX onchainos-skills) for DEX signal and memepump endpoints.
 * Used when OKX REST does not expose these (signal-list, memepump-tokens, etc.).
 * Install: curl -sSL https://raw.githubusercontent.com/okx/onchainos-skills/main/install.sh | sh
 * Requires OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE in env (same as DEX REST).
 * @see https://github.com/okx/onchainos-skills
 */
import { execSync } from "child_process";

const ONCHAINOS_CMD = process.env.ONCHAINOS_CMD || "onchainos";
const CLI_TIMEOUT_MS = 60_000;

/**
 * Run onchainos market subcommand and return parsed JSON from stdout.
 * @param {string} subcommand - e.g. "price", "kline", "signal-list", "memepump-chains"
 * @param {string[]} args - e.g. ["solana", "--stage", "NEW"]
 * @returns {{ result: any }} Parsed JSON or { error: string }
 */
export function runOnchainosMarket(subcommand, args = []) {
  try {
    const allArgs = ["market", subcommand, ...args].filter(Boolean);
    const cmd = [ONCHAINOS_CMD, ...allArgs].join(" ");
    const stdout = execSync(cmd, {
      encoding: "utf8",
      timeout: CLI_TIMEOUT_MS,
      env: { ...process.env },
    });
    const trimmed = (stdout || "").trim();
    if (!trimmed) return { result: null };
    try {
      const parsed = JSON.parse(trimmed);
      return { result: parsed };
    } catch {
      return { result: trimmed };
    }
  } catch (err) {
    const msg = err.message || String(err);
    const stderr = err.stderr ? String(err.stderr).trim() : "";
    const isNotInstalled =
      /not found|ENOENT|spawn|not recognized/i.test(msg) ||
      /not found|not recognized/i.test(stderr);
    if (isNotInstalled) {
      return {
        error:
          "onchainos CLI is not installed or not on PATH. Signal and memepump endpoints require it. Install: https://github.com/okx/onchainos-skills (or set ONCHAINOS_CMD to the full path).",
      };
    }
    return { error: msg + (stderr ? ` ${stderr}` : "") };
  }
}

/** Check if onchainos is available on PATH. */
export function isOnchainosAvailable() {
  try {
    execSync(`${ONCHAINOS_CMD} --version`, { encoding: "utf8", timeout: 5000, stdio: "pipe" });
    return true;
  } catch {
    try {
      execSync(`which ${ONCHAINOS_CMD}`, { encoding: "utf8", timeout: 2000, stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }
}
