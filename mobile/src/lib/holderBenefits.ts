import {apiGetJson} from './api';

export type HolderBenefitsData = {
  wallet?: string;
  syraAmount?: number;
  discount?: number;
  tier?: string | null;
  message?: string;
  [key: string]: unknown;
};

export async function fetchHolderBenefits(
  wallet: string,
): Promise<HolderBenefitsData | null> {
  const {status, json} = await apiGetJson<any>(
    `/rewards/holder-benefits?wallet=${encodeURIComponent(wallet)}`,
  );
  if (status >= 400 || !json) return null;
  return (json.data ?? json) as HolderBenefitsData;
}
