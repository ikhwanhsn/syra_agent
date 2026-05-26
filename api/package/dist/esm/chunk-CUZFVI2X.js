import {
  wait
} from "./chunk-DZNSJ2BA.js";
import {
  clientMetadata
} from "./chunk-27DZCYDB.js";
import {
  INSTALL_PACKAGE_SPECIFIER
} from "./chunk-QOMU3YLK.js";
import {
  log,
  safeReadFile,
  safeWriteFile
} from "./chunk-QZCSZB7E.js";
import {
  resultFromThrowable
} from "./chunk-YWNBUUBR.js";

// src/cli/commands/install/2-add-server/index.ts
import fs2 from "fs";
import path3 from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { log as clackLog, confirm, outro, stream } from "@clack/prompts";

// src/cli/commands/install/2-add-server/lib/client-config-file.ts
import os2 from "os";
import path2 from "path";
import process3 from "process";
import fs from "fs";

// src/cli/commands/install/2-add-server/lib/platforms.ts
import os from "os";
import path from "path";
import process2 from "process";
import z from "zod";
var Platforms = /* @__PURE__ */ ((Platforms2) => {
  Platforms2["Windows"] = "win32";
  Platforms2["MacOS"] = "darwin";
  Platforms2["Linux"] = "linux";
  return Platforms2;
})(Platforms || {});
var getPlatformPath = () => {
  const platform = z.enum(Platforms).safeParse(process2.platform);
  if (!platform.success) {
    throw new Error(`Invalid platform: ${process2.platform}`);
  }
  const homeDir = os.homedir();
  switch (platform.data) {
    case "win32" /* Windows */:
      return {
        baseDir: process2.env.APPDATA ?? path.join(homeDir, "AppData", "Roaming"),
        vscodePath: path.join("Code", "User")
      };
    case "darwin" /* MacOS */:
      return {
        baseDir: path.join(homeDir, "Library", "Application Support"),
        vscodePath: path.join("Code", "User")
      };
    case "linux" /* Linux */:
      return {
        baseDir: process2.env.XDG_CONFIG_HOME ?? path.join(homeDir, ".config"),
        vscodePath: path.join("Code/User")
      };
    default:
      throw new Error(`Invalid platform: ${process2.platform}`);
  }
};

// src/cli/commands/install/2-add-server/lib/file-types.ts
import * as TOML from "@iarna/toml";
import yaml from "js-yaml";
import * as jsonc from "jsonc-parser";

// src/cli/commands/install/2-add-server/lib/result.ts
var errorType = "config";
var surface = "config_file";
var configResultFromThrowable = (fn, error) => resultFromThrowable(errorType, surface, fn, error);

// src/cli/commands/install/2-add-server/lib/file-types.ts
var parseContent = (fileContent, format, path4) => {
  return configResultFromThrowable(
    () => {
      let config;
      if (format === "yaml" /* YAML */) {
        config = yaml.load(fileContent);
      } else if (format === "toml" /* TOML */) {
        config = TOML.parse(fileContent);
      } else if (path4.endsWith(".jsonc")) {
        config = jsonc.parse(fileContent);
      } else {
        config = JSON.parse(fileContent);
      }
      return {
        config,
        fileContent
      };
    },
    (e) => ({
      cause: "parse_config",
      message: e instanceof Error ? e.message : "Failed to parse config file"
    })
  );
};
var parseClientConfig = async ({ format, path: path4 }) => {
  const readResult = await safeReadFile("config_file", path4);
  if (readResult.isErr()) return readResult;
  const parseResult = parseContent(readResult.value, format, path4);
  if (parseResult.isErr()) return parseResult;
  return parseResult;
};
var serializeJsonc = (config, originalContent) => {
  return configResultFromThrowable(
    () => {
      const modifications = [];
      for (const key of Object.keys(config)) {
        const keyPath = [key];
        const edits = jsonc.modify(originalContent, keyPath, config[key], {
          formattingOptions: { tabSize: 2, insertSpaces: true }
        });
        modifications.push(...edits);
      }
      return jsonc.applyEdits(originalContent, modifications);
    },
    (e) => ({
      cause: "serialize_config",
      message: e instanceof Error ? e.message : "Failed to serialize JSONC"
    })
  );
};
var serializeClientConfig = ({ format, path: path4 }, config, originalContent) => {
  if (format === "yaml" /* YAML */) {
    return yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
  }
  if (format === "toml" /* TOML */) {
    return TOML.stringify(config);
  }
  if (path4.endsWith(".jsonc") && originalContent) {
    const result = serializeJsonc(config, originalContent);
    if (result.isOk()) {
      return result.value;
    }
    console.log(`Error applying JSONC edits: ${result.error.message}`);
    console.log("Falling back to JSON.stringify (comments will be lost)");
    return JSON.stringify(config, null, 2);
  }
  return JSON.stringify(config, null, 2);
};
var stringifyObject = (config, format) => {
  if (format === "yaml" /* YAML */) {
    return yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
  }
  if (format === "toml" /* TOML */) {
    return TOML.stringify(config);
  }
  return JSON.stringify(config, null, 2);
};

