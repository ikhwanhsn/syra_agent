import { describe, expect, it } from "vitest";
import {
  buildFlowCardDisplay,
  formatFlowPriceUsd,
  getParamPreview,
  parseFlowLabel,
} from "./x402FlowCardMeta";
import type { ExampleFlowPreset } from "@/hooks/useApiPlayground";

describe("x402FlowCardMeta", () => {
  it("parses name and summary from label", () => {
    expect(parseFlowLabel("RISE Scout: Live RISE market intel")).toEqual({
      name: "RISE Scout",
      summary: "Live RISE market intel",
    });
  });

  it("formats catalog prices", () => {
    expect(formatFlowPriceUsd("0.1")).toBe("$0.1");
    expect(formatFlowPriceUsd("0.01")).toBe("$0.01");
  });

  it("builds param preview from enabled params", () => {
    const { preview, extraCount } = getParamPreview([
      { key: "segment", value: "alpha", enabled: true, description: "" },
      { key: "period", value: "today", enabled: true, description: "" },
      { key: "llm", value: "false", enabled: false, description: "" },
    ]);
    expect(preview).toEqual([
      { key: "segment", value: "alpha" },
      { key: "period", value: "today" },
    ]);
    expect(extraCount).toBe(0);
  });

  it("builds rich card display from catalog meta", () => {
    const flow: ExampleFlowPreset = {
      id: "x402-pumpfun-scout",
      label: "pump.fun Scout: Live pump.fun scout",
      method: "GET",
      url: "https://api.syraa.fun/pumpfun/scout",
      params: [{ key: "segment", value: "alpha", enabled: true, description: "" }],
      catalogMeta: {
        segment: "pumpfun/scout",
        name: "pump.fun Scout",
        summary: "Live pump.fun alpha/beta/predicted/utility scout",
        description: "Returns scored tokens and analysis.",
        priceUsd: "0.1",
        category: "analytics",
      },
    };
    const card = buildFlowCardDisplay(flow, "/pumpfun/scout", "pump.fun");
    expect(card.name).toBe("pump.fun Scout");
    expect(card.priceLabel).toBe("$0.1");
    expect(card.paramPreview[0]?.key).toBe("segment");
  });
});
