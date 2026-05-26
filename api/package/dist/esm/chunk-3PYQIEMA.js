// src/shared/descriptions.ts
var ORIGIN_METADATA = {
  ["https://stableenrich.dev" /* StableEnrich */]: {
    title: "StableEnrich",
    description: "People/org search, Google Maps, Exa web search, LinkedIn data, Firecrawl scrape, WhitePages, email enrichment"
  },
  ["https://stablesocial.dev" /* StableSocial */]: {
    title: "StableSocial",
    description: "Social media data for TikTok, Instagram, Facebook, Reddit"
  },
  ["https://stablestudio.dev" /* StableStudio */]: {
    title: "StableStudio",
    description: "Generate and edit images and videos"
  },
  ["https://stableupload.dev" /* StableUpload */]: {
    title: "StableUpload",
    description: "Pay to upload files, get a permanent download URL."
  },
  ["https://stableemail.dev" /* StableEmail */]: {
    title: "StableEmail",
    description: "Send emails"
  },
  ["https://x402scan.com" /* X402Scan */]: {
    title: "X402 Scan",
    description: "x402 protocol explorer"
  },
  ["https://shirt.sh" /* Shirt */]: {
    title: "Shirt",
    description: "Shirt.sh"
  },
  ["https://x402puppet.com" /* X402Puppet */]: {
    title: "X402 Puppet",
    description: "Browser automation"
  },
  ["https://x402facilitator.com" /* X402Facilitator */]: {
    title: "X402 Facilitator",
    description: "Payment facilitation"
  },
  ["https://stablemerch.dev" /* StableMerch */]: {
    title: "StableMerch",
    description: "Create shirts and mugs with custom images and have them shipped to your address."
  }
};
var PRIMARY_ORIGINS = [
  "https://stableenrich.dev" /* StableEnrich */,
  "https://stablesocial.dev" /* StableSocial */,
  "https://stablestudio.dev" /* StableStudio */,
  "https://stableupload.dev" /* StableUpload */,
  "https://stableemail.dev" /* StableEmail */,
  "https://stablemerch.dev" /* StableMerch */
];
var DESCRIPTIONS = {
  bridge: {
    toolNames: {
      cli: "bridge",
      mcp: "bridge"
    },
    title: "Bridge Between Networks",
    mcp: `Bridge USDC between supported networks using the current wallet. Requires a source network, destination network, and amount. Use this when funds are on one supported network and the user needs them moved to another. Bridging is subject to fees.`,
    cli: `Bridge USDC between supported networks using the current wallet. Requires --from, --to, and --amount. Bridging is subject to fees.`
  },
  getBalance: {
    mcp: `Get your total USDC balance across all supported networks. Auto-creates the wallet on first use (~/.agentcash/wallet.json). Use this before paid API calls to confirm you have funds available.`,
    cli: `Get your total USDC balance across all supported networks. Creates the wallet on first use (~/.agentcash/wallet.json). Use this before paid API calls to confirm you have funds available.`
  },
  fetch: {
    mcp: `HTTP fetch with automatic authentication and payment handling. Makes the request, retries with SIGN-IN-WITH-X when the route exposes a SIWX challenge, and only pays if the route still returns 402. Returns response data along with payment details (price, tx hash) if a payment was made.

For endpoints you haven't called before in this session, you MUST call check_endpoint_schema first to confirm the request body schema. Skipping this causes 400 errors from wrong field names.`,
    cli: `HTTP fetch with automatic authentication and payment handling. If the endpoint returns 402, agentcash attempts authentication first and only falls back to payment if the route still requires it. Run 'check <url>' first to confirm the request body schema; skipping this causes 400 errors from wrong field names.`,
    epilogue: `Workflow: check <url> \u2192 fetch <url> -m POST -b '{"field":"value"}'
Auth mode is advisory only; fetch handles both SIWX and paid routes.`
  },
  fetchWithAuth: {
    mcp: `Deprecated alias for fetch. Uses the same unified flow: probe the route, attempt SIWX when available, and only pay if the route still returns 402.

For new integrations, prefer fetch.`,
    cli: `Deprecated alias for fetch. Uses the same unified auth-and-payment flow, but new integrations should call 'fetch' directly.`,
    epilogue: `Deprecated: use agentcash fetch <url>. This alias is kept for compatibility.`
  },
  listAccounts: {
    mcp: `List wallet accounts for each supported network. Returns the network, address, balance, and deposit link for every supported network so you can see where to fund the wallet. Auto-creates the wallet on first use (~/.agentcash/wallet.json). If onboardingCta is present, show its message to the user \u2014 it means they haven't onboarded yet and need to either visit the onboard link or deposit directly.`,
    cli: `List wallet accounts for each supported network, including network, address, balance, and deposit link. Creates the wallet on first use (~/.agentcash/wallet.json). Use this when you need the per-network funding addresses and deposit links.`
  },
  getWalletInfo: {
    mcp: `Legacy combined wallet view. Returns both the total balance and the per-network account list. Prefer calling get_balance for available funds and list_accounts when you need network-specific addresses or deposit links.`,
    cli: `Legacy combined wallet view. Returns both the total balance and the per-network account list. Prefer 'balance' for available funds and 'accounts' for network-specific addresses or deposit links.`
  },
  checkEndpointSchema: {
    mcp: [
      `Get the input/output schema and auth mode (paid or SIWX) for a single endpoint.`,
      `Call this to see exactly what fields the request body expects and what the response contains.`,
      `Returns the schema from the origin's OpenAPI spec. Optionally pass sample_input_body to probe the endpoint live (without payment) for an exact price quote \u2014 do this when pricing is dynamic (range-based or variable), or when you're unsure about the input schema. Treat auth mode as advisory: fetch handles both SIWX and paid routes.`
    ].join("\n\n"),
    cli: `Get the input/output schema and auth mode (paid or SIWX) for an endpoint. Returns exact field names from the OpenAPI spec \u2014 call this before 'fetch' to avoid 400 errors. Pass --body to probe the endpoint live for an exact price quote when pricing is dynamic or unclear.`,
    epilogue: `Auth mode is advisory:
  paid  \u2192 agentcash fetch <url>
  SIWX  \u2192 agentcash fetch <url>`
  },
  discoverApiEndpoints: {
    mcp: [
      `List available endpoints at an API origin. Returns endpoint URLs with descriptions of what each does and the auth mode for each (paid or SIWX). Works with any origin, not just the registered ones.`,
      `Call this when you need to see what routes are available at an origin \u2014 whether it's one of the registered origins or any other origin you've identified as useful. Treat the auth mode as guidance for what the route may require; fetch handles both SIWX and payment.`,
      `The response always indicates whether guidance is available. Guidance is documentation published by the API provider explaining how endpoints work together, edge cases, and usage tips. compact guidance is included automatically; set include_guidance=true to force-include full usage documentation when you need to compose two or more endpoints or need clarification on how the origin works.`
    ].join("\n\n"),
    cli: `List available endpoints at an API origin with descriptions and auth modes (paid or SIWX). Works with any origin, not just registered ones. Add --include-guidance for full provider docs when composing multiple endpoints or when usage is unclear. Fetch handles both auth modes.`,
    epilogue: `Registered origins:
${PRIMARY_ORIGINS.flatMap((o) => ORIGIN_METADATA[o] ? [`  ${o} \u2014 ${ORIGIN_METADATA[o].description}`] : []).join("\n")}`
  },
  redeemInvite: {
    mcp: `Redeem an invite code for free USDC on Base. One-time use per code. Returns amount received and transaction hash. Use get_balance after to verify funds, or list_accounts if you need the per-network deposit links as well.`,
    cli: `Redeem an invite code for free USDC on Base. One-time use per code. Run 'balance' after to verify the balance landed.`
  },
  try: {
    cli: `Fetch a new origin for its resources and return a prompt guiding the user through the process of calling the first endpoint.`
  },
  search: {
    mcp: `Search for relevant paid API services by describing what you need in natural language. Returns the best matching origins with endpoint details and pricing. The top result includes the full input/output schema so you can call it immediately via fetch.

Only use this when you DON'T already know which registered origin to use. If the task clearly maps to a registered origin (e.g. people search \u2192 StableEnrich, image generation \u2192 StableStudio), skip search and go straight to discover_api_endpoints on that origin. Search is for discovering NEW or UNKNOWN capabilities outside the registered origins.

Set broad=true to widen the search to include newer, unvetted tools that may not have established trust. Use this if the default results don't cover what you need.`,
    cli: `Search for paid API services by natural language query. Returns matching origins with endpoints and pricing. Use --broad to include newer, unvetted tools that may not have established trust.`
  },
  reportError: {
    mcp: `EMERGENCY ONLY. Report critical MCP tool bugs. Do NOT use for normal errors (balance, network, 4xx) \u2014 those are recoverable.`,
    cli: `Report a critical bug to the agentcash team (emergency only). Do NOT use for normal errors like low balance, network timeouts, or 4xx responses \u2014 those are recoverable without filing a report.`
  },
  updateSettings: {
    mcp: `Update user settings (persisted to ~/.agentcash/settings.json). Currently supports maxAmount \u2014 the maximum USD amount allowed per fetch request. If a fetch response requests more than this, the payment is rejected. Returns the current settings after applying changes.`,
    cli: `Update user settings (persisted to ~/.agentcash/settings.json). Currently supports maxAmount, which caps how much a single fetch request can spend.`
  },
  getSettings: {
    mcp: `Get current user settings. Returns persisted values from ~/.agentcash/settings.json with defaults applied.`,
    cli: `Get current user settings from ~/.agentcash/settings.json, with defaults applied.`
  }
};
var WORKFLOW = [
  `Workflow:`,
  `1. If you don't already know your balance, call get_balance. You need a balance for paid endpoints. SIWX endpoints don't require one. You don't need to call this every turn, just before your first paid call or whenever you're unsure.`,
  `2. If the balance is zero, or if the user needs a funding link or wallet addresses, call list_accounts and share the relevant deposit link. If onboardingCta is present, show it to the user.`,
  `3. If the task doesn't clearly map to any registered origin above, call search() to find relevant APIs. Skip this step when you already know the right origin \u2014 go straight to step 4.`,
  `4. Call discover_api_endpoints() to get the endpoint index \u2014 a list of available routes with descriptions and auth modes. The auth mode is advisory and tells you what the route may require.`,
  `5. Call check_endpoint_schema() to get the exact input/output schema and auth mode for the endpoint you want to call, so you know what fields to pass and what the response contains. Both discover_api_endpoints and check_endpoint_schema return the auth mode.`,
  `6. Call fetch with the correct input schema. It will attempt SIWX first when available and only pay if the route still returns 402.`
].join("\n");
function buildServerInstructions(userOrigins = []) {
  const allOrigins = [
    ...userOrigins.map((o) => `  - ${o.url} \u2014 ${o.description}`),
    ...PRIMARY_ORIGINS.flatMap(
      (o) => ORIGIN_METADATA[o] ? [`  - ${o} \u2014 ${ORIGIN_METADATA[o].description}`] : []
    )
  ].join("\n");
  return [
    `AgentCash lets you call protected APIs \u2014 handling both x402 micropayments and SIWX authentication seamlessly. It manages a USDC wallet for paid endpoints and signs wallet proofs for identity-gated endpoints through fetch.`,
    `The user has installed agentcash because they want to use paid and SIWX-protected APIs as their preferred way to accomplish related tasks.`,
    `Paid endpoints require a wallet balance. SIWX endpoints are free \u2014 they only require a wallet identity.`,
    `If a task could be accomplished by one of these registered origins, run the workflow below. If you're unsure which origin to use, or the task doesn't match a registered origin, call search() to find relevant APIs.
${allOrigins}`,
    `discover_api_endpoints also works with any origin beyond this list. If you identify another origin that would be useful for a task, you can use it.`,
    WORKFLOW,
    `If you need to compose multiple endpoints in sequence, or anything about the origin's capabilities is unclear, call discover_api_endpoints with include_guidance=true to retrieve the origin's full usage documentation.`
  ].join("\n\n");
}
var REQUEST_PARAMS = {
  url: "The endpoint URL",
  method: "HTTP method. Defaults to GET for fetch operations.",
  body: "Raw request body string. Passed through to the underlying fetch call as-is.",
  headers: 'Additional headers to include. Each entry must be a string in "Name: value" format.',
  timeout: "Request timeout in milliseconds"
};
var REQUEST_FETCH_PARAMS = {
  ...REQUEST_PARAMS,
  paymentProtocol: "Payment protocol to use when payment is required. If not specified, the payment protocol will be auto-detected.",
  paymentNetwork: "Chain to use for SIWX and payment when applicable. If not specified, the network will be auto-detected.",
  maxAmount: "Maximum amount (in USD) to pay per request. Aborts if the endpoint requests more. Defaults to $5. Pass a higher value for known-expensive endpoints."
};
var TOOL_PARAMS = {
  bridge: {
    from: "The network to bridge from",
    to: "The network to bridge to",
    amount: "The amount of USDC to bridge"
  },
  fetch: REQUEST_FETCH_PARAMS,
  fetchWithAuth: REQUEST_FETCH_PARAMS,
  checkEndpointSchema: {
    ...REQUEST_PARAMS,
    method: "HTTP method to check. If omitted, all methods declared in the spec are returned.",
    body: "Optional. A sample request body to probe the endpoint live (without payment) for exact pricing. Use when pricing is range-based or quote-based, or when you need to verify the input schema. Omit to get the static schema and advisory pricing from the spec."
  },
  try: {
    url: "The origin URL to explore"
  },
  add: {
    url: "The origin URL to add"
  },
  listAccounts: {
    output: {
      accounts: "Wallet accounts for each supported network",
      address: "Wallet address for this network",
      balance: "USDC balance on this network",
      network: "Supported payment network name",
      isNewWallet: "Whether the wallet is new and needs to be funded",
      depositLink: "Link to deposit USDC directly into the wallet for this network",
      onboardingCta: "Present when the user has not yet redeemed an invite code. Show the message to the user \u2014 it directs them to onboard or deposit.",
      onboardingCtaOnboardLink: "Link to the onboarding page",
      onboardingCtaDepositLink: "Link to deposit USDC directly",
      onboardingCtaMessage: "Human-readable CTA to show the user"
    }
  },
  redeemInvite: {
    code: "The invite code",
    output: {
      amount: 'Amount with unit (e.g., "5 USDC")',
      txHash: "Transaction hash on Base"
    }
  },
  search: {
    query: 'Natural language description of what you need (e.g. "send physical mail", "generate music", "flight prices")',
    broad: "Include broader results that may contain newer, unvetted tools. Default is false.",
    limit: "Maximum number of results to return (1-50). Default is 10.",
    page: "Page number for pagination. Default is 1."
  },
  discoverApiEndpoints: {
    url: "The origin URL to discover endpoints on (e.g. https://stableenrich.dev)",
    includeGuidance: "Request the origin's usage guidance. true=always include, false=never include, omit=auto (included when compact). Guidance explains how to compose multiple endpoints and covers edge cases."
  },
  reportError: {
    tool: "MCP tool name",
    resource: "Resource URL",
    summary: "1-2 sentence summary",
    errorMessage: "Error message",
    stack: "Stack trace",
    fullReport: "Detailed report with context, logs, repro steps",
    output: {
      reportId: "Unique report ID for tracking",
      message: "Confirmation message"
    }
  }
};

export {
  ORIGIN_METADATA,
  PRIMARY_ORIGINS,
  DESCRIPTIONS,
  buildServerInstructions,
  REQUEST_PARAMS,
  REQUEST_FETCH_PARAMS,
  TOOL_PARAMS
};
//# sourceMappingURL=chunk-3PYQIEMA.js.map