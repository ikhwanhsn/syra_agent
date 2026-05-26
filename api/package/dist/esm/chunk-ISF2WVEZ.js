import {
  configFile
} from "./chunk-YWNBUUBR.js";

// src/shared/state.ts
import z from "zod";
import fs from "fs";
var STATE_FILE = configFile("state.json");
var stateSchema = z.looseObject({
  redeemedCodes: z.array(z.string())
}).partial();
var getState = () => {
  const stateFileExists = fs.existsSync(STATE_FILE);
  if (!stateFileExists) {
    fs.writeFileSync(STATE_FILE, "{}");
    return {};
  }
  const stateFileContent = fs.readFileSync(STATE_FILE, "utf-8");
  const result = stateSchema.safeParse(JSON.parse(stateFileContent));
  if (!result.success) {
    return {};
  }
  return result.data;
};
var setState = (state) => {
  const existing = getState();
  const newState = stateSchema.parse({ ...existing, ...state });
  fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));
};

export {
  getState,
  setState
};
//# sourceMappingURL=chunk-ISF2WVEZ.js.map