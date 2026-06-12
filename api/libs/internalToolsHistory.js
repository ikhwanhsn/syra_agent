/** Max saved outputs per internal tool collection (oldest removed on overflow). */
export const INTERNAL_TOOLS_HISTORY_MAX = 15;

/**
 * Keep only the newest `maxItems` documents; delete older rows.
 * @param {import("mongoose").Model} Model
 * @param {number} [maxItems]
 */
export async function trimInternalToolHistory(Model, maxItems = INTERNAL_TOOLS_HISTORY_MAX) {
  const capped = Math.max(1, Math.floor(maxItems));
  const stale = await Model.find({})
    .sort({ createdAt: -1 })
    .skip(capped)
    .select("_id")
    .lean();

  if (stale.length === 0) return { deleted: 0 };

  const ids = stale.map((d) => d._id);
  const result = await Model.deleteMany({ _id: { $in: ids } });
  return { deleted: result.deletedCount ?? 0 };
}
