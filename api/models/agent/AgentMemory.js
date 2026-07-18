import mongoose from 'mongoose';
import { MEMORY_TTL_DAYS } from '../../config/memoryConfig.js';

const agentMemorySchema = new mongoose.Schema(
  {
    /** Owner scope — all reads/writes filtered by this. */
    anonymousId: { type: String, required: true, index: true },
    chatId: { type: String, default: null, index: true },
    messageId: { type: String, default: null },
    role: { type: String, enum: ['user', 'assistant', 'system'], default: 'user' },
    text: { type: String, required: true },
    /** Extensible for Phase 2 multimodal (text | image | text_image). */
    modality: { type: String, enum: ['text', 'image', 'text_image'], default: 'text' },
    mediaRef: { type: String, default: null },
    model: { type: String, default: null },
    dimensions: { type: Number, default: null },
    /** Qdrant point id (UUID) when stored in Qdrant; mirrors _id otherwise. */
    vectorId: { type: String, default: null },
    store: { type: String, enum: ['qdrant', 'mongo', 'none'], default: 'none' },
    status: {
      type: String,
      enum: ['pending', 'stored', 'failed', 'unavailable'],
      default: 'pending',
    },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true, collection: 'agent_memories' }
);

agentMemorySchema.index({ anonymousId: 1, createdAt: -1 });
agentMemorySchema.index(
  { anonymousId: 1, chatId: 1, messageId: 1 },
  { sparse: true }
);
agentMemorySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: MEMORY_TTL_DAYS * 24 * 60 * 60 }
);

const AgentMemory =
  mongoose.models.AgentMemory || mongoose.model('AgentMemory', agentMemorySchema);

export default AgentMemory;
