import { ProductSearch } from '@/components/ProductSearch';
import { getBackendUrl } from '@/lib/backend-url';
import { getSiteUrl } from '@/lib/site-url';
import type { Metadata } from 'next';
import Link from 'next/link';

const BACKEND = getBackendUrl('3001');
const LOCAL_BACKEND = 'http://localhost:3001';
const SITE_URL = getSiteUrl();

type Taxonomy = { name: string; slug: string; count: number };
type ProductCard = {
  id: string;
  slug: string;
  canonicalName?: string | null;
  title: string;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  offers: Array<{
    price: number | string;
    currentPrice?: number | string | null;
    marketplace?: { name?: string | null } | null;
  }>;
};

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    let res = await fetch(`${BACKEND}${path}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4_000),
    });
    if ((res.status === 401 || res.status === 404) && BACKEND !== LOCAL_BACKEND) {
      res = await fetch(`${LOCAL_BACKEND}${path}`, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(4_000),
      });
    }
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    if (BACKEND !== LOCAL_BACKEND) {
      try {
        const res = await fetch(`${LOCAL_BACKEND}${path}`, {
          next: { revalidate: 300 },
          signal: AbortSignal.timeout(4_000),
        });
        if (res.ok) return (await res.json()) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export const metadata: Metadata = {
  title: 'Produtos | Radar do Berco',
  description: 'Busque produtos infantis por nome, marca ou categoria e crie alertas de preco.',
  alternates: { canonical: `${SITE_URL}/produtos` },
};

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const [catalog, categories, brands] = await Promise.all([
    fetchJson<{ products: ProductCard[]; total: number }>('/seo/products?limit=24', {
      products: [],
      total: 0,
    }),
    fetchJson<Taxonomy[]>('/seo/categories', []),
    fetchJson<Taxonomy[]>('/seo/brands', []),
  ]);

  return (
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-6 text-[#090A3D]">
      <div className="mx-auto max-w-6xl space-y-5">
        <nav className="text-xs text-[#5B607C]">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-[#5B4CF0]">
                Radar do Berco
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-[#090A3D]">Produtos</li>
          </ol>
        </nav>

        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Encontre um produto e crie um alerta</h1>
          <p className="mt-1 text-sm text-[#5B607C]">
            Pesquise por nome, marca ou categoria. O fluxo por URL continua disponivel quando o item ainda nao estiver no catalogo.
          </p>
        </header>

        <ProductSearch initialQuery={q} />

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <TaxonomyList title="Categorias" items={categories} basePath="/categoria" />
          <TaxonomyList title="Marcas" items={brands} basePath="/marca" />
        </section>

        <section className="rounded-lg border border-[#E4E7F2] bg-white p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold">Produtos recentes</h2>
              <p className="mt-1 text-sm text-[#5B607C]">
                {catalog.total} produto{catalog.total !== 1 ? 's' : ''} no catalogo atual.
              </p>
            </div>
            <Link href="/dashboard#url-fallback" className="text-sm font-semibold text-[#5B4CF0]">
              Nao encontrou seu produto?
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.products.map((product) => {
              const bestOffer = product.offers?.[0] ?? null;
              const bestPrice = bestOffer ? Number(bestOffer.currentPrice ?? bestOffer.price) : null;
              const name = product.canonicalName || product.title;
              return (
                <Link
                  key={product.id}
                  href={`/produto/${product.slug}`}
                  className="rounded-lg border border-[#E4E7F2] bg-[#FCFDFF] p-3 transition hover:border-[#5B4CF0] hover:bg-white"
                >
                  <div className="flex gap-3">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={name} className="h-14 w-14 rounded-lg object-contain" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#5B4CF0]">
                        <i className="ti ti-package text-2xl" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[#5B4CF0]">
                        {product.brand || product.category || 'Produto'}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold">{name}</h3>
                      <p className="mt-1 truncate text-xs text-[#5B607C]">
                        {bestOffer?.marketplace?.name || 'Lojas monitoradas'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-[#5B607C]">Menor preco</span>
                    <span className="text-base font-semibold text-[#5B4CF0]">
                      {bestPrice ? money(bestPrice) : 'Indisponivel'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function TaxonomyList({
  title,
  items,
  basePath,
}: {
  title: string;
  items: Taxonomy[];
  basePath: string;
}) {
  return (
    <section className="rounded-lg border border-[#E4E7F2] bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.slice(0, 18).map((item) => (
          <Link
            key={item.slug}
            href={`${basePath}/${item.slug}`}
            className="rounded-full border border-[#E4E7F2] px-3 py-1.5 text-sm font-medium text-[#5B607C] hover:border-[#5B4CF0] hover:text-[#5B4CF0]"
          >
            {item.name} <span className="text-[#8A8FB1]">{item.count}</span>
          </Link>
        ))}
        {items.length === 0 && <p className="text-sm text-[#8A8FB1]">Nenhum item encontrado.</p>}
      </div>
    </section>
  );
}
