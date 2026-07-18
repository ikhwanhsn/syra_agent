/**
 * Multi-chain token analysis dispatcher.
 * Routes Solana mints to memecoinAnalysisService and EVM addresses to evmTokenAnalysisService.
 */
import { buildMemecoinAnalysis } from './memecoinAnalysisService.js';
import { buildEvmTokenAnalysis } from './evmTokenAnalysisService.js';
import { detectTokenChainKind, normalizeTokenAddress } from './tokenChainDetect.js';

/**
 * @param {{ address?: string; mint?: string; force?: boolean }} input
 */
export async function buildTokenAnalysis(input) {
  const raw = input.address ?? input.mint ?? '';
  const address = normalizeTokenAddress(raw);
  const kind = detectTokenChainKind(address ?? raw);

  if (!kind || !address) {
    return {
      ok: false,
      error: 'Provide a valid Solana mint or EVM token address (0x…)',
      status: 400,
    };
  }

  if (kind === 'evm') {
    return buildEvmTokenAnalysis({ address, force: input.force });
  }

  return buildMemecoinAnalysis({ mint: address, force: input.force });
}
