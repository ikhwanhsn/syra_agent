import {
  TOOL_PARAMS
} from "./chunk-3PYQIEMA.js";
import {
  executeFetch
} from "./chunk-JVMJVMWB.js";
import {
  safeParseResponse
} from "./chunk-BFOYXXLG.js";
import {
  log
} from "./chunk-QZCSZB7E.js";

// src/operations/search.ts
import z from "zod";
var AGENTCASH_SEARCH_URL = process.env.AGENTCASH_SEARCH_URL ?? "https://agentcash.dev/api/search";
var searchSchema = z.object({
  query: z.string().min(1).describe(TOOL_PARAMS.search.query),
  broad: z.boolean().optional().describe(TOOL_PARAMS.search.broad),
  limit: z.number().int().min(1).max(50).optional().describe(TOOL_PARAMS.search.limit),
  page: z.number().int().min(1).optional().describe(TOOL_PARAMS.search.page)
});
async function search(args, options) {
  const parsed = searchSchema.safeParse(args);
  if (!parsed.success) {
    return {
      success: false,
      cause: "invalid_input",
      message: parsed.error.message
    };
  }
  const { surface, wallets, flags } = options;
  log.info(`[search] Searching for: ${parsed.data.query}`);
  const fetchResult = await executeFetch(
    {
      url: AGENTCASH_SEARCH_URL,
      method: "POST" /* POST */,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: parsed.data.query,
        ...parsed.data.broad ? { broad: true } : {},
        ...parsed.data.limit ? { limit: parsed.data.limit } : {},
        ...parsed.data.page ? { page: parsed.data.page } : {}
      })
    },
    {
      surface,
      wallets,
      flags,
      params: {}
    }
  );
  if (fetchResult.isErr()) {
    return {
      success: false,
      cause: fetchResult.error.cause,
      message: fetchResult.error.message
    };
  }
  const { response } = fetchResult.value;
  if (!response.ok) {
    const parseResult2 = await safeParseResponse(surface, response);
    return {
      success: false,
      cause: "http",
      message: `Search API returned ${response.status}: ${response.statusText}`,
      details: parseResult2.match(
        (data) => data.type === "json" || data.type === "text" ? data.data : void 0,
        () => void 0
      )
    };
  }
  const parseResult = await safeParseResponse(surface, response);
  if (parseResult.isErr()) {
    return {
      success: false,
      cause: parseResult.error.cause,
      message: parseResult.error.message
    };
  }
  const parsedResponse = parseResult.value;
  return {
    success: true,
    results: parsedResponse.type === "json" || parsedResponse.type === "text" ? parsedResponse.data : { type: parsedResponse.type }
  };
}

export {
  searchSchema,
  search
};
//# sourceMappingURL=chunk-ONGJJBKT.js.map