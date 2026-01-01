export async function getOhlc(req, res) {
  const { symbol = "BTCUSDT", interval = "1m" } = req.query;
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}`
  );
  const data = await response.json();
  res.json(data);
}
