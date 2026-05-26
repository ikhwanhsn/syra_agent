import {
  fsErr,
  pathExists,
  safeCp,
  safeLstatSync,
  safeMkdir,
  safeReadFile,
  safeRealpathSync,
  safeRmSync,
  safeSymlink,
  safeUnlinkSync
} from "./chunk-QZCSZB7E.js";
import {
  err,
  ok
} from "./chunk-YWNBUUBR.js";

// src/shared/skills/core/agents.ts
import * as os from "os";
import * as path from "path";
var home = os.homedir();
var configHome = process.env.XDG_CONFIG_HOME ?? path.join(home, ".config");
var claudeHome = process.env.CLAUDE_CONFIG_DIR?.trim() ?? path.join(home, ".claude");
var codexHome = process.env.CODEX_HOME?.trim() ?? path.join(home, ".codex");
var all = [
  {
    name: "Amp",
    globalSkillsDir: path.join(configHome, "agents", "skills"),
    projectSkillsDir: ".agents/skills",
    universal: true,
    detect: () => pathExists(path.join(configHome, "amp"))
  },
  {
    name: "Cline",
    globalSkillsDir: path.join(home, ".agents", "skills"),
    projectSkillsDir: ".agents/skills",
    universal: true,
    detect: () => pathExists(path.join(home, ".cline"))
  },
  {
    name: "Codex",
    globalSkillsDir: path.join(codexHome, "skills"),
    projectSkillsDir: ".agents/skills",
    universal: true,
    detect: () => pathExists(codexHome)
  },
  {
    name: "Cursor",
    globalSkillsDir: path.join(home, ".cursor", "skills"),
    projectSkillsDir: ".agents/skills",
    universal: true,
    detect: () => pathExists(path.join(home, ".cursor"))
  },
  {
    name: "Gemini CLI",
    globalSkillsDir: path.join(home, ".gemini", "skills"),
    projectSkillsDir: ".agents/skills",
    universal: true,
    detect: () => pathExists(path.join(home, ".gemini"))
  },
  {
    name: "GitHub Copilot",
    globalSkillsDir: path.join(home, ".copilot", "skills"),
    projectSkillsDir: ".agents/skills",
    universal: true,
    detect: () => pathExists(path.join(home, ".copilot"))
  },
  {
    name: "Kimi CLI",
    globalSkillsDir: path.join(configHome, "agents", "skills"),
    projectSkillsDir: ".agents/skills",
    universal: true,
    detect: () => pathExists(path.join(home, ".kimi"))
  },
  {
    name: "OpenCode",
    globalSkillsDir: path.join(configHome, "opencode", "skills"),
    projectSkillsDir: ".agents/skills",
    universal: true,
    detect: () => pathExists(path.join(configHome, "opencode"))
  },
  // Non-universal agents (need symlink from their skills dir to canonical)
  {
    name: "Hermes Agent",
    globalSkillsDir: path.join(home, ".hermes", "skills"),
    projectSkillsDir: "skills",
    universal: false,
    requiresCopy: true,
    detect: () => pathExists(path.join(home, ".hermes"))
  },
  {
    name: "OpenClaw",
    globalSkillsDir: path.join(home, ".openclaw", "skills"),
    projectSkillsDir: ".openclaw/workspace/skills",
    universal: false,
    detect: () => pathExists(path.join(home, ".openclaw"))
  },
  {
    name: "Claude Code",
    globalSkillsDir: path.join(claudeHome, "skills"),
    projectSkillsDir: ".claude/skills",
    universal: false,
    detect: () => pathExists(claudeHome)
  },
  {
    name: "Windsurf",
    globalSkillsDir: path.join(home, ".codeium", "windsurf", "skills"),
    projectSkillsDir: ".windsurf/skills",
    universal: false,
    detect: () => pathExists(path.join(home, ".codeium", "windsurf"))
  },
  {
    name: "Continue",
    globalSkillsDir: path.join(home, ".continue", "skills"),
    projectSkillsDir: ".continue/skills",
    universal: false,
    detect: () => pathExists(path.join(home, ".continue"))
  },
  {
    name: "Roo",
    globalSkillsDir: path.join(home, ".roo", "skills"),
    projectSkillsDir: ".roo/skills",
    universal: false,
    detect: () => pathExists(path.join(home, ".roo"))
  },
  {
    name: "Kilo",
    globalSkillsDir: path.join(home, ".kilocode", "skills"),
    projectSkillsDir: ".kilocode/skills",
    universal: false,
    detect: () => pathExists(path.join(home, ".kilocode"))
  },
  {
    name: "Goose",
    globalSkillsDir: path.join(configHome, "goose", "skills"),
    projectSkillsDir: ".goose/skills",
    universal: false,
    detect: () => pathExists(path.join(configHome, "goose"))
  },
  {
    name: "Augment",
    globalSkillsDir: path.join(home, ".augment", "skills"),
    projectSkillsDir: ".augment/skills",
    universal: false,
    detect: () => pathExists(path.join(home, ".augment"))
  },
  {
    name: "Trae",
    globalSkillsDir: path.join(home, ".trae", "skills"),
    projectSkillsDir: ".trae/skills",
    universal: false,
    detect: () => pathExists(path.join(home, ".trae"))
  },
  {
    name: "Junie",
    globalSkillsDir: path.join(home, ".junie", "skills"),
    projectSkillsDir: ".junie/skills",
    universal: false,
    detect: () => pathExists(path.join(home, ".junie"))
  },
  {
    name: "Crush",
    globalSkillsDir: path.join(configHome, "crush", "skills"),
    projectSkillsDir: ".crush/skills",
    universal: false,
    detect: () => pathExists(path.join(configHome, "crush"))
  },
  {
    name: "Kiro CLI",
    globalSkillsDir: path.join(home, ".kiro", "skills"),
    projectSkillsDir: ".kiro/skills",
    universal: false,
    detect: () => pathExists(path.join(home, ".kiro"))
  },
  {
    name: "Qwen Code",
    globalSkillsDir: path.join(home, ".qwen", "skills"),
    projectSkillsDir: ".qwen/skills",
    universal: false,
    detect: () => pathExists(path.join(home, ".qwen"))
  },
  {
    name: "OpenHands",
    globalSkillsDir: path.join(home, ".openhands", "skills"),
    projectSkillsDir: ".openhands/skills",
    universal: false,
    detect: () => pathExists(path.join(home, ".openhands"))
  }
];
function detectAgents() {
  return all.filter((a) => a.detect());
}

