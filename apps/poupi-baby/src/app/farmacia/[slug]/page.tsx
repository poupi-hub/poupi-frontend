import { getSiteUrl } from '@/lib/site-url';
import { getBackendUrl } from '@/lib/backend-url';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const BACKEND  = getBackendUrl("3001");
const SITE_URL = getSiteUrl();

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function fetchMarketplace(slug: string) {
  try {
    const res = await fetch(`${BACKEND}/seo/marketplaces/${encodeURIComponent(slug)}?limit=24`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchMarketplace(slug);
  if (!data?.marketplace) return { title: 'Farmácia | Radar do Berço', robots: { index: false } };

  const storeName = data.marketplace.name;
  const url = `${SITE_URL}/farmacia/${slug}`;
  const title = `${storeName} — Melhores preços | Radar do Berço`;
  const description = `Compare preços na ${storeName}. ${data.total} ofertas monitoradas em tempo real pelo Radar do Berço com histórico e alertas automáticos.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'Radar do Berço', locale: 'pt_BR' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function FarmaciaPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchMarketplace(slug);
  if (!data?.marketplace) notFound();

  const { marketplace, products, total } = data as {
    marketplace: { id: string; name: string; slug: string };
    products: Array<{
      id: string; slug: string; canonicalName?: string | null; title: string;
      brand?: string | null; category?: string | null; imageUrl?: string | null;
      bestPrice: number; pricePerUnit?: number | null; productUrl: string;
    }>;
    total: number;
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: marketplace.name,
    url: `${SITE_URL}/farmacia/${slug}`,
    description: `preços na ${marketplace.name} monitorados pelo Radar do Berço.`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Radar do Berço', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: marketplace.name, item: `${SITE_URL}/farmacia/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="min-h-screen bg-[#F7F8FC] px-4 py-6 text-[#090A3D]">
        <div className="mx-auto max-w-5xl space-y-5">

          <nav className="text-xs text-[#5B607C]">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-[#5B4CF0]">Radar do Berço</Link></li>
              <li aria-hidden>/</li>
              <li className="font-medium text-[#090A3D]">{marketplace.name}</li>
            </ol>
          </nav>

          <header>
            <h1 className="text-2xl font-semibold tracking-tight">{marketplace.name} — Melhores preços</h1>
            <p className="mt-1 text-sm text-[#5B607C]">
              {total} oferta{total !== 1 ? 's' : ''} monitorada{total !== 1 ? 's' : ''} na {marketplace.name}.
              preços atualizados automaticamente pelo Radar do Berço.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const name = p.canonicalName || p.title;
              return (
                <a
                  key={p.id}
                  href={`/produto/${p.slug}`}
                  className="rounded-lg border border-[#E4E7F2] bg-white p-4 shadow-sm transition hover:border-[#cdb8ef]"
                >
                  <div className="flex items-start gap-3">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={name} width={56} height={56} className="h-14 w-14 rounded-lg object-contain" />
                      : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-2xl">📦</div>}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1">
                        {p.brand && <span className="text-xs font-semibold text-[#5B4CF0]">{p.brand}</span>}
                        {p.category && <span className="text-xs text-[#5B607C]">{p.category}</span>}
                      </div>
                      <h2 className="mt-0.5 line-clamp-2 text-sm font-semibold">{name}</h2>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold text-[#5B4CF0]">{money(p.bestPrice)}</p>
                      {p.pricePerUnit && (
                        <p className="text-xs text-[#5B607C]">{money(p.pricePerUnit)}/un</p>
                      )}
                    </div>
                    <span className="text-xs text-[#8A8FB1]">{marketplace.name}</span>
                  </div>
                </a>
              );
            })}
          </div>

          <section className="rounded-lg border border-[#E4E7F2] bg-white p-5 text-center shadow-sm">
            <h2 className="text-base font-semibold">Monitore preços na {marketplace.name} automaticamente</h2>
            <p className="mt-1 text-sm text-[#5B607C]">Receba alertas quando o produto que Você quer entrar em promoção.</p>
            <a href="/login" className="mt-3 inline-block rounded-lg bg-[#5B4CF0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#493BD0]">
              Criar conta Grátis
            </a>
          </section>
        </div>
      </main>
    </>
  );
}
