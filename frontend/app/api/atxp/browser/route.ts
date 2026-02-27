/**
 * ATXP browse API has been removed. This route returns 410 Gone.
 * Use EXA search or other non-ATXP endpoints instead.
 */
export const GET = async () => {
  return new Response(
    JSON.stringify({
      error: "Gone",
      message: "ATXP-based browse has been removed. Use /exa-search or other available endpoints.",
      deprecated: true,
    }),
    {
      status: 410,
      headers: { "Content-Type": "application/json" },
    }
  );
};
