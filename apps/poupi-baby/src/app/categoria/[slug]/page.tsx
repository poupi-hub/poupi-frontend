import { getSiteUrl } from '@/lib/site-url';
import { getBackendUrl } from '@/lib/backend-url';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryGrid } from '@/components/CategoryGrid';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

const BACKEND  = getBackendUrl("3001");
const SITE_URL = getSiteUrl();

async function fetchCategory(slug: string) {
  try {
    const res = await fetch(`${BACKEND}/seo/categories/${encodeURIComponent(slug)}?limit=24`, {
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
  const data = await fetchCategory(slug);
  if (!data?.category) return { title: 'Categoria | Nuvii Baby', robots: { index: false } };

  const title = `${data.category} — Melhores preços | Nuvii Baby`;
  const description = `Compare preços de ${data.category} nas principais farmácias e drogarias. ${data.total} produtos monitorados com histórico de Preço e alertas automáticos.`;
  const url = `${SITE_URL}/categoria/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'Nuvii Baby', locale: 'pt_BR' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchCategory(slug);
  if (!data?.category) notFound();

  const { category, products, total, page, pages } = data as {
    category: string;
    slug: string;
    products: Array<{
      id: string; slug: string; canonicalName?: string | null; title: string;
      brand?: string | null; imageUrl?: string | null; variantLabel?: string | null;
      offers: Array<{ price: number; currentPrice?: number | null; pricePerUnit?: number | null; productUrl?: string | null; offerUrl?: string | null; marketplaceName?: string | null; marketplace: { name: string } }>;
    }>;
    total: number; page: number; pages: number;
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category} — Melhores preços`,
    url: `${SITE_URL}/categoria/${slug}`,
    description: `Compare preços de ${category} nas principais farmácias. ${total} produtos.`,
    numberOfItems: total,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Nuvii Baby', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: category, item: `${SITE_URL}/categoria/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <SiteHeader />
      <main className="min-h-screen bg-[#F7F8FC] px-4 py-6 text-[#090A3D]">
        <div className="mx-auto max-w-5xl space-y-5">

          <nav className="text-xs text-[#5B607C]">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-[#5B4CF0]">Nuvii Baby</Link></li>
              <li aria-hidden>/</li>
              <li className="font-medium text-[#090A3D]">{category}</li>
            </ol>
          </nav>

          <header>
            <h1 className="text-2xl font-semibold tracking-tight">{category} — Radar de preços</h1>
            <p className="mt-1 text-sm text-[#5B607C]">
              {total} produto{total !== 1 ? 's' : ''} monitorado{total !== 1 ? 's' : ''} agora. Cada card mostra se vale comprar hoje ou esperar.
            </p>
          </header>

          <CategoryGrid products={products} category={category} />

          <section className="rounded-lg border border-[#E4E7F2] bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-bold text-[#5B4CF0]">🔔 Nunca pague caro de novo</p>
            <h2 className="mt-1 text-base font-semibold">Eu aviso quando {category} entrar em oferta.</h2>
            <p className="mt-1 text-sm text-[#5B607C]">Defina sua meta de preço em 30 segundos. Eu monitoro e te aviso na hora certa.</p>
            <a href="/login" className="mt-3 inline-block rounded-lg bg-[#5B4CF0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#493BD0]">
              Criar alerta grátis →
            </a>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
