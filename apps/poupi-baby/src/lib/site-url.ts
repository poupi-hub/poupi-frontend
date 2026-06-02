const FALLBACK_SITE_URL = 'https://radardoberco.com.br';

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL;

  try {
    return new URL(raw).toString().replace(/\/$/, '');
  } catch {
    return FALLBACK_SITE_URL;
  }
}
