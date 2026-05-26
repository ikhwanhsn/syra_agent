import {
  configFile
} from "./chunk-YWNBUUBR.js";

// src/shared/settings.ts
import z from "zod";
import fs from "fs";
var SETTINGS_FILE = configFile("settings.json");
var settingsSchema = z.object({
  maxAmount: z.number().positive()
}).partial();
var getSettings = () => {
  if (!fs.existsSync(SETTINGS_FILE)) {
    return {};
  }
  const content = fs.readFileSync(SETTINGS_FILE, "utf-8");
  const result = settingsSchema.safeParse(JSON.parse(content));
  if (!result.success) {
    return {};
  }
  return result.data;
};
var setSettings = (settings) => {
  const existing = getSettings();
  const newSettings = settingsSchema.parse({ ...existing, ...settings });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));
};

// src/operations/fetch/types.ts
var DEFAULT_MAX_AMOUNT = 5;

export {
  getSettings,
  setSettings,
  DEFAULT_MAX_AMOUNT
};
//# sourceMappingURL=chunk-JX2XE6FD.js.map