import {
  QWERTI_MAGIC_LINK,
  buildQwertiEmbedAttrs,
} from "@/data/qwerti";
import { injectQwertiHeadScript } from "@/lib/qwertiHeadScript";
import type { QwertiSdk } from "@/lib/qwerti.d";

const READY_TIMEOUT_MS = 12_000;

function getSdk(): QwertiSdk | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Qwerti;
}

function findEmbedScript(): HTMLScriptElement | null {
  const attrs = buildQwertiEmbedAttrs();
  return (
    document.querySelector<HTMLScriptElement>(
      `script[data-campaign="${attrs["data-campaign"]}"]`,
    ) ?? document.querySelector<HTMLScriptElement>('script[src*="buy.js"]')
  );
}

export function waitForQwertiSdk(timeoutMs = READY_TIMEOUT_MS): Promise<QwertiSdk> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    const check = () => {
      const sdk = getSdk();
      const state = sdk?.getState?.();

      if (state?.error === "Missing required attributes") {
        reject(new Error(state.error));
        return;
      }

      if (sdk?.openWidget) {
        resolve(sdk);
        return;
      }

      if (Date.now() > deadline) {
        reject(new Error("Qwerti SDK not available"));
        return;
      }

      window.setTimeout(check, 100);
    };

    check();
  });
}

function scriptHasRequiredAttrs(script: HTMLScriptElement): boolean {
  const attrs = buildQwertiEmbedAttrs();
  return (
    script.dataset.widget === attrs["data-widget"] &&
    script.dataset.campaign === attrs["data-campaign"]
  );
}

export async function openQwertiBuyWidget(): Promise<void> {
  const script = findEmbedScript();
  if (!script || !scriptHasRequiredAttrs(script)) {
    injectQwertiHeadScript();
  }

  try {
    const sdk = await waitForQwertiSdk();
    sdk.openWidget();
  } catch {
    window.open(QWERTI_MAGIC_LINK, "_blank", "noopener,noreferrer");
  }
}

export function closeQwertiBuyWidget(): void {
  getSdk()?.closeWidget();
}

/** Removes launcher + widget DOM (use when leaving routes that show Qwerti). */
export function destroyQwertiEmbed(): void {
  closeQwertiBuyWidget();
  getSdk()?.destroy?.();
  document.getElementById("qwerti-widget-root")?.remove();
  findEmbedScript()?.remove();
}
