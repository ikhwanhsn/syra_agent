import { describe, expect, it } from "vitest";
import {
  buildX402DiscoveryFlowsFromOpenApi,
  buildX402DiscoveryFlowsFromTemplates,
  parseDiscoverySegmentsFromWellKnown,
} from "./x402OpenApiToExampleFlows";
import { X402_DISCOVERY_RESOURCE_PATHS } from "./x402DiscoveryResourcePaths";

describe("x402OpenApiToExampleFlows", () => {
  it("builds one flow per generated discovery segment", () => {
    const flows = buildX402DiscoveryFlowsFromTemplates("https://api.syraa.fun");
    expect(flows.length).toBe(X402_DISCOVERY_RESOURCE_PATHS.length);
    expect(flows.some((f) => f.id === "x402-pumpfun-scout")).toBe(true);
    expect(flows.some((f) => f.id === "x402-rise")).toBe(true);
    expect(flows.some((f) => f.id === "x402-coingecko")).toBe(true);
  });

  it("parses segments from well-known resources", () => {
    const segments = parseDiscoverySegmentsFromWellKnown(
      {
        resources: [
          "https://api.syraa.fun/pumpfun/scout",
          "https://api.syraa.fun/rise",
        ],
      },
      "https://api.syraa.fun",
    );
    expect(segments).toEqual(["pumpfun/scout", "rise"]);
  });

  it("maps openapi query params onto playground flows", () => {
    const openapi = {
      paths: {
        "/pumpfun/scout": {
          get: {
            summary: "Live pump.fun scout",
            parameters: [
              {
                name: "segment",
                in: "query",
                schema: { type: "string", default: "alpha" },
              },
            ],
          },
        },
      },
    };
    const flows = buildX402DiscoveryFlowsFromOpenApi(
      "https://api.syraa.fun",
      ["pumpfun/scout"],
      openapi,
    );
    expect(flows).toHaveLength(1);
    expect(flows[0]?.params.some((p) => p.key === "segment" && p.enabled)).toBe(
      true,
    );
  });
});
