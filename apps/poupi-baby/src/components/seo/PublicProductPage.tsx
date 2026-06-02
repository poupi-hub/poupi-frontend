import { getSiteUrl } from '@/lib/site-url';
import type { FC } from 'react';
import Link from 'next/link';
import { SeoInternalLinks, type SeoInternalLinkGraph } from './SeoInternalLinks';

const SITE_URL = getSiteUrl();

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type Offer = {
  id: string;
  price: number | string;
  currentPrice?: number | string | null;
  originalPrice?: number | string | null;
  pricePerUnit?: number | string | null;
  productUrl: string;
  availability: boolean;
  freightPrice?: number | string | null;
  marketplace: { name: string; slug?: string | null; logoUrl?: string | null };
};

type Product = {
  id: string;
  slug: string;
  title: string;
  canonicalName?: string | null;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  variantLabel?: string | null;
  measureValue?: number | null;
  measureUnit?: string | null;
  productFamilySlug?: string | null;
  ean?: string | null;
  updatedAt?: string | null;
  offers: Offer[];
};

function offerPrice(o: Offer) {
  return Number(o.currentPrice ?? o.price ?? 0);
}

type DealScoreBadge = { score: number; emoji: string; label: string; labelColor: string };

export const PublicProductPage: FC<{ product: Product; internalLinks?: SeoInternalLinkGraph | null; dealScore?: DealScoreBadge | null }> = ({ product, internalLinks, dealScore }) => {
  const name = product.canonicalName || product.title;
  const available = product.offers.filter((o) => o.availability).sort((a, b) => offerPrice(a) - offerPrice(b));
  const unavailable = product.offers.filter((o) => !o.availability);
  const allOffers = [...available, ...unavailable];
  const best = available[0] ?? null;
  const bestPrice = best ? offerPrice(best) : null;
  const prices = available.map(offerPrice);
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const spread = bestPrice !== null && maxPrice !== null ? maxPrice - bestPrice : 0;

  const categorySlug = product.category
    ? product.category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : null;
  const brandSlug = product.brand
    ? product.brand.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : null;

  const canonicalUrl = `${SITE_URL}/produto/${product.slug}`;
  const updatedLabel = product.updatedAt
    ? new Date(product.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image: product.imageUrl,
    sku: product.ean ?? undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    url: canonicalUrl,
    offers: available.map((o) => ({
      '@type': 'Offer',
      price: offerPrice(o).toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: o.marketplace.name },
      url: o.productUrl,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Radar do Berço', item: SITE_URL },
      ...(product.category && categorySlug
        ? [{ '@type': 'ListItem', position: 2, name: product.category, item: `${SITE_URL}/categoria/${categorySlug}` }]
        : []),
      { '@type': 'ListItem', position: product.category ? 3 : 2, name, item: canonicalUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="min-h-screen bg-[#F7F8FC] px-4 py-6 text-[#090A3D]">
        <div className="mx-auto max-w-5xl space-y-5">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-xs text-[#5B607C]">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-[#5B4CF0]">Radar do Berço</Link></li>
              {product.category && categorySlug && (
                <>
                  <li aria-hidden>/</li>
                  <li><Link href={`/categoria/${categorySlug}`} className="hover:text-[#5B4CF0]">{product.category}</Link></li>
                </>
              )}
              <li aria-hidden>/</li>
              <li className="font-medium text-[#090A3D]">{name}</li>
            </ol>
          </nav>

          {/* Header do produto */}
          <section className="rounded-lg border border-[#E4E7F2] bg-white p-5 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[160px_1fr_240px] lg:items-start">

              {/* Imagem */}
              <div className="flex justify-center rounded-lg bg-[#f8f3ff] p-4">
                {product.imageUrl
                  ? <img src={product.imageUrl} alt={name} width={144} height={144} className="h-36 w-36 object-contain" />
                  : <div className="flex h-36 w-36 items-center justify-center text-5xl text-[#5B4CF0]">📦</div>}
              </div>

              {/* Info */}
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  {product.brand && brandSlug && (
                    <Link href={`/marca/${brandSlug}`} className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[#5B4CF0] hover:bg-[#ebe0ff]">{product.brand}</Link>
                  )}
                  {product.category && categorySlug && (
                    <Link href={`/categoria/${categorySlug}`} className="rounded-full bg-[#e8f8ee] px-2.5 py-1 text-[#2f8a51] hover:bg-[#d5f0df]">{product.category}</Link>
                  )}
                  {product.ean && <span className="rounded-full bg-[#F2F4FF] px-2.5 py-1 text-[#5B607C]">EAN {product.ean}</span>}
                </div>

                <h1 className="mt-3 text-2xl font-semibold tracking-tight">{name}</h1>

                {product.variantLabel && (
                  <p className="mt-1 text-sm text-[#5B607C]">Variante: {product.variantLabel}</p>
                )}

                {updatedLabel && (
                  <p className="mt-2 text-xs text-[#8A8FB1]">Atualizado em {updatedLabel}</p>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <PriceStat label="Menor Preço" value={bestPrice ? money(bestPrice) : 'Indisponível'} highlight />
                  <PriceStat label="Maior Preço" value={maxPrice ? money(maxPrice) : 'Indisponível'} />
                  <PriceStat label="Lojas" value={`${allOffers.length}`} />
                  <PriceStat label="Economia possível" value={spread > 0 ? money(spread) : '-'} />
                </div>
              </div>

              {/* CTA */}
              <div className="rounded-lg bg-[#EEF2FF] p-4">
                <p className="text-sm font-medium text-[#5B607C]">Melhor Preço agora</p>
                <p className="mt-2 text-3xl font-bold text-[#5B4CF0]">{best ? money(offerPrice(best)) : '—'}</p>
                {best && <p className="mt-1 text-sm text-[#090A3D]">{best.marketplace.name}</p>}
                {best?.pricePerUnit && (
                  <p className="mt-1 text-xs text-[#5B607C]">{money(Number(best.pricePerUnit))} por unidade</p>
                )}
                {dealScore && (
                  <div title={`DealScore Radar do Berço: ${dealScore.label}`} style={{ background: dealScore.labelColor + '18', borderColor: dealScore.labelColor + '44', color: dealScore.labelColor }} className="mt-3 flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold">
                    <span>DealScore Radar do Berço</span>
                    <span>{dealScore.emoji} {dealScore.score} · {dealScore.label}</span>
                  </div>
                )}
                <Link
                  href="/login"
                  className="mt-4 block w-full rounded-lg bg-[#5B4CF0] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#493BD0]"
                >
                  Criar alerta
                </Link>
                <a
                  href="#lojas"
                  className="mt-2 block w-full rounded-lg border border-[#C9CEEA] px-4 py-2.5 text-center text-sm font-semibold text-[#5B4CF0] hover:bg-white"
                >
                  Ver lojas
                </a>
                <p className="mt-2 text-center text-xs text-[#8A8FB1]">Receba notificação quando baixar</p>
              </div>
            </div>
          </section>

          {/* Comparação de farmácias */}
          <section id="lojas" className="rounded-lg border border-[#E4E7F2] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Comparação de preços por Farmácia</h2>
            <p className="mt-1 mb-4 text-sm text-[#5B607C]">
              {available.length} loja{available.length !== 1 ? 's' : ''} com disponibilidade no momento. Preços coletados automaticamente pelo Radar do Berço.
            </p>
            <div className="space-y-3">
              {allOffers.length === 0 && (
                <p className="text-sm text-[#8A8FB1]">Nenhuma oferta dispoNível no momento.</p>
              )}
              {allOffers.map((offer, i) => (
                <div
                  key={offer.id}
                  className={`rounded-lg border p-4 ${i === 0 && offer.availability ? 'border-[#5B4CF0] bg-[#faf7ff]' : 'border-[#E4E7F2]'}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {i === 0 && offer.availability && (
                          <span className="rounded-full bg-[#e8f8ee] px-2 py-0.5 text-xs font-semibold text-[#2f8a51]">melhor Preço</span>
                        )}
                        <span className="font-semibold">{offer.marketplace.name}</span>
                        {!offer.availability && (
                          <span className="rounded-full bg-[#fff1f1] px-2 py-0.5 text-xs font-semibold text-[#b13a3a]">indispoNível</span>
                        )}
                      </div>
                      {offer.pricePerUnit && (
                        <p className="mt-1 text-xs text-[#5B607C]">{money(Number(offer.pricePerUnit))} por unidade</p>
                      )}
                      {offer.originalPrice && Number(offer.originalPrice) > offerPrice(offer) && (
                        <p className="mt-1 text-xs text-[#5B607C] line-through">de {money(Number(offer.originalPrice))}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#5B4CF0]">{money(offerPrice(offer))}</p>
                        {Number(offer.freightPrice ?? 0) > 0 && (
                          <p className="text-xs text-[#5B607C]">+ frete {money(Number(offer.freightPrice))}</p>
                        )}
                      </div>
                      {offer.availability && (
                        <Link
                          href={`/login?redirect=${encodeURIComponent(`/produto/${product.slug}`)}`}
                          className="rounded-lg bg-[#5B4CF0] px-3 py-2 text-sm font-semibold text-white hover:bg-[#493BD0]"
                          rel="nofollow"
                        >
                          Ver oferta
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA informativo — contexto dinâmico quando dealScore dispoNível */}
          <section className="rounded-lg border border-[#E4E7F2] bg-white p-6 text-center shadow-sm">
            {dealScore && dealScore.score >= 75 ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f8ee] px-4 py-1.5 text-sm font-semibold text-[#2f8a51]">
                  {dealScore.emoji} DealScore {dealScore.score}/100 — {dealScore.label}
                </div>
                <h2 className="mt-3 text-lg font-semibold">Este é um bom momento para comprar</h2>
                <p className="mt-2 text-sm text-[#5B607C]">
                  O Radar do Berço analisou o histórico de preços de <strong>{name}</strong> e identificou esta como uma oportunidade acima da média.
                  Crie uma conta gratuita para monitorar e receber alertas quando o Preço cair ainda mais.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold">Vale a pena comprar agora?</h2>
                <p className="mt-2 text-sm text-[#5B607C]">
                  O Radar do Berço analisa o histórico de preços de <strong>{name}</strong> e calcula automaticamente se é um bom momento para comprar.
                  Crie uma conta gratuita e receba alertas quando o Preço baixar.
                </p>
              </>
            )}
            <Link
              href="/login"
              className="mt-4 inline-block rounded-lg bg-[#5B4CF0] px-6 py-3 text-sm font-semibold text-white hover:bg-[#493BD0]"
            >
              🔔 Monitorar Preço Grátis
            </Link>
            <p className="mt-2 text-xs text-[#8A8FB1]">Grátis · Sem cartão · Cancele quando quiser</p>
          </section>

          <SeoInternalLinks graph={internalLinks} />
        </div>
      </main>
    </>
  );
};

function PriceStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-[#E4E7F2] bg-[#fffdf9] p-3">
      <p className="text-xs font-medium text-[#5B607C]">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${highlight ? 'text-[#5B4CF0]' : ''}`}>{value}</p>
    </div>
  );
}
