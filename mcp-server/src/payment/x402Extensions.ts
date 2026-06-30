import { randomBytes } from "node:crypto";
import { preferMainnetSolanaAccepts } from "./x402Network.js";

type ExtensionSpec = {
  info?: { id?: string; required?: boolean };
  schema?: { required?: string[] };
};

export type X402ClientLike = {
  onBeforePaymentCreation: (hook: (context: { paymentRequired?: unknown }) => void | Promise<void>) => unknown;
  onAfterPaymentCreation: (
    hook: (context: { paymentPayload?: { extensions?: Record<string, ExtensionSpec> } }) => void | Promise<void>,
  ) => unknown;
  registerExtension?: (extension: unknown) => unknown;
};

function isExtensionRequired(extSpec: ExtensionSpec | undefined): boolean {
  if (!extSpec || typeof extSpec !== "object") return false;
  if (extSpec.info?.required === true) return true;
  const top = extSpec.schema?.required;
  return Array.isArray(top) && top.length > 0;
}

function generatePaymentIdentifier(): string {
  return `pay_${randomBytes(16).toString("hex")}`;
}

/**
 * x402 v2 client hooks — mirrors api/libs/agentX402Client.js registerRequiredExtensionsHook.
 * - Prefer mainnet Solana accepts when multiple networks are offered
 * - Populate required payment-identifier extension (e.g. Birdeye)
 */
export function registerRequiredExtensionsHook(client: X402ClientLike): void {
  client.onBeforePaymentCreation((context) => {
    preferMainnetSolanaAccepts(
      context?.paymentRequired as { accepts?: Array<{ network?: string }> } | undefined,
    );
  });

  client.onAfterPaymentCreation((context) => {
    const payload = context?.paymentPayload;
    const ext = payload?.extensions;
    if (!payload || !ext || typeof ext !== "object") return;

    const nextExt = { ...ext };
    let changed = false;

    const payIdSpec = ext["payment-identifier"];
    if (payIdSpec && isExtensionRequired(payIdSpec)) {
      const existingId = payIdSpec.info?.id;
      if (typeof existingId !== "string" || existingId.trim() === "") {
        nextExt["payment-identifier"] = {
          ...payIdSpec,
          info: { ...(payIdSpec.info || {}), id: generatePaymentIdentifier() },
        };
        changed = true;
      }
    }

    if (changed) {
      payload.extensions = nextExt;
    }
  });
}

export async function registerBuilderCodeClientExtension(client: X402ClientLike): Promise<void> {
  if (!client.registerExtension) return;
  const code = String(process.env.BASE_BUILDER_CODE || process.env.SYRA_BASE_BUILDER_CODE || "").trim();
  if (!code || !/^[a-z0-9_]{1,32}$/.test(code)) return;
  const { BuilderCodeClientExtension } = await import("@x402/extensions/builder-code");
  client.registerExtension(new BuilderCodeClientExtension(code));
}
