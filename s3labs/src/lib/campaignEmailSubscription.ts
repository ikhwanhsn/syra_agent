const STORAGE_KEY = "s3labs_campaign_email_subscribed";

export function getSubscribedCampaignEmail(): string | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const trimmed = raw.trim().toLowerCase();
    return trimmed || null;
  } catch {
    return null;
  }
}

export function setSubscribedCampaignEmail(email: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, email.trim().toLowerCase());
  } catch {
    // ignore quota / private mode
  }
}

export function clearSubscribedCampaignEmail(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
