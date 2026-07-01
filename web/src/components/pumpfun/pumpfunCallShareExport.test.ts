import { describe, expect, it } from "vitest";
import { buildPumpfunCallShareFilename } from "@/components/pumpfun/pumpfunCallShareExport";

describe("pumpfunCallShareExport", () => {
  it("builds a safe download filename", () => {
    expect(buildPumpfunCallShareFilename("ZAUTH", "call-123")).toBe(
      "syra-pumpfun-zauth-call-123.png",
    );
  });
});
