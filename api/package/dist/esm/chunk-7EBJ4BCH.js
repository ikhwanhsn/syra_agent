// src/cli/output/response.ts
import chalk from "chalk";

// src/cli/output/types.ts
var errorCodeToExitCode = {
  GENERAL_ERROR: 1 /* GeneralError */,
  INSUFFICIENT_BALANCE: 2 /* InsufficientBalance */,
  NETWORK_ERROR: 3 /* NetworkError */,
  PAYMENT_FAILED: 4 /* PaymentFailed */,
  INVALID_INPUT: 5 /* InvalidInput */,
  WALLET_ERROR: 1 /* GeneralError */,
  PARSE_ERROR: 5 /* InvalidInput */,
  HTTP_ERROR: 3 /* NetworkError */,
  X402_ERROR: 4 /* PaymentFailed */
};

// src/cli/output/response.ts
function successResponse(data, metadata) {
  return {
    success: true,
    data,
    metadata
  };
}
function errorResponse(error) {
  return {
    success: false,
    error
  };
}
function fromNeverthrowError(err, codeOverride) {
  const { error } = err;
  const code = codeOverride ?? mapCauseToErrorCode(error.cause);
  return errorResponse({
    code,
    message: error.message,
    surface: error.surface,
    cause: error.cause
  });
}
function mapCauseToErrorCode(cause) {
  switch (cause) {
    case "network":
      return "NETWORK_ERROR";
    case "http":
      return "HTTP_ERROR";
    case "parse":
      return "PARSE_ERROR";
    case "insufficient_balance":
      return "INSUFFICIENT_BALANCE";
    case "payment_failed":
    case "payment_already_attempted":
      return "PAYMENT_FAILED";
    case "invalid_input":
    case "validation":
      return "INVALID_INPUT";
    case "wallet":
    case "file_not_readable":
      return "WALLET_ERROR";
    default:
      return "GENERAL_ERROR";
  }
}
var MAX_ERROR_MESSAGE_LENGTH = 200;
function formatError(error, verbose) {
  const statusCode = error.details && typeof error.details === "object" && "statusCode" in error.details && typeof error.details.statusCode === "number" ? error.details.statusCode : void 0;
  const [message, truncated] = verbose ? [error.message, false] : error.message.length > MAX_ERROR_MESSAGE_LENGTH ? [error.message.slice(0, MAX_ERROR_MESSAGE_LENGTH) + "...", true] : [error.message, false];
  return { statusCode, message, truncated };
}
function buildJsonError(error, verbose) {
  const { statusCode, message, truncated } = formatError(error, verbose);
  return {
    ...error,
    message,
    statusCode,
    ...truncated ? { hint: "Use --verbose for the full error." } : {}
  };
}
function formatJson(response, verbose) {
  if (response.success) return JSON.stringify(response, null, 2);
  return JSON.stringify(
    { success: false, error: buildJsonError(response.error, verbose) },
    null,
    2
  );
}
function formatPretty(response, verbose) {
  if (response.success) {
    const lines2 = [];
    if (typeof response.data === "string") {
      lines2.push(response.data);
    } else {
      lines2.push(JSON.stringify(response.data, null, 2));
    }
    if (response.metadata) {
      lines2.push("");
      lines2.push(JSON.stringify(response.metadata, null, 2));
    }
    return lines2.join("\n");
  }
  const { error } = response;
  const { statusCode, message, truncated } = formatError(error, verbose);
  const prefix = statusCode != null ? `Error (${statusCode})` : "Error";
  const lines = [
    chalk.red(`${prefix}: ${message}`),
    chalk.dim(`Code: ${error.code}`)
  ];
  if (error.surface) lines.push(chalk.dim(`Surface: ${error.surface}`));
  if (error.cause) lines.push(chalk.dim(`Cause: ${error.cause}`));
  if (truncated) {
    lines.push(chalk.dim("Use --verbose for the full error."));
  }
  if (error.details) {
    lines.push(chalk.dim(`Details: ${JSON.stringify(error.details, null, 2)}`));
  }
  return lines.join("\n");
}
function outputAndExit(response, flags) {
  const verbose = flags.verbose ?? false;
  if (!flags.quiet) {
    console.log(
      flags.format === "json" ? formatJson(response, verbose) : formatPretty(response, verbose)
    );
  }
  const exitCode = response.success ? 0 /* Success */ : errorCodeToExitCode[response.error.code];
  process.exit(exitCode);
}

export {
  successResponse,
  errorResponse,
  fromNeverthrowError,
  outputAndExit
};
//# sourceMappingURL=chunk-7EBJ4BCH.js.map