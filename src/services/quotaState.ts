let googleQuotaExceeded = false;

export const isGoogleQuotaExceeded = (): boolean => googleQuotaExceeded;

export const markGoogleQuotaExceeded = (): void => {
  if (googleQuotaExceeded) return;
  googleQuotaExceeded = true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lunchhub:quota-exceeded'));
  }
};

export const checkGoogleQuotaStatus = async (): Promise<boolean> => {
  if (import.meta.env.VITE_MAP_PROVIDER !== 'google') return false;
  if (googleQuotaExceeded) return true;
  try {
    const res = await fetch('/api/places/status');
    if (!res.ok) return false;
    const data = (await res.json()) as { quotaExceeded?: boolean };
    if (data.quotaExceeded) {
      markGoogleQuotaExceeded();
      return true;
    }
    return false;
  } catch {
    return false;
  }
};
