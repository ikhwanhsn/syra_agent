/**
 * CRUD for admin Organize tracker entries.
 */
import mongoose from 'mongoose';
import OrganizeEntry, {
  ORGANIZE_ENTRY_TYPES,
  ORGANIZE_ENTRY_STATUSES,
} from '../../models/labs/OrganizeEntry.js';

/**
 * @param {import('mongoose').Document | Record<string, unknown>} doc
 * @returns {object}
 */
function serializeEntry(doc) {
  return {
    id: doc._id.toString(),
    anonymousId: doc.anonymousId,
    type: doc.type,
    title: doc.title,
    status: doc.status,
    organizer: doc.organizer || '',
    url: doc.url || '',
    amount: doc.amount ?? null,
    deadline: doc.deadline ?? null,
    eventDate: doc.eventDate ?? null,
    notes: doc.notes || '',
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * @param {string} walletAddress
 * @returns {string}
 */
export function anonymousIdFromWallet(walletAddress) {
  const addr = String(walletAddress || '').trim();
  if (!addr) throw new Error('wallet address is required');
  return `wallet:${addr}`;
}

/**
 * @param {unknown} value
 * @returns {Date | null}
 */
function parseOptionalDate(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error('invalid date');
  return d;
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function parseTags(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error('tags must be an array');
  return value
    .map((t) => String(t || '').trim())
    .filter(Boolean)
    .slice(0, 20);
}

/**
 * @param {Record<string, unknown>} input
 * @returns {object}
 */
function validateEntryInput(input, { partial = false } = {}) {
  const out = {};

  if (!partial || input.type !== undefined) {
    const type = String(input.type || '').trim();
    if (!ORGANIZE_ENTRY_TYPES.includes(type)) {
      throw new Error(`type must be one of: ${ORGANIZE_ENTRY_TYPES.join(', ')}`);
    }
    out.type = type;
  }

  if (!partial || input.title !== undefined) {
    const title = String(input.title || '').trim();
    if (!title) throw new Error('title is required');
    if (title.length > 256) throw new Error('title is too long');
    out.title = title;
  }

  if (!partial || input.status !== undefined) {
    const status = String(input.status || '').trim();
    if (!ORGANIZE_ENTRY_STATUSES.includes(status)) {
      throw new Error(`status must be one of: ${ORGANIZE_ENTRY_STATUSES.join(', ')}`);
    }
    out.status = status;
  }

  if (!partial || input.organizer !== undefined) {
    out.organizer = String(input.organizer || '').trim().slice(0, 128);
  }

  if (!partial || input.url !== undefined) {
    out.url = String(input.url || '').trim().slice(0, 2048);
  }

  if (!partial || input.amount !== undefined) {
    if (input.amount == null || input.amount === '') {
      out.amount = null;
    } else {
      const amount = Number(input.amount);
      if (!Number.isFinite(amount) || amount < 0) throw new Error('amount must be a non-negative number');
      out.amount = amount;
    }
  }

  if (!partial || input.deadline !== undefined) {
    out.deadline = parseOptionalDate(input.deadline);
  }

  if (!partial || input.eventDate !== undefined) {
    out.eventDate = parseOptionalDate(input.eventDate);
  }

  if (!partial || input.notes !== undefined) {
    out.notes = String(input.notes || '').trim().slice(0, 4096);
  }

  if (!partial || input.tags !== undefined) {
    out.tags = parseTags(input.tags);
  }

  return out;
}

/**
 * @param {string} anonymousId
 * @param {{ type?: string; status?: string }} [filters]
 * @returns {Promise<object[]>}
 */
export async function listEntries(anonymousId, filters = {}) {
  const query = { anonymousId };
  if (filters.type && ORGANIZE_ENTRY_TYPES.includes(filters.type)) {
    query.type = filters.type;
  }
  if (filters.status && ORGANIZE_ENTRY_STATUSES.includes(filters.status)) {
    query.status = filters.status;
  }
  const docs = await OrganizeEntry.find(query).sort({ updatedAt: -1 }).lean();
  return docs.map(serializeEntry);
}

/**
 * @param {string} anonymousId
 * @param {Record<string, unknown>} input
 * @returns {Promise<object>}
 */
export async function createEntry(anonymousId, input) {
  const data = validateEntryInput(input);
  const doc = await OrganizeEntry.create({ anonymousId, ...data });
  return serializeEntry(doc);
}

/**
 * @param {string} anonymousId
 * @param {string} id
 * @param {Record<string, unknown>} input
 * @returns {Promise<object>}
 */
export async function updateEntry(anonymousId, id, input) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('invalid entry id');
  }
  const data = validateEntryInput(input, { partial: true });
  if (Object.keys(data).length === 0) {
    throw new Error('no fields to update');
  }
  const doc = await OrganizeEntry.findOneAndUpdate(
    { _id: id, anonymousId },
    { $set: data },
    { new: true },
  ).lean();
  if (!doc) throw new Error('entry not found');
  return serializeEntry(doc);
}

/**
 * @param {string} anonymousId
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteEntry(anonymousId, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('invalid entry id');
  }
  const result = await OrganizeEntry.deleteOne({ _id: id, anonymousId });
  if (result.deletedCount === 0) throw new Error('entry not found');
}
