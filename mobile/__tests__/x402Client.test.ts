jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(),
  PublicKey: jest.fn().mockImplementation((v: string) => ({toBase58: () => v})),
  TransactionMessage: jest.fn(),
  VersionedTransaction: jest.fn(),
  ComputeBudgetProgram: {
    setComputeUnitLimit: jest.fn(),
    setComputeUnitPrice: jest.fn(),
  },
}));

jest.mock('@solana/spl-token', () => ({
  createTransferCheckedInstruction: jest.fn(),
  createAssociatedTokenAccountInstruction: jest.fn(),
  getAssociatedTokenAddress: jest.fn(),
  getMint: jest.fn(),
  getAccount: jest.fn(),
  TOKEN_PROGRAM_ID: {},
  TOKEN_2022_PROGRAM_ID: {},
}));

import {
  parseX402Response,
  getBestPaymentOption,
  formatPaymentAmount,
} from '../src/lib/x402Client';

describe('x402Client', () => {
  it('parses v2 Solana 402 accepts', () => {
    const parsed = parseX402Response({
      x402Version: 2,
      accepts: [
        {
          scheme: 'exact',
          network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          amount: '5000',
          payTo: '11111111111111111111111111111112',
          asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          maxTimeoutSeconds: 60,
          extra: {feePayer: 'DeXterR2kQm8AvRHnNPatWkE46TfAcMeBDjb6FySoAb8'},
        },
      ],
      resource: {url: 'https://api.syraa.fun/news'},
    });
    expect(parsed?.x402Version).toBe(2);
    const best = getBestPaymentOption(parsed!);
    expect(best?.amount).toBe('5000');
    expect(best?.extra?.feePayer).toContain('DeXter');
    expect(formatPaymentAmount('5000')).toBe('0.005');
  });
});
