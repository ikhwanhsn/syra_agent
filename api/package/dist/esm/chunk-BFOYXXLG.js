import {
  safeParse
} from "./chunk-F3KGAMIA.js";
import {
  err,
  ok,
  resultFromPromise
} from "./chunk-YWNBUUBR.js";

// src/shared/neverthrow/fetch/index.ts
import contentType from "content-type";
var DEFAULT_USER_FETCH_TIMEOUT = 3e4;
var IMAGE_TYPES = /* @__PURE__ */ new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/tiff",
  "image/bmp",
  "image/ico"
]);
var errorType = "fetch";
var fetchErr = (surface, error) => err(errorType, surface, error);
var fetchOk = (value) => ok(value);
var fetchHttpErr = (surface, response) => fetchErr(surface, {
  cause: "http",
  statusCode: response.status,
  message: response.statusText,
  response
});
var safeFetch = (surface, request, timeout = DEFAULT_USER_FETCH_TIMEOUT) => {
  const signal = AbortSignal.timeout(timeout);
  return resultFromPromise(
    errorType,
    surface,
    fetch(request, ...signal ? [{ signal }] : []),
    (error) => {
      if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) {
        return {
          cause: "timeout",
          message: timeout ? `Request timed out after ${timeout}ms. You can increase the timeout by passing a larger value in the 'timeout' parameter.` : "Request was aborted"
        };
      }
      return {
        cause: "network",
        message: error instanceof Error ? error.message : "Network error"
      };
    }
  );
};
var safeFetchJson = (surface, request, schema, timeout) => {
  return safeFetch(surface, request, timeout).andThen((response) => {
    if (!response.ok) {
      return fetchHttpErr(surface, response);
    }
    return resultFromPromise(errorType, surface, response.json(), () => ({
      cause: "parse",
      message: "Could not parse JSON from response",
      statusCode: response.status,
      contentType: response.headers.get("content-type") ?? "Not specified"
    }));
  }).andThen((data) => safeParse(surface, schema, data));
};
var safeParseResponse = (surface, response) => {
  return resultFromPromise(
    errorType,
    surface,
    (async () => {
      const header = response.headers.get("content-type");
      const { type: mimeType } = header ? contentType.parse(header) : { type: "application/octet-stream" };
      switch (mimeType) {
        case "application/json":
          return {
            type: "json",
            data: await response.json()
          };
        case "application/pdf":
          return {
            type: "pdf",
            mimeType,
            data: await response.arrayBuffer()
          };
        case "application/octet-stream":
          return {
            type: "octet-stream",
            mimeType,
            data: await response.arrayBuffer()
          };
        case "multipart/form-data":
          return { type: "formData", data: await response.formData() };
      }
      if (IMAGE_TYPES.has(mimeType)) {
        return {
          type: "image",
          mimeType,
          data: await response.arrayBuffer()
        };
      }
      if (mimeType.startsWith("audio/")) {
        return {
          type: "audio",
          mimeType,
          data: await response.arrayBuffer()
        };
      }
      if (mimeType.startsWith("video/")) {
        return {
          type: "video",
          mimeType,
          data: await response.arrayBuffer()
        };
      }
      if (mimeType.startsWith("text/")) {
        return { type: "text", data: await response.text() };
      }
      throw new Error(`Unsupported content type: ${header}`);
    })(),
    (e) => ({
      cause: "parse",
      message: e instanceof Error ? e.message : "Could not parse response",
      statusCode: response.status,
      contentType: response.headers.get("content-type") ?? "Not specified"
    })
  );
};
var isFetchError = (error) => {
  return error.type === errorType;
};

export {
  fetchErr,
  fetchOk,
  fetchHttpErr,
  safeFetch,
  safeFetchJson,
  safeParseResponse,
  isFetchError
};
//# sourceMappingURL=chunk-BFOYXXLG.js.map