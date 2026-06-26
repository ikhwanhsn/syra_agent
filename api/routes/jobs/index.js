/**
 * Public S3Labs jobs HTTP routes — read-only listing for s3labs /jobs page.
 */
import express from "express";
import { requireMongooseConnection } from "../../config/mongoose.js";
import { listJobs } from "../../libs/s3labs/s3labsJobStore.js";

export function createJobsRouter() {
  const router = express.Router();

  router.get("/", requireMongooseConnection, async (req, res) => {
    try {
      const category =
        typeof req.query.category === "string" ? req.query.category : undefined;
      const remote =
        req.query.remote === "true" || req.query.remote === "1"
          ? true
          : undefined;
      const search =
        typeof req.query.search === "string" ? req.query.search : undefined;
      const limit =
        typeof req.query.limit === "string"
          ? Number.parseInt(req.query.limit, 10)
          : undefined;
      const skip =
        typeof req.query.skip === "string"
          ? Number.parseInt(req.query.skip, 10)
          : undefined;

      const { jobs, total } = await listJobs({
        category,
        remote,
        search,
        limit,
        skip,
      });

      return res.json({ success: true, data: { jobs, total } });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to list jobs",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}
