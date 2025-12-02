export const researchService = {
  mcpServer: "https://research.mcp.atxp.ai/",
  quickResearchToolName: "research_quick_research",
  deepResearchToolName: "research_deep_research",
  description: "ATXP Research MCP server",
  getQuickResearchArguments: (question) => ({ messages: [question] }),
  getQuickResearchResult: (result) => JSON.parse(result.content[0].text),
  getDeepResearchArguments: (question) => ({ messages: [question] }),
  getDeepResearchResult: (result) => JSON.parse(result.content[0].text),
};
