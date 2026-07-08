/**
 * OrganizeEntry — admin-only tracker for Syra activities (hackathons, funding, events, etc.).
 */
import mongoose from 'mongoose';

export const ORGANIZE_ENTRY_TYPES = [
  'hackathon',
  'funding',
  'event',
  'partnership',
  'application',
  'other',
];

export const ORGANIZE_ENTRY_STATUSES = [
  'interested',
  'applied',
  'registered',
  'in_progress',
  'submitted',
  'won',
  'rejected',
  'done',
];

const organizeEntrySchema = new mongoose.Schema(
  {
    anonymousId: { type: String, required: true, index: true },
    type: { type: String, enum: ORGANIZE_ENTRY_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 256 },
    status: { type: String, enum: ORGANIZE_ENTRY_STATUSES, required: true, index: true },
    organizer: { type: String, trim: true, maxlength: 128, default: '' },
    url: { type: String, trim: true, maxlength: 2048, default: '' },
    amount: { type: Number, default: null },
    deadline: { type: Date, default: null },
    eventDate: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 4096, default: '' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

organizeEntrySchema.index({ anonymousId: 1, updatedAt: -1 });

export default mongoose.models.OrganizeEntry || mongoose.model('OrganizeEntry', organizeEntrySchema);
