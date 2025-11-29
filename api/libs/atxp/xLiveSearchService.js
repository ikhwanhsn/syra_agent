export const xLiveSearchService = {
  mcpServer: "https://x-live-search.mcp.atxp.ai/",
  toolName: "x_live_search",
  asyncSearchToolName: "x_live_search_async",
  getSearchAsyncToolName: "x_get_search_async",
  description: "ATXP X Live Search MCP server",
  getArguments: (params) => params,
  getResult: (result) => {
    const jsonResult = result.content[0].text;
    const parsed = JSON.parse(jsonResult);
    return {
      status: parsed.status,
      query: parsed.query,
      message: parsed.message,
      citations: parsed.citations,
      toolCalls: parsed.toolCalls,
      errorMessage: parsed.errorMessage,
    };
  },
  getAsyncCreateResult: (result) => {
    const jsonResult = result.content[0].text;
    const parsed = JSON.parse(jsonResult);
    return { taskId: parsed.taskId };
  },
  getAsyncStatusResult: (result) => {
    const jsonResult = result.content[0].text;
    const parsed = JSON.parse(jsonResult);
    return {
      status: parsed.status,
      result: parsed.result,
      error: parsed.error,
      createdAt: parsed.createdAt,
      completedAt: parsed.completedAt,
    };
  },
};
