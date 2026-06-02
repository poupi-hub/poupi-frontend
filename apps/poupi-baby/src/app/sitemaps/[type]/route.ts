import { getSiteUrl } from '@/lib/site-url';
import { getBackendUrl } from '@/lib/backend-url';
const BACKEND = getBackendUrl("3001");
const SITE_URL = getSiteUrl();

type Params = { params: Promise<unknown> };

async function fetchJson<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [] as T;
    return res.json() as Promise<T>;
  } catch {
    return [] as T;
  }
}

export async function GET(_req: Request, { params }: Params) {
  const resolved = (await params) as { type?: string };
  const type = resolved.type ?? '';
  const urls = await buildUrls(type.replace(/\.xml$/, ''));
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${SITE_URL}${url}</loc><lastmod>${new Date().toISOString()}</lastmod></url>`)
    .join('\n')}\n</urlset>`;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

async function buildUrls(type: string): Promise<string[]> {
  if (type === 'products') {
    const products = await fetchJson<Array<{ slug: string }>>('/seo/products/sitemap');
    return products.map((product) => `/produto/${product.slug}`);
  }
  if (type === 'categories') {
    const categories = await fetchJson<Array<{ slug: string }>>('/seo/categories');
    return categories.map((category) => `/categoria/${category.slug}`);
  }
  if (type === 'brands') {
    const brands = await fetchJson<Array<{ slug: string }>>('/seo/brands');
    return brands.map((brand) => `/marca/${brand.slug}`);
  }
  if (type === 'marketplaces') {
    const marketplaces = await fetchJson<Array<{ slug: string | null }>>('/seo/marketplaces');
    return marketplaces.filter((marketplace) => marketplace.slug).map((marketplace) => `/farmacia/${marketplace.slug}`);
  }
  if (type === 'programmatic') {
    const [categories, brands, marketplaces] = await Promise.all([
      fetchJson<Array<{ slug: string; count: number }>>('/seo/categories'),
      fetchJson<Array<{ slug: string; count: number }>>('/seo/brands'),
      fetchJson<Array<{ slug: string | null }>>('/seo/marketplaces'),
    ]);
    return [
      ...categories
        .filter((category) => category.count >= 8)
        .flatMap((category) => [
          `/categoria/${category.slug}/melhor-preco`,
          `/categoria/${category.slug}/promocoes`,
          `/categoria/${category.slug}/top-marcas`,
          `/categoria/${category.slug}/historico-preco`,
          `/categoria/${category.slug}/mais-baratos`,
          `/melhor-custo-beneficio/${category.slug}`,
          `/quedas-de-preco/${category.slug}`,
          `/tendencia-de-preco/${category.slug}`,
        ]),
      ...brands
        .filter((brand) => brand.count >= 6)
        .flatMap((brand) => [`/marca/${brand.slug}/promocoes`, `/marca/${brand.slug}/melhor-preco`]),
      ...marketplaces.filter((marketplace) => marketplace.slug).map((marketplace) => `/farmacia/${marketplace.slug}/promocoes`),
    ];
  }
  return [];
}
