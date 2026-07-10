---
name: syra-scaffold-client
description: Scaffold a typed Syra API client module using @syra-ai/sdk with x402 auto-pay and standard response handling
---

# Scaffold Syra Client

Create a reusable `syraClient.ts` module for the current project.

## Steps

1. **Install dependency**

```bash
npm install @syra-ai/sdk
```

2. **Create `src/lib/syraClient.ts`** (adjust path to match project structure):

```typescript
import {
  createSyraPaidClient,
  type SyraApiResponse,
  SYRA_HIGH_VALUE_ROUTES,
} from "@syra-ai/sdk";

let clientPromise: ReturnType<typeof createSyraPaidClient> | null = null;

export async function getSyraClient() {
  if (!clientPromise) {
    clientPromise = createSyraPaidClient({
      baseUrl: process.env.SYRA_API_BASE_URL ?? "https://api.syraa.fun",
    });
  }
  return clientPromise;
}

export async function syraGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const syra = await getSyraClient();
  const result: SyraApiResponse<T> = await syra.get(path, params);
  if (!result.success) {
    throw new Error(result.error ?? `Syra GET ${path} failed`);
  }
  return result.data as T;
}

export async function syraPost<T>(path: string, body?: unknown): Promise<T> {
  const syra = await getSyraClient();
  const result: SyraApiResponse<T> = await syra.post(path, body);
  if (!result.success) {
    throw new Error(result.error ?? `Syra POST ${path} failed`);
  }
  return result.data as T;
}

export { SYRA_HIGH_VALUE_ROUTES };
```

3. **Add env vars** to `.env.example` (not `.env`):

```env
SYRA_API_BASE_URL=https://api.syraa.fun
SYRA_PAYER_KEYPAIR=
```

4. **Usage example** — Create or update a test/demo file:

```typescript
import { syraGet } from "./lib/syraClient";

const news = await syraGet<unknown>("/news", { ticker: "BTC" });
console.log(news);
```

5. **Verify** — Run the example; expect data or a clear error about missing payer.

## Variants

- **Custom signer:** Replace `createSyraPaidClient` with `createSyraClient({ signer })`.
- **Pillar modules:** `const syra = await getSyraClient(); await syra.pillars.invest.opportunities();`
- **Low-level fetch:** Import from `@syra-ai/sdk/payment` for raw x402-wrapped fetch.

## Security

- Never commit `SYRA_PAYER_KEYPAIR` to the repository
- Add `.env` to `.gitignore` if not already present
- Document required env vars in `.env.example` only
