import { ProductSearch } from '@/components/ProductSearch';
import { getBackendUrl } from '@/lib/backend-url';
import { getSiteUrl } from '@/lib/site-url';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { resolveUnit, formatPricePerUnit } from '@/lib/unit-label';

const BACKEND = getBackendUrl('3001');
const SITE_URL = getSiteUrl();

function getLocalBackendUrl() {
  if (process.env.NODE_ENV === 'production') return null;
  const host = 'localhost';
  return `http://${host}:3001`;
}

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
    pricePerUnit?: number | string | null;
    productUrl?: string | null;
    offerUrl?: string | null;
    marketplaceName?: string | null;
    marketplace?: { name?: string | null } | null;
  }>;
};

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  const localBackend = getLocalBackendUrl();
  try {
    let res = await fetch(`${BACKEND}${path}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4_000),
    });
    if ((res.status === 401 || res.status === 404) && localBackend && BACKEND !== localBackend) {
      res = await fetch(`${localBackend}${path}`, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(4_000),
      });
    }
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    if (localBackend && BACKEND !== localBackend) {
      try {
        const res = await fetch(`${localBackend}${path}`, {
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
  title: 'Produtos | Nuvii Baby',
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
    <>
    <SiteHeader />
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-6 text-[#090A3D]">
      <div className="mx-auto max-w-6xl space-y-5">
        <nav className="text-xs text-[#5B607C]">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-[#5B4CF0]">
                Nuvii Baby
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-[#090A3D]">Produtos</li>
          </ol>
        </nav>

        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Encontre um produto e crie um alerta</h1>
          <p className="mt-1 text-sm text-[#5B607C]">
            Pesquise por nome, marca ou categoria.
          </p>
        </header>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-2">
          <Link href="/categoria/fraldas" className="rounded-full border border-[#E4E7F2] bg-white px-4 py-1.5 text-sm font-medium text-[#5B607C] hover:border-[#5B4CF0] hover:text-[#5B4CF0]">🍼 Fraldas</Link>
          <Link href="/marca" className="rounded-full border border-[#E4E7F2] bg-white px-4 py-1.5 text-sm font-medium text-[#5B607C] hover:border-[#5B4CF0] hover:text-[#5B4CF0]">⭐ Marca</Link>
          <Link href="/categoria/fraldas" className="rounded-full border border-[#E4E7F2] bg-white px-4 py-1.5 text-sm font-medium text-[#5B607C] hover:border-[#5B4CF0] hover:text-[#5B4CF0]">📏 Tamanho</Link>
          <Link href="/melhor-preco" className="rounded-full border border-[#E4E7F2] bg-white px-4 py-1.5 text-sm font-medium text-[#5B607C] hover:border-[#5B4CF0] hover:text-[#5B4CF0]">🔥 Oferta</Link>
        </div>

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
            <Link href="/dashboard" className="text-sm font-semibold text-[#5B4CF0]">
              Não encontrou? Cole o link direto do produto →
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.products.map((product) => {
              const bestOffer = product.offers?.[0] ?? null;
              const bestPrice = bestOffer ? Number(bestOffer.currentPrice ?? bestOffer.price) : null;
              const pricePerUnit = bestOffer?.pricePerUnit ? Number(bestOffer.pricePerUnit) : null;
              const unit = resolveUnit({ category: product.category, title: product.title });
              const name = product.canonicalName || product.title;
              return (
                <article
                  key={product.id}
                  className="rounded-lg border border-[#E4E7F2] bg-[#FCFDFF] p-3 transition hover:border-[#5B4CF0] hover:bg-white"
                >
                  <Link href={`/produto/${product.slug}`} className="block">
                    <div className="flex gap-3">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={name} className="h-14 w-14 rounded-lg object-contain" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#5B4CF0]">
                          <i className="ti ti-package text-2xl" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[#5B4CF0]">
                          {product.brand || product.category || ''}
                        </p>
                        <h3 className="mt-1 line-clamp-2 text-sm font-semibold">{name}</h3>
                        {product.category && (
                          <p className="mt-1 truncate text-xs text-[#5B607C]">{product.category}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <span className="text-xs text-[#5B607C]">{pricePerUnit ? 'Custo por unidade' : 'Menor preço'}</span>
                    <span className="text-right text-base font-semibold text-[#5B4CF0]">
                      {pricePerUnit ? (
                        <>
                          {formatPricePerUnit(pricePerUnit, unit)}
                          {bestPrice && <span className="block text-xs font-normal text-[#5B607C]">{money(bestPrice)} total</span>}
                        </>
                      ) : (
                        bestPrice ? money(bestPrice) : 'Indisponivel'
                      )}
                    </span>
                  </div>
                  <Link
                    href={`/produto/${product.slug}`}
                    className="mt-3 flex w-full items-center justify-center rounded-lg bg-[#5B4CF0] px-3 py-2 text-sm font-semibold text-white hover:bg-[#493BD0]"
                  >
                    Ver produto
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
    <SiteFooter />
    </>
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
