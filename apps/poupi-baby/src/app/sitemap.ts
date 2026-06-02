import { getSiteUrl } from '@/lib/site-url';
import { getBackendUrl } from '@/lib/backend-url';
import type { MetadataRoute } from 'next';

const SITE_URL = getSiteUrl();
const BACKEND  = getBackendUrl("3001");

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

type SitemapProduct  = { slug: string; updatedAt: string };
type SitemapCategory = { slug: string; count?: number };
type SitemapBrand    = { slug: string };
type SitemapMarketplace = { slug: string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/faq`,           lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.5 },
    { url: `${SITE_URL}/privacidade`,   lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.3 },
    { url: `${SITE_URL}/termos`,        lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.3 },
  ];

  const [products, categories, brands, marketplaces] = await Promise.all([
    fetchJson<SitemapProduct[]>('/seo/products/sitemap'),
    fetchJson<SitemapCategory[]>('/seo/categories'),
    fetchJson<SitemapBrand[]>('/seo/brands'),
    fetchJson<SitemapMarketplace[]>('/seo/marketplaces'),
  ]);

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${SITE_URL}/produto/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${SITE_URL}/categoria/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  const programmaticCategoryRoutes: MetadataRoute.Sitemap = (categories ?? [])
    .filter((c) => (c.count ?? 0) >= 8)
    .flatMap((c) => [
      {
        url: `${SITE_URL}/categoria/${c.slug}/melhor-preco`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.65,
      },
      {
        url: `${SITE_URL}/categoria/${c.slug}/promocoes`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.65,
      },
      ...((c.count ?? 0) >= 10
        ? [{
            url: `${SITE_URL}/top-10/${c.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.55,
          }]
        : []),
    ]);

  const brandRoutes: MetadataRoute.Sitemap = (brands ?? []).map((b) => ({
    url: `${SITE_URL}/marca/${b.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const marketplaceRoutes: MetadataRoute.Sitemap = (marketplaces ?? [])
    .filter((m) => m.slug)
    .map((m) => ({
      url: `${SITE_URL}/farmacia/${m.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

  const marketplacePromotionRoutes: MetadataRoute.Sitemap = (marketplaces ?? [])
    .filter((m) => m.slug)
    .map((m) => ({
      url: `${SITE_URL}/farmacia/${m.slug}/promocoes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.45,
    }));

  return [
    ...staticRoutes,
    ...productRoutes,
    ...categoryRoutes,
    ...programmaticCategoryRoutes,
    ...brandRoutes,
    ...marketplaceRoutes,
    ...marketplacePromotionRoutes,
  ];
}
