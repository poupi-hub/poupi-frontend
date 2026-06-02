import { getSiteUrl } from '@/lib/site-url';
import { getBackendUrl } from '@/lib/backend-url';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const BACKEND  = getBackendUrl("3001");
const SITE_URL = getSiteUrl();

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function fetchBestPrice(slug: string) {
  try {
    const res = await fetch(`${BACKEND}/seo/products/${encodeURIComponent(slug)}/best-price`, {
      next: { revalidate: 1800 },
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
  const data = await fetchBestPrice(slug);
  if (!data?.product) return { title: 'Melhor Preço | Radar do Berço', robots: { index: false } };

  const name = data.product.canonicalName || data.product.title;
  const price = data.bestOffer ? Number(data.bestOffer.currentPrice ?? data.bestOffer.price) : null;
  const url = `${SITE_URL}/melhor-preco/${slug}`;
  const title = `Melhor Preço de ${name} | Radar do Berço`;
  const description = price
    ? `Melhor Preço de ${name} hoje: ${money(price)}. Compare todas as farmácias e drogarias. histórico atualizado pelo Radar do Berço.`
    : `Compare preços de ${name} nas farmácias. histórico atualizado pelo Radar do Berço.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Radar do Berço',
      locale: 'pt_BR',
      images: data.product.imageUrl ? [{ url: data.product.imageUrl, alt: name }] : [],
    },
    twitter: { card: 'summary', title, description },
  };
}

export default async function MelhorPrecoPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchBestPrice(slug);
  if (!data?.product) notFound();

  const { product, bestOffer, allOffers } = data as {
    product: {
      id: string; slug: string; canonicalName?: string | null; title: string;
      brand?: string | null; category?: string | null; imageUrl?: string | null;
      productFamilySlug?: string | null;
    };
    bestOffer: { price: number; currentPrice?: number | null; pricePerUnit?: number | null; productUrl: string; marketplace: { name: string } } | null;
    allOffers: Array<{ id: string; price: number; currentPrice?: number | null; pricePerUnit?: number | null; productUrl: string; marketplace: { name: string } }>;
  };

  const name = product.canonicalName || product.title;
  const bestPrice = bestOffer ? Number(bestOffer.currentPrice ?? bestOffer.price) : null;
  const canonicalUrl = `${SITE_URL}/melhor-preco/${slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image: product.imageUrl,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    url: canonicalUrl,
    offers: bestOffer
      ? {
          '@type': 'Offer',
          price: bestPrice?.toFixed(2),
          priceCurrency: 'BRL',
          availability: 'https://schema.org/InStock',
          seller: { '@type': 'Organization', name: bestOffer.marketplace.name },
          url: bestOffer.productUrl,
        }
      : undefined,
  };

  const categorySlug = product.category
    ? product.category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen bg-[#F7F8FC] px-4 py-6 text-[#090A3D]">
        <div className="mx-auto max-w-4xl space-y-5">

          <nav className="text-xs text-[#5B607C]">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-[#5B4CF0]">Radar do Berço</Link></li>
              {product.category && categorySlug && (
                <>
                  <li aria-hidden>/</li>
                  <li><a href={`/categoria/${categorySlug}`} className="hover:text-[#5B4CF0]">{product.category}</a></li>
                </>
              )}
              <li aria-hidden>/</li>
              <li><a href={`/produto/${slug}`} className="hover:text-[#5B4CF0]">{name}</a></li>
              <li aria-hidden>/</li>
              <li className="font-medium text-[#090A3D]">Melhor Preço</li>
            </ol>
          </nav>

          <header className="rounded-lg border border-[#E4E7F2] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {product.imageUrl && (
                <img src={product.imageUrl} alt={name} width={80} height={80} className="h-20 w-20 shrink-0 rounded-lg object-contain" />
              )}
              <div className="min-w-0">
                {product.brand && <p className="text-xs font-semibold text-[#5B4CF0]">{product.brand}</p>}
                <h1 className="text-xl font-semibold tracking-tight">Melhor Preço de {name}</h1>
                <p className="mt-1 text-sm text-[#5B607C]">
                  Comparação em {allOffers.length} loja{allOffers.length !== 1 ? 's' : ''}, atualizado pelo Radar do Berço.
                </p>
              </div>
            </div>

            {bestPrice && bestOffer && (
              <div className="mt-4 rounded-lg bg-[#EEF2FF] p-4">
                <p className="text-sm font-medium text-[#5B607C]">Menor Preço encontrado</p>
                <p className="mt-1 text-3xl font-bold text-[#5B4CF0]">{money(bestPrice)}</p>
                <p className="mt-1 text-sm text-[#090A3D]">{bestOffer.marketplace.name}</p>
                {bestOffer.pricePerUnit && <p className="text-xs text-[#5B607C]">{money(Number(bestOffer.pricePerUnit))}/unidade</p>}
                <div className="mt-3 flex gap-2">
                  <a
                    href={`/login?redirect=${encodeURIComponent(`/produto/${slug}`)}`}
                    className="flex-1 rounded-lg bg-[#5B4CF0] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#493BD0]"
                  >
                    Criar alerta de Preço
                  </a>
                  <a
                    href={`/produto/${slug}`}
                    className="rounded-lg border border-[#5B4CF0] px-4 py-2 text-sm font-semibold text-[#5B4CF0] hover:bg-[#EEF2FF]"
                  >
                    Ver detalhes
                  </a>
                </div>
              </div>
            )}
          </header>

          <section className="rounded-lg border border-[#E4E7F2] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">preços por Farmácia</h2>
            <div className="space-y-2">
              {allOffers.map((o, i) => (
                <div key={o.id} className={`flex items-center justify-between rounded-lg border p-3 ${i === 0 ? 'border-[#5B4CF0] bg-[#faf7ff]' : 'border-[#E4E7F2]'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="rounded-full bg-[#e8f8ee] px-2 py-0.5 text-xs font-semibold text-[#2f8a51]">melhor</span>}
                      <span className="font-medium">{o.marketplace.name}</span>
                    </div>
                    {o.pricePerUnit && <p className="text-xs text-[#5B607C]">{money(Number(o.pricePerUnit))}/un</p>}
                  </div>
                  <p className="text-lg font-bold text-[#5B4CF0]">{money(Number(o.currentPrice ?? o.price))}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#E4E7F2] bg-white p-5 text-center shadow-sm">
            <h2 className="text-base font-semibold">Quer ser avisado quando o Preço baixar ainda mais?</h2>
            <p className="mt-1 text-sm text-[#5B607C]">Crie um alerta gratuito e receba notificação no Telegram ou email.</p>
            <a href="/login" className="mt-3 inline-block rounded-lg bg-[#5B4CF0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#493BD0]">
              Criar alerta Grátis
            </a>
          </section>
        </div>
      </main>
    </>
  );
}
