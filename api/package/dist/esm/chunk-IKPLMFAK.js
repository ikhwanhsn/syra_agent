// src/shared/request/build.ts
function buildRequest(input, context) {
  const headers = buildRequestHeaders(input.headers, context);
  if (input.body && headers.get("Content-Type") === null) {
    headers.set("Content-Type", "application/json");
  }
  return new Request(input.url, {
    method: input.method,
    body: input.body,
    headers
  });
}
function buildRequestHeaders(heads, context) {
  const { wallets, flags } = context;
  const headers = new Headers(heads);
  headers.set("X-Wallet-Address", wallets.evm.address);
  headers.set("X-Solana-Wallet-Address", wallets.svm.address);
  headers.set("X-Session-ID", flags.sessionId);
  headers.set("X-Client-ID", flags.provider);
  return headers;
}

export {
  buildRequest,
  buildRequestHeaders
};
//# sourceMappingURL=chunk-IKPLMFAK.js.map