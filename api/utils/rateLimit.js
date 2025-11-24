// rateLimit.js
const rateLimit = (options) => {
  const windowMs = options.windowMs || 60000; // default 1 min
  const max = options.max || 60; // default 60 req per window

  // Store counters in memory
  const hits = new Map();

  return (req, res, next) => {
    const ip = req.ip;

    const now = Date.now();
    const resetTime = now + windowMs;

    if (!hits.has(ip)) {
      hits.set(ip, { count: 1, resetTime });
      return next();
    }

    const data = hits.get(ip);

    // reset window if expired
    if (now > data.resetTime) {
      hits.set(ip, { count: 1, resetTime });
      return next();
    }

    // increase request count
    data.count++;

    if (data.count > max) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, slow down.",
      });
    }

    next();
  };
};

export default rateLimit;
