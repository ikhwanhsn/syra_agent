export async function GET(req: Request) {
  const res = await fetch(
    `https://cryptonews-api.com/api/v1/sundown-digest?items=15&page=1&token=${process.env.CRYPTO_NEWS_API_KEY}`
  );
  const data = await res.json();
  return Response.json({ success: true, data });
}
