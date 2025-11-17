export async function GET(req: Request) {
  const res = await fetch(
    `https://cryptonews-api.com/api/v1/category?section=general&items=13&page=1&token=${process.env.CRYPTO_NEWS_API_KEY}`
  );
  const data = await res.json();
  return Response.json({ success: true, data });
}
