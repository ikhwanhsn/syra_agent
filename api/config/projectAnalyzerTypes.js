/**
 * Batch project analysis by **type** only. X handles are static per type in this file.
 * Add new keys when you support another vertical; optional `provider` routes analyzers later.
 */

/** @typedef {'x'} ProjectAnalyzerProvider */

/**
 * @typedef {object} ProjectAnalyzerTypeDef
 * @property {string} id — API `type` value (lowercase key)
 * @property {string} label
 * @property {ProjectAnalyzerProvider} provider
 * @property {string[]} handles — X usernames without @ (static)
 */

/** @type {Record<string, ProjectAnalyzerTypeDef>} */
export const PROJECT_ANALYZER_TYPES = {
  x402: {
    id: 'x402',
    label: 'x402 ecosystem (curated sample)',
    provider: 'x',
    handles: [
      'PayAINetwork',
      'dexteraisol',
      'zauthinc',
      'xona_agent',
      'Hyre_agent',
      'Planktonomous',
      'syra_agent',
    ],
  },
};

/** @returns {string[]} */
export function listProjectAnalyzerTypeIds() {
  return Object.keys(PROJECT_ANALYZER_TYPES);
}

/** @param {string} typeId */
export function getProjectAnalyzerType(typeId) {
  if (!typeId || typeof typeId !== 'string') return null;
  const key = typeId.trim().toLowerCase();
  return PROJECT_ANALYZER_TYPES[key] ?? null;
}

/** Discovery: dynamic types only; handles stay in code (count only). */
export function listProjectAnalyzerTypesPublic() {
  return Object.values(PROJECT_ANALYZER_TYPES).map((t) => ({
    type: t.id,
    label: t.label,
    provider: t.provider,
    accountCount: t.handles.length,
  }));
}
