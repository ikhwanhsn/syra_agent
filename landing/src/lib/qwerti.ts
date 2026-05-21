import { QWERTI_CAMPAIGN_ID, resolveQwertiLoaderSrc } from "@/data/qwerti";
import { installQwertiAssetProxy } from "@/lib/qwertiAssetProxy";
import type { QwertiEvent, QwertiEventHandler, QwertiSdk } from "@/lib/qwerti.d";

export type QwertiClientState = "idle" | "loading" | "ready" | "error";

const READY_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 150;

installQwertiAssetProxy();

function getSdk(): QwertiSdk | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Qwerti;
}

function findExistingLoaderScript(): HTMLScriptElement | null {
  return (
    document.querySelector<HTMLScriptElement>(
      `script[data-campaign="${QWERTI_CAMPAIGN_ID}"]`,
    ) ??
    document.querySelector<HTMLScriptElement>('script[src*="widget/v1/buy.js"]')
  );
}

function ensureQwertiBootstrap(): Promise<void> {
  const win = window as Window & { __syraQwertiAssetProxy?: boolean };
  if (win.__syraQwertiAssetProxy) return Promise.resolve();
  if (document.querySelector('script[src*="qwerti-bootstrap"]')) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const bootstrap = document.createElement("script");
    bootstrap.src = "/qwerti-bootstrap.js";
    bootstrap.async = false;
    bootstrap.onload = () => resolve();
    bootstrap.onerror = () => resolve();
    document.head.appendChild(bootstrap);
  });
}

async function injectLoaderScript(): Promise<void> {
  const existing = findExistingLoaderScript();
  if (existing) return;

  await ensureQwertiBootstrap();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = resolveQwertiLoaderSrc();
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-widget", "qwerti-widget");
    script.setAttribute("data-campaign", QWERTI_CAMPAIGN_ID);
    script.setAttribute("data-auto-open", "true");

    script.onerror = () => {
      reject(new Error(`Qwerti loader failed (${script.src})`));
    };

    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

class QwertiClient {
  private state: QwertiClientState = "idle";
  private initPromise: Promise<void> | null = null;
  private readonly listeners = new Map<QwertiEvent, Set<QwertiEventHandler>>();

  getState(): QwertiClientState {
    return this.state;
  }

  on(event: QwertiEvent, handler: QwertiEventHandler): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
    getSdk()?.on(event, handler);
    return () => this.off(event, handler);
  }

  off(event: QwertiEvent, handler: QwertiEventHandler): void {
    this.listeners.get(event)?.delete(handler);
    getSdk()?.off(event, handler);
  }

  private emitLocal(event: QwertiEvent, payload?: unknown): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(payload);
    }
  }

  private bindSdkListeners(sdk: QwertiSdk): void {
    for (const [event, handlers] of this.listeners) {
      for (const handler of handlers) {
        sdk.on(event, handler);
      }
    }
  }

  private markReady(sdk: QwertiSdk): void {
    this.bindSdkListeners(sdk);
    this.state = "ready";
    this.emitLocal("ready");
  }

  private waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;

      const finishReady = (sdk: QwertiSdk) => {
        if (settled) return;
        settled = true;
        cleanup();
        this.markReady(sdk);
        resolve();
      };

      const finishError = (message: string) => {
        if (settled) return;
        settled = true;
        cleanup();
        this.state = "error";
        reject(new Error(message));
      };

      const onReady: QwertiEventHandler = () => {
        const sdk = getSdk();
        if (sdk?.openWidget) finishReady(sdk);
      };

      const tryAttachReady = (sdk: QwertiSdk) => {
        sdk.on("ready", onReady);
        if (typeof sdk.openWidget === "function") {
          finishReady(sdk);
        }
      };

      const pollId = window.setInterval(() => {
        const sdk = getSdk();
        if (sdk) tryAttachReady(sdk);
      }, POLL_INTERVAL_MS);

      const timeoutId = window.setTimeout(() => {
        const sdk = getSdk();
        if (sdk?.openWidget) {
          finishReady(sdk);
          return;
        }
        finishError("Qwerti widget ready timeout");
      }, READY_TIMEOUT_MS);

      const cleanup = () => {
        window.clearInterval(pollId);
        window.clearTimeout(timeoutId);
        getSdk()?.off("ready", onReady);
      };

      const immediate = getSdk();
      if (immediate) tryAttachReady(immediate);
    });
  }

  init(): Promise<void> {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("Qwerti is only available in the browser"));
    }

    if (this.state === "ready") {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.state = "loading";
    this.initPromise = (async () => {
      try {
        await injectLoaderScript();
        await this.waitForReady();
      } catch (err) {
        this.state = "error";
        this.initPromise = null;
        throw err;
      }
    })();

    return this.initPromise;
  }

  open(): void {
    const sdk = getSdk();
    if (!sdk || this.state !== "ready") {
      throw new Error("Qwerti widget is not ready. Call init() first.");
    }
    sdk.openWidget();
  }

  close(): void {
    getSdk()?.closeWidget();
  }

  refresh(): void {
    getSdk()?.refreshWidget();
  }
}

export const qwertiClient = new QwertiClient();

export async function openQwertiBuyWidget(): Promise<void> {
  await qwertiClient.init();
  qwertiClient.open();
}