// src/cli/commands/install/2-add-server/lib/client-config-file.ts
var getClientConfigFile = (client) => {
  const homeDir = os2.homedir();
  const { baseDir, vscodePath } = getPlatformPath();
  switch (client) {
    case "claude" /* Claude */:
      return {
        path: path2.join(baseDir, "Claude", "claude_desktop_config.json"),
        configKey: "mcpServers",
        format: "json" /* JSON */
      };
    case "cline" /* Cline */:
      return {
        path: path2.join(
          baseDir,
          vscodePath,
          "globalStorage",
          "saoudrizwan.claude-dev",
          "settings",
          "cline_mcp_settings.json"
        ),
        configKey: "mcpServers",
        format: "json" /* JSON */
      };
    case "windsurf" /* Windsurf */:
      return {
        path: path2.join(homeDir, ".codeium", "windsurf", "mcp_config.json"),
        configKey: "mcpServers",
        format: "json" /* JSON */
      };
    case "cursor" /* Cursor */:
      return {
        path: path2.join(homeDir, ".cursor", "mcp.json"),
        configKey: "mcpServers",
        format: "json" /* JSON */
      };
    case "warp" /* Warp */:
      return {
        path: "no-local-config",
        // it's okay this isn't a real path, we never use it
        configKey: "mcpServers",
        format: "json" /* JSON */
      };
    case "gemini-cli" /* GeminiCli */:
      return {
        path: path2.join(homeDir, ".gemini", "settings.json"),
        configKey: "mcpServers",
        format: "json" /* JSON */
      };
    case "claude-code" /* ClaudeCode */:
      return {
        path: path2.join(homeDir, ".claude.json"),
        configKey: "mcpServers",
        format: "json" /* JSON */
      };
    case "goose" /* Goose */:
      return {
        path: path2.join(homeDir, ".config", "goose", "config.yaml"),
        configKey: "extensions",
        format: "yaml" /* YAML */
      };
    case "zed" /* Zed */:
      return {
        path: process3.platform === "win32" ? path2.join(
          process3.env.APPDATA ?? path2.join(homeDir, "AppData", "Roaming"),
          "Zed",
          "settings.json"
        ) : path2.join(homeDir, ".config", "zed", "settings.json"),
        configKey: "context_servers",
        format: "json" /* JSON */
      };
    case "codex" /* Codex */:
      return {
        path: path2.join(
          process3.env.CODEX_HOME ?? path2.join(homeDir, ".codex"),
          "config.toml"
        ),
        configKey: "mcp_servers",
        format: "toml" /* TOML */
      };
    case "opencode" /* OpenCode */: {
      const jsonPath = path2.join(
        homeDir,
        ".config",
        "opencode",
        "opencode.json"
      );
      const jsoncPath = jsonPath.replace(".json", ".jsonc");
      if (fs.existsSync(jsoncPath)) {
        log.info(`Found .jsonc file for OpenCode, using: ${jsoncPath}`);
        return {
          path: jsoncPath,
          configKey: "mcp",
          format: "json" /* JSON */
        };
      }
      return {
        path: jsonPath,
        configKey: "mcp",
        format: "json" /* JSON */
      };
    }
    default:
      throw new Error(`Unknown client: ${String(client)}`);
  }
};

// src/cli/commands/install/2-add-server/lib/nested-values.ts
var getNestedValue = (obj, path4) => {
  const keys = path4.split(".");
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return void 0;
    }
  }
  return current;
};
var setNestedValue = (obj, path4, value) => {
  const keys = path4.split(".");
  const lastKey = keys.pop();
  if (!lastKey) return;
  const target = keys.reduce((current, key) => {
    current[key] ??= {};
    return current[key];
  }, obj);
  target[lastKey] = value;
};

