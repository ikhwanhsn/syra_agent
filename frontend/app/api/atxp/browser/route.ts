import { ATXPAccount, atxpClient, SolanaAccount } from "@atxp/client";

export const GET = async (req: Request) => {
  const browseService = {
    mcpServer: "https://browse.mcp.atxp.ai/",
    runTaskToolName: "browse_run_task",
    getTaskToolName: "browse_get_task",
    description: "ATXP Browse MCP server",
    getArguments: (prompt: string) => ({ instructions: prompt }),
    getRunTaskResult: (result: any) => JSON.parse(result.content[0].text).id,
    getGetTaskResult: (result: any) => JSON.parse(result.content[0].text),
  };

  // Read the ATXP account details from environment variables
  const atxpConnectionString = process.env.ATXP_CONNECTION as string;

  // Create a client using the `atxpClient` function
  const client = await atxpClient({
    mcpServer: browseService.mcpServer,
    account: new ATXPAccount(atxpConnectionString),
  });

  const prompt =
    "What are the top 3 articles by points on https://news.ycombinator.com?";

  try {
    const result = await client.callTool({
      name: browseService.runTaskToolName,
      arguments: browseService.getArguments(prompt),
    });
    console.log(`${browseService.description} runTask result successful!`);
    const taskId = browseService.getRunTaskResult(result);

    const pollInterval = 5000; // 5 seconds

    while (true) {
      const taskResult = await client.callTool({
        name: browseService.getTaskToolName,
        arguments: { taskId },
      });

      const taskData = browseService.getGetTaskResult(taskResult);
      console.log(`${browseService.description} runTask result successful!`);

      // Check if task is complete
      if (["finished", "stopped", "failed"].includes(taskData.status)) {
        console.log(`${browseService.description} result successful!`);
        console.log(`Task completed with data: ${JSON.stringify(taskData)}`);
        return new Response(JSON.stringify({ message: taskData }));
        // break;
      }

      // Wait before next poll
      console.log(`${browseService.description} result pending.`);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  } catch (error) {
    console.error(`Error with ${browseService.description}:`, error);
    process.exit(1);
  }
};
