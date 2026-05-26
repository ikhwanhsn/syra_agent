import {
  err,
  resultFromThrowable
} from "./chunk-YWNBUUBR.js";

// src/shared/neverthrow/json/index.ts
var type = "json";
var jsonErr = (surface, error) => {
  return err(type, surface, error);
};
var safeStringifyJson = (surface, value) => {
  return resultFromThrowable(
    type,
    surface,
    () => JSON.stringify(value, null, 2),
    () => ({
      cause: "stringify",
      message: "Could not stringify JSON"
    })
  );
};
var safeParseJson = (surface, value) => {
  return resultFromThrowable(
    type,
    surface,
    () => JSON.parse(value),
    (e) => ({
      cause: "parse",
      message: e instanceof Error ? e.message : "Could not parse JSON"
    })
  );
};
var safeToJsonObject = (surface, value) => {
  return safeStringifyJson(surface, value).andThen(
    (json) => safeParseJson(surface, json)
  );
};

export {
  jsonErr,
  safeStringifyJson,
  safeParseJson,
  safeToJsonObject
};
//# sourceMappingURL=chunk-KVSTJRSJ.js.map