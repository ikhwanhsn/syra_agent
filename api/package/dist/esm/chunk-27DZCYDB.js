// src/cli/commands/install/clients.ts
var Clients = /* @__PURE__ */ ((Clients2) => {
  Clients2["ClaudeCode"] = "claude-code";
  Clients2["Cursor"] = "cursor";
  Clients2["Codex"] = "codex";
  Clients2["OpenCode"] = "opencode";
  Clients2["Claude"] = "claude";
  Clients2["Cline"] = "cline";
  Clients2["Windsurf"] = "windsurf";
  Clients2["Warp"] = "warp";
  Clients2["GeminiCli"] = "gemini-cli";
  Clients2["Goose"] = "goose";
  Clients2["Zed"] = "zed";
  return Clients2;
})(Clients || {});
var clients = Object.values(Clients);
var clientMetadata = {
  ["claude-code" /* ClaudeCode */]: {
    name: "Claude Code",
    description: "Claude Code is a code editor that uses the Claude API.",
    website: "https://claude.com"
  },
  ["cursor" /* Cursor */]: {
    name: "Cursor",
    description: "Cursor is a code editor that uses the Cursor API.",
    website: "https://cursor.com"
  },
  ["opencode" /* OpenCode */]: {
    name: "OpenCode",
    description: "OpenCode is a code editor that uses the OpenCode API.",
    website: "https://opencode.ai"
  },
  ["claude" /* Claude */]: {
    name: "Claude Desktop",
    description: "Claude is a code editor that uses the Claude API.",
    website: "https://claude.com"
  },
  ["codex" /* Codex */]: {
    name: "Codex",
    description: "Codex is a code editor that uses the Codex API.",
    website: "https://codex.com"
  },
  ["cline" /* Cline */]: {
    name: "Cline",
    description: "Cline is a code editor that uses the Cline API.",
    website: "https://cline.com"
  },
  ["windsurf" /* Windsurf */]: {
    name: "Windsurf",
    description: "Windsurf is a code editor that uses the Windsurf API.",
    website: "https://windsurf.com"
  },
  ["warp" /* Warp */]: {
    name: "Warp",
    description: "Warp is a code editor that uses the Warp API.",
    website: "https://warp.com"
  },
  ["gemini-cli" /* GeminiCli */]: {
    name: "Gemini CLI",
    description: "Gemini CLI is a code editor that uses the Gemini CLI API.",
    website: "https://gemini-cli.com"
  },
  ["goose" /* Goose */]: {
    name: "Goose",
    description: "Goose is a code editor that uses the Goose API.",
    website: "https://goose.com"
  },
  ["zed" /* Zed */]: {
    name: "Zed",
    description: "Zed is a code editor that uses the Zed API.",
    website: "https://zed.com"
  }
};

export {
  Clients,
  clients,
  clientMetadata
};
//# sourceMappingURL=chunk-27DZCYDB.js.map