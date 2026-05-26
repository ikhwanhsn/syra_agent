import {
  safeParseJson
} from "./chunk-KVSTJRSJ.js";
import {
  configFile
} from "./chunk-YWNBUUBR.js";

// src/shared/user-origins.ts
import * as fs from "fs";
import z from "zod";
var ORIGINS_FILE = configFile("origins.json");
var userOriginSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  addedAt: z.string()
});
var originsFileSchema = z.object({
  added: z.array(userOriginSchema)
});
function readOriginsFile() {
  if (!fs.existsSync(ORIGINS_FILE)) return [];
  const raw = fs.readFileSync(ORIGINS_FILE, "utf-8");
  const json = safeParseJson("user-origins", raw);
  if (!json.isOk()) return [];
  const parsed = originsFileSchema.safeParse(json.value);
  return parsed.success ? parsed.data.added : [];
}
function writeOriginsFile(origins) {
  fs.writeFileSync(
    ORIGINS_FILE,
    JSON.stringify({ added: origins }, null, 2),
    "utf-8"
  );
}
function loadUserOrigins() {
  return readOriginsFile();
}
function addUserOrigin(origin) {
  const origins = readOriginsFile();
  const entry = { ...origin, addedAt: (/* @__PURE__ */ new Date()).toISOString() };
  const existing = origins.findIndex((o) => o.url === origin.url);
  if (existing >= 0) {
    origins[existing] = entry;
  } else {
    origins.push(entry);
  }
  writeOriginsFile(origins);
  return entry;
}
function removeUserOrigin(url) {
  const origins = readOriginsFile();
  const filtered = origins.filter((o) => o.url !== url);
  if (filtered.length === origins.length) return { removed: false };
  writeOriginsFile(filtered);
  return { removed: true };
}

export {
  loadUserOrigins,
  addUserOrigin,
  removeUserOrigin
};
//# sourceMappingURL=chunk-YIU364NZ.js.map