// src/cli/commands/install/2-add-server/index.ts
var getDevPackageRoot = () => {
  let current = path3.dirname(fileURLToPath(import.meta.url));
  while (true) {
    const packageJson = path3.join(current, "package.json");
    const tsconfig = path3.join(current, "tsconfig.json");
    const entrypoint = path3.join(current, "src", "index.ts");
    if (fs2.existsSync(packageJson) && fs2.existsSync(tsconfig) && fs2.existsSync(entrypoint)) {
      return current;
    }
    const parent = path3.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return process.cwd();
};
var getMcpConfig = (globalFlags) => {
  if (globalFlags.dev) {
    const packageRoot = getDevPackageRoot();
    return {
      serverName: "agentcash",
      // MCP clients may launch this from outside the package directory, so
      // pass the package tsconfig explicitly to keep path aliases working.
      command: path3.join(
        packageRoot,
        "node_modules",
        ".bin",
        process.platform === "win32" ? "tsx.cmd" : "tsx"
      ),
      args: [
        "--tsconfig",
        path3.join(packageRoot, "tsconfig.json"),
        path3.join(packageRoot, "src", "index.ts"),
        "--dev"
      ]
    };
  }
  return {
    serverName: "agentcash",
    command: "npx",
    args: ["-y", `agentcash@${INSTALL_PACKAGE_SPECIFIER}`]
  };
};
var tryAddServer = async (client, globalFlags, options = {}) => {
  const { serverName, command, args } = getMcpConfig(globalFlags);
  const { name } = clientMetadata[client];
  if (client === "warp" /* Warp */) {
    if (globalFlags.yes || options.silent) {
      return {
        success: false,
        error: {
          client,
          name,
          path: "no-local-config",
          cause: "manual_install_required",
          message: "Warp requires a manual MCP installation through its UI"
        }
      };
    }
    clackLog.info(
      chalk.bold.yellow("Warp requires a manual installation through their UI.")
    );
    clackLog.message(
      "Please copy the following configuration object and add it to your Warp MCP config:"
    );
    console.log();
    console.log(
      JSON.stringify(
        {
          [serverName]: {
            command,
            args,
            working_directory: null,
            start_on_launch: true
          }
        },
        null,
        2
      )
    );
    console.log();
    clackLog.message(
      `Read Warp's documentation at https://docs.warp.dev/knowledge-and-collaboration/mcp`
    );
    const addedToWarp = await confirm({
      message: "Did you add the MCP server to your Warp config?"
    });
    if (!addedToWarp) {
      return {
        success: false,
        error: {
          client,
          name,
          path: "no-local-config",
          cause: "warp_mcp_server_not_added",
          message: "Warp MCP server not added"
        }
      };
    }
    return {
      success: true,
      value: {
        client,
        name,
        path: "no-local-config"
      }
    };
  }
  const clientFileTarget = getClientConfigFile(client);
  let config = {};
  let content = void 0;
  log.info(`Checking if config file exists at: ${clientFileTarget.path}`);
  if (!fs2.existsSync(clientFileTarget.path)) {
    log.info("Config file not found, creating default empty config");
    setNestedValue(config, clientFileTarget.configKey, {});
    log.info("Config created successfully");
    if (!globalFlags.yes) {
      await wait({
        startText: "Locating config file",
        stopText: `No config found, creating default empty config`,
        ms: 1e3
      });
    }
  } else {
    log.info("Config file found, reading config file content");
    const parseResult = await parseClientConfig(clientFileTarget);
    if (parseResult.isErr()) {
      return {
        success: false,
        error: {
          client,
          name,
          path: clientFileTarget.path,
          cause: parseResult.error.cause,
          message: `Error reading config: ${parseResult.error.message}`
        }
      };
    }
    const { config: rawConfig, fileContent } = parseResult.value;
    config = rawConfig;
    content = fileContent;
    const existingValue = getNestedValue(rawConfig, clientFileTarget.configKey);
    if (!existingValue) {
      setNestedValue(rawConfig, clientFileTarget.configKey, {});
    }
    if (!globalFlags.yes) {
      await wait({
        startText: `Locating config file`,
        stopText: `Config loaded from ${clientFileTarget.path}`,
        ms: 1e3
      });
    }
  }
  const servers = getNestedValue(config, clientFileTarget.configKey);
  if (!servers || typeof servers !== "object") {
    log.error(`Invalid ${clientFileTarget.configKey} structure in config`);
    return {
      success: false,
      error: {
        client,
        name,
        path: clientFileTarget.path,
        cause: "invalid_config",
        message: `Invalid ${clientFileTarget.configKey} structure in config`
      }
    };
  }
  if (client === "goose" /* Goose */) {
    servers[serverName] = {
      name: serverName,
      cmd: command,
      args,
      enabled: true,
      envs: {},
      type: "stdio",
      timeout: 300
    };
  } else if (client === "zed" /* Zed */) {
    servers[serverName] = {
      source: "custom",
      command,
      args,
      env: {}
    };
  } else if (client === "opencode" /* OpenCode */) {
    servers[serverName] = {
      type: "local",
      command: [command, ...args],
      enabled: true,
      environment: {}
    };
  } else {
    servers[serverName] = {
      command,
      args
    };
  }
  if (!globalFlags.yes) {
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    clackLog.step(
      `The following will be added to ${chalk.bold.underline(clientFileTarget.path)}`
    );
  }
  const configStr = formatDiffByFormat(
    {
      [clientFileTarget.configKey]: {
        [serverName]: servers[serverName]
      }
    },
    clientFileTarget.format
  );
  if (!globalFlags.yes) {
    await stream.message(
      (async function* () {
        for (const num of Array.from(
          { length: configStr.length },
          (_, i) => i
        )) {
          const char = configStr[num];
          yield char;
          if (!["\n", " ", "\u2500", "\u256E", "\u256D", "\u2570", "\u256F", "\u2502"].includes(char)) {
            await new Promise((resolve) => setTimeout(resolve, 5));
          } else {
            await new Promise((resolve) => setTimeout(resolve, 2));
          }
        }
      })()
    );
    await new Promise((resolve) => setTimeout(resolve, 1e3));
  }
  const isConfirmed = globalFlags.yes ? true : await confirm({
    message: `Would you like to proceed?`,
    active: "Install MCP",
    inactive: "Cancel"
  });
  if (isConfirmed !== true) {
    return {
      success: false,
      error: {
        client,
        name,
        path: clientFileTarget.path,
        cause: "cancelled",
        message: "Installation cancelled"
      }
    };
  }
  const configContent = serializeClientConfig(
    clientFileTarget,
    config,
    content
  );
  const writeResult = await safeWriteFile(
    "config_file",
    clientFileTarget.path,
    configContent
  );
  if (writeResult.isErr()) {
    return {
      success: false,
      error: {
        client,
        name,
        path: clientFileTarget.path,
        cause: writeResult.error.cause,
        message: `Error writing config: ${writeResult.error.message}`
      }
    };
  }
  if (!options.silent) {
    clackLog.success(chalk.bold.green(`Added agentcash MCP to ${name}`));
  }
  return {
    success: true,
    value: {
      client,
      name,
      path: clientFileTarget.path
    }
  };
};
var addServer = async (client, globalFlags) => {
  const result = await tryAddServer(client, globalFlags);
  if (result.success) {
    return;
  }
  if (result.error.cause === "cancelled") {
    outro(chalk.bold.red(result.error.message));
    process.exit(0);
  }
  clackLog.error(chalk.bold.red(result.error.message));
  outro(chalk.bold.red(`Error adding agentcash MCP to ${result.error.name}`));
  process.exit(1);
};
var formatDiffByFormat = (obj, format) => {
  const str = stringifyObject(obj, format);
  switch (format) {
    case "json" /* JSON */: {
      const numLines = str.split("\n").length;
      return str.split("\n").map((line, index) => {
        const diffLines = [0, 1, numLines - 2, numLines - 1];
        const isDiffLine = !diffLines.includes(index);
        if (isDiffLine) {
          return `${chalk.bold.green(`+ ${line.slice(2)}`)}`;
        }
        return line;
      }).join("\n");
    }
    case "yaml" /* YAML */: {
      return str.split("\n").map((line, index) => {
        const diffLines = [0, 1, str.length - 2, str.length - 1];
        const isDiffLine = !diffLines.includes(index);
        if (isDiffLine) {
          return `${chalk.bold.green(`+ ${line.slice(2)}`)}`;
        }
        return line;
      }).join("\n");
    }
    case "toml" /* TOML */: {
      return str.split("\n").filter((line) => line.trim() !== "").map((line) => {
        return `${chalk.bold.green(`+ ${line.trim()}`)}`;
      }).join("\n");
    }
  }
};

export {
  getPlatformPath,
  tryAddServer,
  addServer
};
//# sourceMappingURL=chunk-CUZFVI2X.js.map