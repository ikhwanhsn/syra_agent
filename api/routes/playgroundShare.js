/**
 * Playground share API: save/load request config by content-based slug.
 * Same request (method, url, params, headers, body) => same slug, so shared links are stable.
 */
import { Router } from 'express';
import crypto from 'crypto';
import connectMongoose from '../config/mongoose.js';
import PlaygroundShare from '../models/PlaygroundShare.js';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function canonicalRequest(payload) {
  const { method = 'GET', url = '', params = [], headers = [], body = '' } = payload;
  const norm = {
    method: String(method).toUpperCase(),
    url: String(url).trim(),
    params: [...params]
      .filter((p) => p && typeof p.key === 'string')
      .map((p) => ({ key: p.key, value: String(p.value ?? ''), enabled: !!p.enabled }))
      .sort((a, b) => (a.key || '').localeCompare(b.key || '')),
    headers: [...headers]
      .filter((h) => h && typeof h.key === 'string')
      .map((h) => ({ key: h.key, value: String(h.value ?? ''), enabled: !!h.enabled }))
      .sort((a, b) => (a.key || '').localeCompare(b.key || '')),
    body: String(body ?? '').trim(),
  };
  return JSON.stringify(norm);
}

function slugFromRequest(payload) {
  const canonical = canonicalRequest(payload);
  return crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 12);
}

