export const browseService = {
  mcpServer: "https://browse.mcp.atxp.ai/",
  runTaskToolName: "browse_run_task",
  getTaskToolName: "browse_get_task",
  description: "ATXP Browse MCP server",
  getArguments: (prompt) => ({ instructions: prompt }),
  getRunTaskResult: (result) => JSON.parse(result.content[0].text).id,
  getGetTaskResult: (result) => JSON.parse(result.content[0].text),
};
