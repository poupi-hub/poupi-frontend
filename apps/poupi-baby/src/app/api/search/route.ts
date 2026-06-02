import { getBackendUrl } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND = getBackendUrl('3001');
const LOCAL_BACKEND = 'http://localhost:3001';

type BackendSearchResult = {
  id: string;
  slug: string;
  canonicalName?: string | null;
  title?: string | null;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  bestOfferPrice?: number | null;
  offerCount?: number;
  offers?: Array<{
    marketplace?: { name?: string | null; slug?: string | null } | null;
  }>;
};

function nameFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => (part.length <= 3 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)))
    .join(' ');
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const limit = req.nextUrl.searchParams.get('limit') ?? '12';

  if (q.length < 2) return NextResponse.json({ query: q, results: [] });

  const params = new URLSearchParams({ q, limit, sort: 'best_price' });
  let res: Response;
  try {
    res = await fetch(`${BACKEND}/products/search?${params.toString()}`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(4_000),
    });
  } catch {
    res = await fetch(`${LOCAL_BACKEND}/products/search?${params.toString()}`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(4_000),
    });
  }

  if ((res.status === 401 || res.status === 404) && BACKEND !== LOCAL_BACKEND) {
    res = await fetch(`${LOCAL_BACKEND}/products/search?${params.toString()}`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(4_000),
    });
  }

  const data = await res.json().catch(() => []);
  if (!res.ok) {
    return NextResponse.json(
      { error: 'Erro ao buscar produtos', results: [] },
      { status: res.status },
    );
  }

  const results = (Array.isArray(data) ? data : []).map(
    (item: BackendSearchResult) => ({
      id: item.id,
      slug: item.slug,
      name: item.canonicalName || item.title || nameFromSlug(item.slug),
      brand: item.brand,
      category: item.category,
      imageUrl: item.imageUrl,
      lowestPrice: item.bestOfferPrice ?? null,
      availableStores: Array.from(
        new Set(
          (item.offers ?? [])
            .map((offer) => offer.marketplace?.name)
            .filter(Boolean) as string[],
        ),
      ),
      offerCount: item.offerCount ?? 0,
      href: `/produto/${item.slug}`,
    }),
  );

  return NextResponse.json({ query: q, results });
}
