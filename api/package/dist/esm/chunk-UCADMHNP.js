import {
  installSkills
} from "./chunk-FVVSNDQR.js";
import {
  safeFetch,
  safeFetchJson
} from "./chunk-BFOYXXLG.js";
import {
  safeMkdir,
  safeMkdtemp,
  safeRm,
  safeWriteFile
} from "./chunk-QZCSZB7E.js";
import {
  err,
  ok,
  resultFromPromise
} from "./chunk-YWNBUUBR.js";

// src/shared/skills/github.ts
import * as os from "os";
import * as path from "path";
import z from "zod";
var githubContentsSchema = z.array(
  z.object({
    type: z.enum(["file", "dir"]),
    name: z.string(),
    path: z.string(),
    download_url: z.string().nullable().optional()
  })
);
var skillErr = (surface, error) => err("skill", surface, error);
var githubHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": "agentcash-cli"
};
var buildContentsUrl = (owner, repo, skillPath) => {
  const encodedPath = skillPath.split("/").filter(Boolean).map((part) => encodeURIComponent(part)).join("/");
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
};
async function downloadGitHubSkill(surface, source, targetDir) {
  const skillDir = path.join(targetDir, path.basename(source.skillPath));
  const files = [];
  let skillMd;
  const writeDirectory = async (remotePath, localDir) => {
    const contentsResult = await safeFetchJson(
      surface,
      new Request(buildContentsUrl(source.owner, source.repo, remotePath), {
        headers: githubHeaders
      }),
      githubContentsSchema
    );
    if (contentsResult.isErr()) {
      return contentsResult;
    }
    const mkdirResult = await safeMkdir(surface, localDir, { recursive: true });
    if (mkdirResult.isErr()) {
      return mkdirResult;
    }
    for (const item of contentsResult.value) {
      const localPath = path.join(localDir, item.name);
      if (item.type === "dir") {
        const nestedResult = await writeDirectory(item.path, localPath);
        if (nestedResult.isErr()) {
          return nestedResult;
        }
        continue;
      }
      if (!item.download_url) {
        return skillErr(surface, {
          cause: "download_url_missing",
          message: `GitHub did not provide a download URL for ${item.path}`
        });
      }
      const fileResult = await safeFetch(
        surface,
        new Request(item.download_url, {
          headers: githubHeaders
        })
      );
      if (fileResult.isErr()) {
        return fileResult;
      }
      const bufferResult = await resultFromPromise(
        "skill",
        surface,
        fileResult.value.arrayBuffer(),
        (error) => ({
          cause: "skill_install_failed",
          message: error instanceof Error ? error.message : `Failed to download ${item.path}`
        })
      );
      if (bufferResult.isErr()) {
        return bufferResult;
      }
      const bytes = Buffer.from(bufferResult.value);
      const parentDirResult = await safeMkdir(
        surface,
        path.dirname(localPath),
        {
          recursive: true
        }
      );
      if (parentDirResult.isErr()) {
        return parentDirResult;
      }
      const writeResult = await safeWriteFile(surface, localPath, bytes);
      if (writeResult.isErr()) {
        return writeResult;
      }
      files.push(localPath);
      if (item.path === `${source.skillPath}/SKILL.md`) {
        skillMd = bytes.toString("utf8");
      }
    }
    return ok(void 0);
  };
  const writeDirectoryResult = await writeDirectory(source.skillPath, skillDir);
  if (writeDirectoryResult.isErr()) {
    return writeDirectoryResult;
  }
  if (!skillMd) {
    return skillErr(surface, {
      cause: "skill_md_missing",
      message: `No SKILL.md found in ${source.owner}/${source.repo}/${source.skillPath}`
    });
  }
  return ok({
    files,
    skillDir,
    skillMd
  });
}
async function installGitHubSkill(surface, source, options) {
  const tmpDirResult = await safeMkdtemp(
    surface,
    path.join(os.tmpdir(), "agentcash-skill-")
  );
  if (tmpDirResult.isErr()) {
    return tmpDirResult;
  }
  const tmpDir = tmpDirResult.value;
  const downloadedResult = await downloadGitHubSkill(surface, source, tmpDir);
  if (downloadedResult.isErr()) {
    await safeRm(surface, tmpDir, { recursive: true, force: true });
    return downloadedResult;
  }
  const installResult = await installSkills(
    downloadedResult.value.skillDir,
    options
  );
  if (installResult.isErr()) {
    await safeRm(surface, tmpDir, { recursive: true, force: true });
    return installResult;
  }
  await safeRm(surface, tmpDir, { recursive: true, force: true });
  return ok({
    ...downloadedResult.value,
    installResult: installResult.value
  });
}

export {
  installGitHubSkill
};
//# sourceMappingURL=chunk-UCADMHNP.js.map