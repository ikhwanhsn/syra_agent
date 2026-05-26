// src/cli/commands/server.ts
var serverCommand = async (args) => {
  if (process.stdout.isTTY) {
    process.stdout.write(
      "MCP server started. If you meant to explore the CLI, run: npx agentcash --help\n"
    );
  }
  const { startServer } = await import("./server-NHOKDQHU.js");
  await startServer(args);
};
export {
  serverCommand
};
//# sourceMappingURL=server-ZIKTGUST.js.map