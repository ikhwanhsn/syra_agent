import { useState, useEffect } from "react";

const STORAGE_KEY = "telegram_community_modal_dismissed_until";
const RESET_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function getDismissedUntil(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function setDismissedUntil(timestamp: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(timestamp));
  } catch {
    // ignore
  }
}

export function useTelegramPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const until = getDismissedUntil();
    const shouldShow = until === null || Date.now() > until;
    setOpen(shouldShow);
  }, []);

  const dismiss = () => {
    setDismissedUntil(Date.now() + RESET_DAYS_MS);
    setOpen(false);
  };

  return { open, dismiss, setOpen };
}
