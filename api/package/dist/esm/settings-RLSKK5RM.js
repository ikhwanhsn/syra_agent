import {
  DEFAULT_MAX_AMOUNT,
  getSettings,
  setSettings
} from "./chunk-JX2XE6FD.js";
import {
  outputAndExit,
  successResponse
} from "./chunk-7EBJ4BCH.js";
import "./chunk-YWNBUUBR.js";

// src/cli/commands/settings.ts
var VALID_KEYS = ["maxAmount"];
var settingsGetCommand = (args) => {
  const settings = getSettings();
  outputAndExit(successResponse(settings), args);
};
var settingsSetCommand = (args) => {
  const { key, value } = args;
  if (!VALID_KEYS.includes(key)) {
    console.error(
      `Unknown setting: ${key}. Valid settings: ${VALID_KEYS.join(", ")}`
    );
    process.exit(1);
  }
  if (key === "maxAmount") {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      console.error("maxAmount must be a positive number");
      process.exit(1);
    }
    setSettings({ maxAmount: num });
  }
  const settings = getSettings();
  outputAndExit(
    successResponse({
      maxAmount: settings.maxAmount ?? DEFAULT_MAX_AMOUNT
    }),
    args
  );
};
export {
  settingsGetCommand,
  settingsSetCommand
};
//# sourceMappingURL=settings-RLSKK5RM.js.map