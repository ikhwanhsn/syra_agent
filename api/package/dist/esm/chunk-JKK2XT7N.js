import {
  coreRequestSchema,
  fetchShape
} from "./chunk-7KT6UCTT.js";
import {
  REQUEST_PARAMS
} from "./chunk-3PYQIEMA.js";

// src/shared/request/schemas/cli.ts
import z from "zod";
var cliRequestHeadersSchema = z.array(
  z.string().superRefine((value, ctx) => {
    const separatorIndex = value.indexOf(":");
    if (separatorIndex === -1) {
      ctx.addIssue({
        code: "custom",
        message: 'Headers must be in "Name: value" format'
      });
      return;
    }
    const name = value.slice(0, separatorIndex).trim();
    if (!name) {
      ctx.addIssue({
        code: "custom",
        message: "Header name must not be empty"
      });
    }
  })
).optional().describe(REQUEST_PARAMS.headers).transform(
  (headers) => Object.fromEntries(
    headers?.map((header) => {
      const separatorIndex = header.indexOf(":");
      const name = header.slice(0, separatorIndex).trim();
      const headerValue = header.slice(separatorIndex + 1).trimStart();
      return [name, headerValue];
    }) ?? []
  )
);
var cliRequestSchema = coreRequestSchema.extend({
  body: z.string().optional().describe(REQUEST_PARAMS.body),
  headers: cliRequestHeadersSchema
});
var cliFetchRequestSchema = cliRequestSchema.extend(fetchShape);

export {
  cliRequestSchema,
  cliFetchRequestSchema
};
//# sourceMappingURL=chunk-JKK2XT7N.js.map