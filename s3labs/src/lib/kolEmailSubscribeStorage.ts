const STORAGE_KEY = "s3labs-kol-email-subscribed";

/** Client-side flag: user already subscribed (or confirmed already subscribed). */
export function hasKolEmailSubscribed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markKolEmailSubscribed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore quota / private mode
  }
}
