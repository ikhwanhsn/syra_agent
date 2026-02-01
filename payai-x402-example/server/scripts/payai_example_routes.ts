import type { Express, Request, Response } from "express";
import type { x402ResourceServer } from "@x402/core/server";
import { decodePaymentSignatureHeader, encodePaymentRequiredHeader, encodePaymentResponseHeader } from "@x402/core/http";
import type { Network, PaymentPayload, PaymentRequired, PaymentRequirements } from "@x402/core/types";
import { ExpressAdapter } from "@x402/express";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";

export type PayAiExampleConfig = {
  solanaNetwork: Network;
  solanaPayTo: string;
  baseNetwork: Network;
  basePayTo: string;
};

export type PayAiExampleAssets = {
  solanaUsdcMint: string;
  baseUsdc: string;
};

const PRICE_USD = 0.01;
const PRICE_STR = "$0.01";
const PRICE_ATOMIC_USDC = String(Math.round(PRICE_USD * 1_000_000)); // "10000"

function normalizeEvmAddress(a: string): string {
  return String(a || "").trim().toLowerCase();
}

function ensureEvmEip712Domain(requirements: PaymentRequirements[]): PaymentRequirements[] {
  // Wurk does a more complete enrichment (chainId/decimals/spender/etc). For this example server,
  // x402scan only needs EIP-712 domain `name` + `version` to build the EVM payment payload.
  // If these are missing, x402scan shows:
  // "EIP-712 domain parameters (name, version) are required in payment requirements ..."
  return requirements.map((r) => {
    if (!r || typeof r !== "object") return r;
    if (!String((r as any).network || "").startsWith("eip155:")) return r;
    const existing: any = (r as any).extra && typeof (r as any).extra === "object" ? (r as any).extra : {};
    const existingEip712: any = existing?.eip712 && typeof existing.eip712 === "object" ? existing.eip712 : {};

    const name = existingEip712?.name || existing?.name || "USD Coin";
    const version = existingEip712?.version || existing?.version || "2";

    const nextExtra = {
      ...existing,
      name,
      version,
      eip712: {
        ...existingEip712,
        name,
        version,
      },
    };

    return { ...(r as any), extra: nextExtra } as PaymentRequirements;
  });
}

function getPaymentSignatureHeaderFromReq(req: Request): string {
  // Support both x402 v2 (PAYMENT-SIGNATURE) and legacy header naming (x-payment)
  const h =
    String(req.header("PAYMENT-SIGNATURE") || req.header("payment-signature") || "").trim() ||
    String(req.header("x-payment") || req.header("X-Payment") || "").trim();
  return h;
}

function json402(res: Response, paymentRequired: PaymentRequired): void {
  res.setHeader("Payment-Required", encodePaymentRequiredHeader(paymentRequired));
  res.status(402).type("application/json").send(paymentRequired);
}

async function buildPaymentRequired(
  resourceServer: x402ResourceServer,
  req: Request,
  cfg: PayAiExampleConfig,
  assets: PayAiExampleAssets,
  which: "solana" | "base",
  error: string | undefined,
): Promise<PaymentRequired> {
  const adapter = new ExpressAdapter(req);
  const network = which === "solana" ? cfg.solanaNetwork : cfg.baseNetwork;
  const payTo = which === "solana" ? cfg.solanaPayTo : cfg.basePayTo;
  const asset = which === "solana" ? assets.solanaUsdcMint : assets.baseUsdc;

  // Build requirements via the registered scheme server + facilitator support.
  // NOTE: We intentionally do NOT deep-equal match on re-built requirements later; we validate
  // a safe subset and then verify/settle against the accepted requirements in the payload.
  const paymentOptions = [
    {
      scheme: "exact",
      price: { asset, amount: PRICE_ATOMIC_USDC },
      network,
      payTo,
      maxTimeoutSeconds: 60,
    },
  ];

  const ctx: any = {
    adapter,
    path: req.path,
    method: req.method,
    paymentHeader: getPaymentSignatureHeaderFromReq(req),
  };

  let requirements: PaymentRequirements[] = await (resourceServer as any).buildPaymentRequirementsFromOptions(
    paymentOptions,
    ctx,
  );
  if (String(network).startsWith("eip155:")) {
    requirements = ensureEvmEip712Domain(requirements);
  }

  const description =
    which === "solana"
      ? "Example x402 endpoint (Solana) - returns a simple JSON response after payment"
      : "Example x402 endpoint (Base/EVM) - returns a simple JSON response after payment";

  const resourceInfo = { url: adapter.getUrl(), description, mimeType: "application/json" };
  const outputExample = { ok: true, paid: true, message: "this endpoint is working, payment received." };

  const declared = declareDiscoveryExtension({
      input: {},
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      ...(req.method === "POST" ? { bodyType: "json" as const } : {}),
      output: { example: outputExample },
  });

  // IMPORTANT (matches Wurk quick endpoints):
  // When you are not using paymentMiddleware's route-key inference, you must
  // bake the HTTP method into the bazaar extension via enrichExtensions.
  const extensions = resourceServer.enrichExtensions(declared as any, { method: req.method, adapter: {} } as any);

  return (resourceServer as any).createPaymentRequiredResponse(requirements, resourceInfo, error, extensions);
}

