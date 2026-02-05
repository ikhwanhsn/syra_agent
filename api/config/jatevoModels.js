/**
 * Jatevo Model Library – available AI models for inference (inference.jatevo.id).
 * Used by the agent chat completion and exposed to the frontend for model selection.
 */
export const JATEVO_DEFAULT_MODEL = 'glm-4.7';

export const JATEVO_MODELS = [
  { id: 'gpt-oss-120b', name: 'GPT-OSS 120B', contextWindow: '32K', capabilities: ['reasoning', 'creative', 'general'] },
  { id: 'deepseek-v3.2', name: 'DeepSeek V3.2', contextWindow: '128K', capabilities: ['reasoning', 'coding', 'math'] },
  { id: 'glm-4.6v', name: 'GLM 4.6V', contextWindow: '131K', capabilities: ['vision', 'multimodal', 'document_analysis'] },
  { id: 'glm-4.7', name: 'GLM 4.7', contextWindow: '128K', capabilities: ['reasoning', 'coding', 'agentic', 'extended_thinking'] },
  { id: 'glm-4.7-fp8', name: 'GLM 4.7 FP8', contextWindow: '128K', capabilities: ['reasoning', 'coding', 'agentic', 'extended_thinking'] },
  { id: 'kimi-k2.5', name: 'Kimi K2.5', contextWindow: '262K', capabilities: ['reasoning', 'coding', 'vision', 'multimodal', 'agentic'] },
  { id: 'llama-4-maverick', name: 'Llama 4 Maverick', contextWindow: '128K', capabilities: ['reasoning', 'coding', 'vision', 'multimodal'] },
  { id: 'qwen-2.5-vl', name: 'Qwen 2.5 VL', contextWindow: '128K', capabilities: ['reasoning', 'coding', 'vision', 'multimodal', 'ocr'] },
  { id: 'qwen-2.5-v1-72b', name: 'Qwen 2.5 VL 72B', contextWindow: '128K', capabilities: ['reasoning', 'coding', 'vision', 'multimodal', 'document_analysis'] },
  { id: 'qwen-3-coder-480b', name: 'Qwen 3 Coder 480B', contextWindow: '32K', capabilities: ['coding', 'reasoning'] },
];
