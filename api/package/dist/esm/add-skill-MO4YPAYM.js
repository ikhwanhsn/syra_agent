import {
  resolveOrigin
} from "./chunk-2SZ6MZS3.js";
import {
  installSkills
} from "./chunk-FVVSNDQR.js";
import {
  addUserOrigin
} from "./chunk-YIU364NZ.js";
import "./chunk-L4U6AJW3.js";
import "./chunk-3PYQIEMA.js";
import "./chunk-KVSTJRSJ.js";
import "./chunk-FB5CMO3J.js";
import "./chunk-U6FRXL3X.js";
import {
  errorResponse,
  outputAndExit,
  successResponse
} from "./chunk-7EBJ4BCH.js";
import {
  safeMkdir,
  safeMkdtemp,
  safeRm,
  safeWriteFile
} from "./chunk-QZCSZB7E.js";
import "./chunk-TTAO2EJK.js";
import "./chunk-YWNBUUBR.js";
import "./chunk-ITCDZXBZ.js";

// src/shared/skills/origin.ts
import * as os from "os";
import * as path from "path";
async function addOriginSkill(origin, surface, options) {
  const tmpDirResult = await safeMkdtemp(
    surface,
    path.join(os.tmpdir(), "agentcash-skill-add")
  );
  if (tmpDirResult.isErr()) {
    return tmpDirResult;
  }
  const tmpDir = tmpDirResult.value;
  const skillDir = path.join(tmpDir, originSkillTitle(origin));
  const mkdirResult = await safeMkdir(surface, skillDir, { recursive: true });
  if (mkdirResult.isErr()) {
    return mkdirResult;
  }
  const writeResult = await safeWriteFile(
    surface,
    path.join(skillDir, "SKILL.md"),
    originSkillContent(origin)
  );
  if (writeResult.isErr()) {
    await safeRm(surface, tmpDir, { recursive: true, force: true });
    return writeResult;
  }
  const result = await installSkills(skillDir, options);
  await safeRm(surface, tmpDir, { recursive: true, force: true });
  return result;
}
var originSkillTitle = (origin) => origin.title.toLowerCase().replace(/[ .]/g, "-");
var originSkillContent = (origin) => `---
name: ${originSkillTitle(origin)}
description: ${origin.description}
command: npx agentcash discover ${origin.url}
---
Call \`npx agentcash discover ${origin.url}\` to discover how to use ${origin.title}.`;

// src/cli/commands/add-skill.ts
var SURFACE = "cli:add-skill";
var addSkillCommand = async (input) => {
  const resolved = await resolveOrigin(SURFACE, input);
  if (!resolved.ok) return outputAndExit(resolved.error, input);
  const { origin } = resolved;
  addUserOrigin(origin);
  const skillResult = await addOriginSkill(origin, SURFACE);
  if (!skillResult.isOk()) {
    return outputAndExit(
      errorResponse({
        code: "GENERAL_ERROR",
        message: skillResult.error.message,
        surface: SURFACE,
        cause: "skill_install_failed"
      }),
      input
    );
  }
  return outputAndExit(
    successResponse({
      ...origin,
      installed: skillResult.value.path,
      linkedAgents: skillResult.value.agents,
      note: "Restart your MCP server for this origin to appear in the model context."
    }),
    input
  );
};
export {
  addSkillCommand
};
//# sourceMappingURL=add-skill-MO4YPAYM.js.map