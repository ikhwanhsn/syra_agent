import {
  configFile,
  err,
  resultFromPromise,
  resultFromThrowable
} from "./chunk-YWNBUUBR.js";
import {
  isVerbose
} from "./chunk-ITCDZXBZ.js";

// src/shared/neverthrow/fs/index.ts
import {
  readFile,
  writeFile,
  appendFile,
  chmod,
  mkdir,
  mkdtemp,
  rm,
  copyFile,
  cp,
  symlink,
  lstat,
  unlink,
  realpath,
  readdir
} from "fs/promises";
import {
  existsSync,
  lstatSync,
  realpathSync,
  rmSync,
  unlinkSync
} from "fs";
var errorType = "fs";
var fsErr = (surface, error) => err(errorType, surface, error);
var fsResultFromPromise = (surface, promise, error) => resultFromPromise(errorType, surface, promise, error);
var fsResultFromThrowable = (surface, fn, error) => resultFromThrowable(errorType, surface, fn, error);
var safeReadFile = (surface, path) => fsResultFromPromise(surface, readFile(path, "utf-8"), (error) => ({
  cause: error.code === "ENOENT" ? "file_not_found" : "file_not_readable",
  message: "Failed to read file"
}));
var safeWriteFile = (surface, ...args) => fsResultFromPromise(surface, writeFile(...args), () => ({
  cause: "file_not_writable",
  message: "Failed to write file"
}));
var safeAppendFile = (surface, ...args) => fsResultFromPromise(surface, appendFile(...args), () => ({
  cause: "file_not_writable",
  message: "Failed to append file"
}));
var safeChmod = (surface, ...args) => fsResultFromPromise(surface, chmod(...args), () => ({
  cause: "file_not_chmodable",
  message: "Failed to chmod file"
}));
var safeMkdir = (surface, ...args) => fsResultFromPromise(surface, mkdir(...args), () => ({
  cause: "file_not_writable",
  message: "Failed to create directory"
}));
var safeMkdtemp = (surface, ...args) => fsResultFromPromise(surface, mkdtemp(...args), () => ({
  cause: "file_not_writable",
  message: "Failed to create temporary directory"
}));
var safeRm = (surface, ...args) => fsResultFromPromise(surface, rm(...args), () => ({
  cause: "file_not_deletable",
  message: "Failed to remove file"
}));
var safeCp = (surface, ...args) => fsResultFromPromise(surface, cp(...args), (error) => ({
  cause: error.code === "ENOENT" ? "file_not_found" : "file_not_copyable",
  message: "Failed to copy file"
}));
var safeSymlink = (surface, ...args) => fsResultFromPromise(surface, symlink(...args), () => ({
  cause: "file_not_writable",
  message: "Failed to create symlink"
}));
var pathExists = (...args) => existsSync(...args);
var safeLstatSync = (surface, ...args) => fsResultFromThrowable(
  surface,
  () => lstatSync(...args),
  (error) => ({
    cause: error.code === "ENOENT" ? "file_not_found" : "file_not_readable",
    message: "Failed to stat file"
  })
);
var safeUnlinkSync = (surface, ...args) => fsResultFromThrowable(
  surface,
  () => unlinkSync(...args),
  (error) => ({
    cause: error.code === "ENOENT" ? "file_not_found" : "file_not_deletable",
    message: "Failed to unlink file"
  })
);
var safeRmSync = (surface, ...args) => fsResultFromThrowable(
  surface,
  () => rmSync(...args),
  () => ({
    cause: "file_not_deletable",
    message: "Failed to remove file"
  })
);
var safeRealpathSync = (surface, ...args) => fsResultFromThrowable(
  surface,
  () => realpathSync(...args),
  (error) => ({
    cause: error.code === "ENOENT" ? "file_not_found" : "file_not_readable",
    message: "Failed to resolve real path"
  })
);

// src/shared/log.ts
var logFile;
function getLogFile() {
  if (logFile === void 0) {
    const result = resultFromThrowable(
      "log",
      "log",
      () => configFile("mcp.log"),
      (e) => ({
        cause: "log_init",
        message: e instanceof Error ? e.message : String(e)
      })
    );
    logFile = result.isOk() ? result.value : null;
  }
  return logFile;
}
function format(args) {
  return args.map(
    (a) => typeof a === "object" && a !== null ? JSON.stringify(a) : String(a)
  ).join(" ");
}
function write(level, msg, args) {
  const formatted = args.length ? `${msg} ${format(args)}` : msg;
  const line = `[${(/* @__PURE__ */ new Date()).toISOString()}] [${level}] ${formatted}
`;
  const file = getLogFile();
  if (file) safeAppendFile("log", file, line);
  if (isVerbose()) {
    console.error(`[agentcash] ${formatted}`);
  }
}
var log = {
  info: (msg, ...args) => write("INFO", msg, args),
  error: (msg, ...args) => write("ERROR", msg, args),
  debug: (msg, ...args) => isVerbose() && write("DEBUG", msg, args),
  get path() {
    return getLogFile();
  }
};

export {
  fsErr,
  safeReadFile,
  safeWriteFile,
  safeChmod,
  safeMkdir,
  safeMkdtemp,
  safeRm,
  safeCp,
  safeSymlink,
  pathExists,
  safeLstatSync,
  safeUnlinkSync,
  safeRmSync,
  safeRealpathSync,
  log
};
//# sourceMappingURL=chunk-QZCSZB7E.js.map