export function registerPayAiExampleX402Routes(
  app: Express,
  resourceServer: x402ResourceServer,
  cfg: PayAiExampleConfig,
  assets: PayAiExampleAssets,
): void {
  let initPromise: Promise<void> | null = null;
  async function ensureInitialized(): Promise<void> {
    if (!initPromise) {
      initPromise = resourceServer.initialize().catch((e) => {
        initPromise = null;
        throw e;
      });
    }
    await initPromise;
  }

  async function handle(req: Request, res: Response, which: "solana" | "base"): Promise<void> {
    await ensureInitialized();

    const paymentHeader = getPaymentSignatureHeaderFromReq(req);
    if (!paymentHeader) {
      const pr = await buildPaymentRequired(resourceServer, req, cfg, assets, which, "Payment required");
      json402(res, pr);
      return;
    }

    let payload: PaymentPayload;
    try {
      payload = decodePaymentSignatureHeader(paymentHeader) as PaymentPayload;
    } catch (e: any) {
      const pr = await buildPaymentRequired(
        resourceServer,
        req,
        cfg,
        assets,
        which,
        `Invalid PAYMENT-SIGNATURE header: ${e?.message || "failed to decode"}`,
      );
      json402(res, pr);
      return;
    }

    // Basic sanity checks
    if (payload.x402Version !== 2 || !payload.accepted) {
      const pr = await buildPaymentRequired(resourceServer, req, cfg, assets, which, "Unsupported x402 payload");
      json402(res, pr);
      return;
    }

    const expectedNetwork = which === "solana" ? cfg.solanaNetwork : cfg.baseNetwork;
    const expectedPayTo = which === "solana" ? cfg.solanaPayTo : cfg.basePayTo;
    const expectedAsset = which === "solana" ? assets.solanaUsdcMint : assets.baseUsdc;

    const acc = payload.accepted;
    const payToOk =
      which === "base"
        ? normalizeEvmAddress(acc.payTo) === normalizeEvmAddress(expectedPayTo)
        : String(acc.payTo) === String(expectedPayTo);
    const assetOk =
      which === "base"
        ? normalizeEvmAddress(acc.asset) === normalizeEvmAddress(expectedAsset)
        : String(acc.asset) === String(expectedAsset);

    if (
      acc.scheme !== "exact" ||
      acc.network !== expectedNetwork ||
      !payToOk ||
      !assetOk ||
      String(acc.amount) !== PRICE_ATOMIC_USDC
    ) {
      const pr = await buildPaymentRequired(resourceServer, req, cfg, assets, which, "Payment requirements mismatch");
      json402(res, pr);
      return;
    }

    try {
      const verify = await (resourceServer as any).verifyPayment(payload, acc);
      if (!verify?.isValid) {
        const pr = await buildPaymentRequired(
          resourceServer,
          req,
          cfg,
          assets,
          which,
          verify?.invalidReason || "Payment verification failed",
        );
        json402(res, pr);
        return;
      }

      const settle = await (resourceServer as any).settlePayment(payload, acc);
      if (!settle?.success) {
        const pr = await buildPaymentRequired(
          resourceServer,
          req,
          cfg,
          assets,
          which,
          settle?.errorReason || "Settlement failed",
        );
        json402(res, pr);
        return;
      }

      // Attach canonical settlement header
      res.setHeader("Payment-Response", encodePaymentResponseHeader(settle));
      res.type("application/json").send({
        ok: true,
        paid: true,
        message: "this endpoint is working, payment received.",
      });
      return;
    } catch (e: any) {
      const pr = await buildPaymentRequired(
        resourceServer,
        req,
        cfg,
        assets,
        which,
        e?.message || "Payment verification/settlement threw",
      );
      json402(res, pr);
      return;
    }

  }

  app.all("/solana/example", (req, res) => {
    void handle(req, res, "solana");
  });
  app.all("/base/example", (req, res) => {
    void handle(req, res, "base");
  });
}

