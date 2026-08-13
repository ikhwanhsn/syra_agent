import {formatUsd, formatCompactAmount, shortenAddress} from '../src/lib/format';

describe('format', () => {
  it('formats usd and compact amounts', () => {
    expect(formatUsd(1234.56)).toContain('$');
    expect(formatCompactAmount(1_500_000)).toBe('1.5M');
    expect(shortenAddress('Abcdefghijklmnop1234567890xyz')).toMatch(/…/);
  });
});