// src/shared/skills/core/install.ts
import * as os2 from "os";
import * as path2 from "path";

// src/shared/skills/core/lib.ts
function rmForce(surface, target) {
  const statResult = safeLstatSync(surface, target);
  if (statResult.isOk()) {
    const stat = statResult.value;
    if (!stat) {
      return fsErr(surface, {
        cause: "file_not_readable",
        message: `Failed to stat ${target}`
      });
    }
    if (stat.isSymbolicLink()) {
      const unlinkResult = safeUnlinkSync(surface, target);
      if (unlinkResult.isErr()) {
        return unlinkResult;
      }
      return ok(void 0);
    }
  }
  if (statResult.isErr()) {
    if (statResult.error.cause === "file_not_found") {
      return ok(void 0);
    }
    return statResult;
  }
  const rmResult = safeRmSync(surface, target, {
    recursive: true,
    force: true
  });
  if (rmResult.isErr()) {
    return rmResult;
  }
  return ok(void 0);
}

// src/shared/skills/core/install.ts
var home2 = os2.homedir();
var INSTALL_SKILLS_SURFACE = "install-skills";
async function installSkills(sourceDir, options = {}) {
  const isGlobal = options.global !== false;
  const cwd = options.cwd ?? process.cwd();
  const baseDir = isGlobal ? home2 : cwd;
  const detectedAgents = options.agents ?? detectAgents();
  const contentResult = await safeReadFile(
    INSTALL_SKILLS_SURFACE,
    path2.join(sourceDir, "SKILL.md")
  );
  if (contentResult.isErr()) {
    return contentResult;
  }
  const nameMatch = /^name:\s*(.+)$/m.exec(contentResult.value);
  const name = sanitizeName(nameMatch?.[1] ?? "skill");
  if (!isValidSkillName(name)) {
    return err("skill", INSTALL_SKILLS_SURFACE, {
      cause: "invalid_skill_name",
      message: `Invalid skill name: ${nameMatch?.[1] ?? "skill"}`
    });
  }
  const canonicalDir = path2.join(baseDir, ".agents", "skills", name);
  const agents = [];
  const removeCanonicalResult = rmForce(INSTALL_SKILLS_SURFACE, canonicalDir);
  if (removeCanonicalResult.isErr()) {
    return removeCanonicalResult;
  }
  const mkdirCanonicalResult = await safeMkdir(
    INSTALL_SKILLS_SURFACE,
    canonicalDir,
    { recursive: true }
  );
  if (mkdirCanonicalResult.isErr()) {
    return mkdirCanonicalResult;
  }
  const copySkillResult = await safeCp(
    INSTALL_SKILLS_SURFACE,
    sourceDir,
    canonicalDir,
    { recursive: true }
  );
  if (copySkillResult.isErr()) {
    return copySkillResult;
  }
  for (const agent of detectedAgents) {
    if (agent.universal) continue;
    const agentSkillsDir = isGlobal ? agent.globalSkillsDir : path2.join(cwd, agent.projectSkillsDir);
    const agentDir = path2.join(agentSkillsDir, name);
    if (agentDir === canonicalDir) continue;
    if (!agent.requiresCopy) {
      const symlinkResult = await installAgentSymlink(agentDir, canonicalDir);
      if (symlinkResult.isOk()) {
        agents.push({ agent: agent.name, path: agentDir, mode: "symlink" });
        continue;
      }
    }
    const copyResult = await installAgentCopy(agentDir, canonicalDir);
    if (copyResult.isOk()) {
      agents.push({ agent: agent.name, path: agentDir, mode: "copy" });
      continue;
    }
    return err("skill", INSTALL_SKILLS_SURFACE, {
      cause: "agent_install_failed",
      message: `Failed to install skill "${name}" for ${agent.name}: ${copyResult.error.message}`
    });
  }
  return ok({ path: canonicalDir, agents });
}
function sanitizeName(name) {
  return name.trim().replace(/[/\\]/g, "-").replace(/\.\./g, "").slice(0, 255);
}
function isValidSkillName(name) {
  return name.length > 0 && name !== "." && name !== "..";
}
async function installAgentSymlink(agentDir, canonicalDir) {
  const removeAgentDirResult = rmForce(INSTALL_SKILLS_SURFACE, agentDir);
  if (removeAgentDirResult.isErr()) {
    return removeAgentDirResult;
  }
  const mkdirResult = await safeMkdir(
    INSTALL_SKILLS_SURFACE,
    path2.dirname(agentDir),
    { recursive: true }
  );
  if (mkdirResult.isErr()) {
    return mkdirResult;
  }
  const realLinkDirResult = resolveParent(path2.dirname(agentDir));
  if (realLinkDirResult.isErr()) {
    return realLinkDirResult;
  }
  const realTargetResult = resolveParent(canonicalDir);
  if (realTargetResult.isErr()) {
    return realTargetResult;
  }
  const realLinkDir = realLinkDirResult.value;
  const realTarget = realTargetResult.value;
  const rel = path2.relative(realLinkDir, realTarget);
  const symlinkResult = await safeSymlink(
    INSTALL_SKILLS_SURFACE,
    rel,
    agentDir
  );
  if (symlinkResult.isErr()) {
    return symlinkResult;
  }
  return ok(void 0);
}
async function installAgentCopy(agentDir, canonicalDir) {
  const removeAgentDirResult = rmForce(INSTALL_SKILLS_SURFACE, agentDir);
  if (removeAgentDirResult.isErr()) {
    return removeAgentDirResult;
  }
  const mkdirResult = await safeMkdir(
    INSTALL_SKILLS_SURFACE,
    path2.dirname(agentDir),
    { recursive: true }
  );
  if (mkdirResult.isErr()) {
    return mkdirResult;
  }
  const copyResult = await safeCp(
    INSTALL_SKILLS_SURFACE,
    canonicalDir,
    agentDir,
    { recursive: true }
  );
  if (copyResult.isErr()) {
    return copyResult;
  }
  return ok(void 0);
}
function resolveParent(dir) {
  const directResult = safeRealpathSync(INSTALL_SKILLS_SURFACE, dir);
  if (directResult.isOk()) {
    return directResult;
  }
  const parent = path2.dirname(dir);
  if (parent === dir) {
    return ok(dir);
  }
  const parentResult = safeRealpathSync(INSTALL_SKILLS_SURFACE, parent);
  if (parentResult.isErr()) {
    return ok(dir);
  }
  return ok(path2.join(parentResult.value, path2.relative(parent, dir)));
}

export {
  detectAgents,
  installSkills
};
//# sourceMappingURL=chunk-FVVSNDQR.js.map