export async function createPlaygroundShareRouter() {
  await connectMongoose();
  const router = Router();

  /** POST /playground/share — create or get share. Body: { method, url, params?, headers?, body?, sharedByWallet?, sharedByChain?, sharedByEmail? }. Returns { slug }. */
  router.post('/share', async (req, res) => {
    try {
      const { method, url, params, headers, body, sharedByWallet, sharedByChain, sharedByEmail } = req.body || {};
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'Missing or invalid url' });
        return;
      }
      const payload = {
        method: method || 'GET',
        url: url.trim(),
        params: Array.isArray(params) ? params : [],
        headers: Array.isArray(headers) ? headers : [],
        body: typeof body === 'string' ? body : '',
      };
      const slug = slugFromRequest(payload);
      const update = {
        method: payload.method,
        url: payload.url,
        params: payload.params,
        headers: payload.headers,
        body: payload.body,
      };
      if (sharedByWallet != null && typeof sharedByWallet === 'string' && sharedByWallet.trim()) {
        update.sharedByWallet = sharedByWallet.trim();
      }
      if (sharedByChain === 'solana' || sharedByChain === 'base') {
        update.sharedByChain = sharedByChain;
      }
      if (sharedByEmail != null && typeof sharedByEmail === 'string' && sharedByEmail.trim()) {
        update.sharedByEmail = sharedByEmail.trim();
      }
      await PlaygroundShare.findOneAndUpdate(
        { slug },
        { $set: update },
        { upsert: true, new: true }
      );
      res.json({ slug });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save share', message: err.message });
    }
  });

  /** GET /playground/shares — list shared requests (all users). Query: limit (default 50), offset (0), method (GET|POST|...), search (url substring). */
  router.get('/shares', async (req, res) => {
    try {
      const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 50), 100);
      const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
      const method = (req.query.method || '').toUpperCase();
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

      const filter = {};
      if (method && ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) filter.method = method;
      if (search) filter.url = { $regex: escapeRegex(search), $options: 'i' };

      const [items, total] = await Promise.all([
        PlaygroundShare.find(filter)
          .sort({ updatedAt: -1 })
          .skip(offset)
          .limit(limit)
          .select('slug method url params headers body createdAt updatedAt')
          .lean(),
        PlaygroundShare.countDocuments(filter),
      ]);

      res.json({
        items: items.map((doc) => ({
          slug: doc.slug,
          method: doc.method,
          url: doc.url,
          paramsCount: (doc.params || []).length,
          headersCount: (doc.headers || []).length,
          bodyLength: (doc.body && doc.body.length) || 0,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          sharedByWallet: doc.sharedByWallet ?? null,
          sharedByChain: doc.sharedByChain ?? null,
          sharedByEmail: doc.sharedByEmail ?? null,
        })),
        total,
        limit,
        offset,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to list shares', message: err.message });
    }
  });

  /** GET /playground/explorer/stats — aggregate stats for explorer dashboard. */
  router.get('/explorer/stats', async (req, res) => {
    try {
      const [total, byMethod, lastCreated] = await Promise.all([
        PlaygroundShare.countDocuments(),
        PlaygroundShare.aggregate([{ $group: { _id: '$method', count: { $sum: 1 } } }]),
        PlaygroundShare.findOne().sort({ createdAt: -1 }).select('createdAt').lean(),
      ]);

      const byMethodMap = {};
      (byMethod || []).forEach((x) => (byMethodMap[x._id] = x.count));

      res.json({
        total,
        byMethod: byMethodMap,
        lastCreatedAt: lastCreated?.createdAt || null,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get explorer stats', message: err.message });
    }
  });

  /** GET /playground/explorer/charts — chart-ready data: sharesOverTime (last 14 days), byMethod, byChain, last24h. */
  router.get('/explorer/charts', async (req, res) => {
    try {
      const days = Math.min(Math.max(7, parseInt(req.query.days, 10) || 14), 30);
      const startDate = new Date();
      startDate.setUTCDate(startDate.getUTCDate() - days);
      startDate.setUTCHours(0, 0, 0, 0);

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [sharesOverTime, byMethod, byChain, last24h] = await Promise.all([
        PlaygroundShare.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        PlaygroundShare.aggregate([{ $group: { _id: '$method', count: { $sum: 1 } } }]),
        PlaygroundShare.aggregate([
          { $match: { sharedByChain: { $in: ['solana', 'base'] } } },
          { $group: { _id: '$sharedByChain', count: { $sum: 1 } } },
        ]),
        PlaygroundShare.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      ]);

      const byMethodMap = (byMethod || []).map((x) => ({ method: x._id, count: x.count }));
      const byChainMap = (byChain || []).map((x) => ({ chain: x._id, count: x.count }));
      const emptyDayMap = {};
      for (let d = 0; d < days; d++) {
        const dte = new Date(startDate);
        dte.setUTCDate(dte.getUTCDate() + d);
        const key = dte.toISOString().slice(0, 10);
        emptyDayMap[key] = { date: key, count: 0 };
      }
      (sharesOverTime || []).forEach((x) => {
        if (emptyDayMap[x._id]) emptyDayMap[x._id].count = x.count;
        else emptyDayMap[x._id] = { date: x._id, count: x.count };
      });
      const sharesOverTimeSorted = Object.values(emptyDayMap).sort((a, b) => a.date.localeCompare(b.date));

      res.json({
        sharesOverTime: sharesOverTimeSorted,
        byMethod: byMethodMap,
        byChain: byChainMap,
        last24h,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get explorer charts', message: err.message });
    }
  });

  /** GET /playground/share/:slug — get shared request config. Returns { method, url, params, headers, body }. */
  router.get('/share/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      if (!slug || !/^[a-f0-9]{1,24}$/.test(slug)) {
        res.status(400).json({ error: 'Invalid slug' });
        return;
      }
      const doc = await PlaygroundShare.findOne({ slug }).lean();
      if (!doc) {
        res.status(404).json({ error: 'Share not found' });
        return;
      }
      res.json({
        method: doc.method,
        url: doc.url,
        params: doc.params || [],
        headers: doc.headers || [],
        body: doc.body ?? '',
        slug: doc.slug,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        sharedByWallet: doc.sharedByWallet ?? null,
        sharedByChain: doc.sharedByChain ?? null,
        sharedByEmail: doc.sharedByEmail ?? null,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load share', message: err.message });
    }
  });

  return router;
}
