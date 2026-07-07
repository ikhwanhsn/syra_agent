import { randomBytes } from "node:crypto";
import { preferMainnetSolanaAccepts } from "./x402Network.js";
function isExtensionRequired(extSpec) {
    if (!extSpec || typeof extSpec !== "object")
        return false;
    if (extSpec.info?.required === true)
        return true;
    const top = extSpec.schema?.required;
    return Array.isArray(top) && top.length > 0;
}
function generatePaymentIdentifier() {
    return `pay_${randomBytes(16).toString("hex")}`;
}
export function registerRequiredExtensionsHook(client) {
    client.onBeforePaymentCreation((context) => {
        preferMainnetSolanaAccepts(context?.paymentRequired);
    });
    client.onAfterPaymentCreation((context) => {
        const payload = context?.paymentPayload;
        const ext = payload?.extensions;
        if (!payload || !ext || typeof ext !== "object")
            return;
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
export async function registerBuilderCodeClientExtension(client) {
    if (!client.registerExtension)
        return;
    const code = String(process.env.BASE_BUILDER_CODE || process.env.SYRA_BASE_BUILDER_CODE || "").trim();
    if (!code || !/^[a-z0-9_]{1,32}$/.test(code))
        return;
    const { BuilderCodeClientExtension } = await import("@x402/extensions/builder-code");
    client.registerExtension(new BuilderCodeClientExtension(code));
}
