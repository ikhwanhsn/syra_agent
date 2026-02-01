import { ATXPAccount, atxpClient, SolanaAccount } from "@atxp/client";

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const query = url.searchParams.get("query");
  if (!query) {
    return new Response(
      JSON.stringify({ status: "error", message: "query is required" }),
      {
        status: 400,
      }
    );
  }

  const xLiveSearchService = {
    mcpServer: "https://x-live-search.mcp.atxp.ai/",
    toolName: "x_live_search",
    asyncSearchToolName: "x_live_search_async",
    getSearchAsyncToolName: "x_get_search_async",
    description: "ATXP X Live Search MCP server",
    getArguments: (params: {
      query: string;
      allowed_x_handles?: string[];
      excluded_x_handles?: string[];
      from_date?: string;
      to_date?: string;
      enable_image_understanding?: boolean;
      enable_video_understanding?: boolean;
      enable_web_search?: boolean;
      allowed_domains?: string[];
    }) => params,
    getResult: (result: any) => {
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
    getAsyncCreateResult: (result: any) => {
      const jsonResult = result.content[0].text;
      const parsed = JSON.parse(jsonResult);
      return { taskId: parsed.taskId };
    },
    getAsyncStatusResult: (result: any) => {
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

  // Read the ATXP account details from environment variables
  const atxpConnectionString = process.env.ATXP_CONNECTION as string;

  // Create a client using the `atxpClient` function
  const client = await atxpClient({
    mcpServer: xLiveSearchService.mcpServer,
    account: new ATXPAccount(atxpConnectionString),
  });

  const searchParams = {
    query: query,
    // allowed_x_handles: ["stripe"],
    from_date: "2025-01-01",
  };

  try {
    // Start async search
    const asyncResult = await client.callTool({
      name: xLiveSearchService.asyncSearchToolName,
      arguments: xLiveSearchService.getArguments(searchParams),
    });
    const { taskId } = xLiveSearchService.getAsyncCreateResult(asyncResult);

    // Poll for completion
    let completed = false;
    while (!completed) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResult = await client.callTool({
        name: xLiveSearchService.getSearchAsyncToolName,
        arguments: { taskId },
      });
      const { status, result, error } =
        xLiveSearchService.getAsyncStatusResult(statusResult);

      if (status === "completed") {
        completed = true;
        return new Response(JSON.stringify({ message: result }));
      } else if (status === "error") {
        completed = true;
      }
    }
  } catch (error) {
    process.exit(1);
  }
};
