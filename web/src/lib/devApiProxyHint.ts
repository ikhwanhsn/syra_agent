import { env } from "@/lib/env";

const LOCAL_API_UNREACHABLE = "Local API gateway unreachable";

/** Vite returns 500 with an empty body when the /api proxy cannot connect upstream. */
export function enrichEmptyDevProxy500(
  status: number,
  body: string,
  requestUrl: string,
): string {
  if (!env.isDev || !env.useLocalApi) return body;
  if (status !== 500) return body;
  if (body.trim()) return body;

  const trimmed = requestUrl.trim();
  const usesSyraDevProxy =
    trimmed.startsWith("/api/") ||
    trimmed === "/api" ||
    trimmed.startsWith("/api?");

  if (!usesSyraDevProxy) return body;

  return JSON.stringify(
    {
      error: LOCAL_API_UNREACHABLE,
      message:
        "VITE_USE_LOCAL_API is enabled but nothing is listening on localhost:3000.",
      fix: [
        "Run the gateway: cd api && npm run dev",
        "Or use production API: set VITE_USE_LOCAL_API=false in web/.env.local",
      ],
    },
    null,
    2,
  );
}

export function isLocalApiUnreachableBody(body: string | undefined): boolean {
  return !!body?.includes(LOCAL_API_UNREACHABLE);
}
