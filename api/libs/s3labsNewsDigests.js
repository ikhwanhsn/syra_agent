/**
 * @deprecated Use libs/s3labs/s3labsDigests.js
 */
import { formatS3labsAgentTelegram } from "./s3labs/s3labsDigests.js";

/**
 * @param {import("./s3labs/s3labsPickLlm.js").S3labsPickOutput} data
 * @returns {string | null}
 */
export function formatS3labsNewsTelegram(data) {
  return formatS3labsAgentTelegram("news", data);
}
