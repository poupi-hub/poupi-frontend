import { getSiteUrl } from '@/lib/site-url';
import type { FC } from 'react';
import Link from 'next/link';
import { SeoInternalLinks, type SeoInternalLinkGraph } from './SeoInternalLinks';
import { PackageComparator } from '@/components/PackageComparator';
import { PriceChart } from '@/components/PriceChart';
import { resolveUnit, formatPricePerUnit } from '@/lib/unit-label';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

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
type PriceHistoryPoint = { date: string; price: number };

function dealScoreLabel(score: number) {
  if (score >= 90) return 'Oferta Forte';
  if (score >= 80) return 'Comprar Agora';
  if (score >= 70) return 'Boa Oferta';
  if (score >= 50) return 'Vale Monitorar';
  return 'Melhor Esperar';
}

function dealScorePhrase(score: number): string {
  if (score >= 90) return 'Essa é uma das melhores ofertas que já vimos para este produto.';
  if (score >= 80) return 'Eu aproveitaria essa oferta.';
  if (score >= 70) return 'Esse preço está melhor do que costumamos encontrar.';
  if (score >= 50) return 'Se não tiver urgência, vale acompanhar mais alguns dias.';
  return 'Já vimos preços melhores. Eu esperaria um pouco.';
}

function dealScoreEmoji(score: number): string {
  if (score >= 90) return '🔥';
  if (score >= 80) return '🟢';
  if (score >= 70) return '🟢';
  if (score >= 50) return '🟡';
  return '⏳';
}

function buyAdvice(score?: number | null) {
  if (score == null) {
    return {
      title: 'Ainda coletando dados para este produto',
      body: 'Estamos reunindo histórico de preço para dar uma recomendação mais precisa. Crie um alerta e te avisamos quando o preço cair.',
      tone: 'neutral',
    };
  }
  if (score >= 85) {
    return {
      title: 'O preço está ótimo agora',
      body: 'Se você precisa comprar agora, o preço atual está entre os melhores que registramos para este produto. Vale aproveitar.',
      tone: 'good',
    };
  }
  if (score >= 70) {
    return {
      title: 'Preço dentro da faixa esperada',
      body: 'Se você precisa comprar agora, o preço atual está dentro da faixa esperada. Se puder esperar alguns dias, acredito que ainda existe espaço para encontrar uma oferta melhor.',
      tone: 'good',
    };
  }
  if (score >= 50) {
    return {
      title: 'Pode valer esperar uma queda',
      body: 'O preço está um pouco acima do que costumamos ver. Se puder aguardar alguns dias, acredito que ainda existe espaço para encontrar uma oferta melhor.',
      tone: 'warn',
    };
  }
  return {
    title: 'Momento desfavorável para compra',
    body: 'O preço atual está acima do histórico recente. Se puder aguardar, vale criar um alerta e esperar uma oportunidade melhor chegar.',
    tone: 'bad',
  };
}

function historySummary(points: PriceHistoryPoint[], currentPrice: number | null) {
  if (!points.length) return null;
  const prices = points.map((point) => point.price).filter((price) => Number.isFinite(price) && price > 0);
  if (!prices.length) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const today = currentPrice ?? prices[prices.length - 1];
  const delta = avg > 0 ? Math.round(((avg - today) / avg) * 100) : 0;
  const nearMin = today <= min * 1.05;
  return {
    min,
    max,
    avg,
    today,
    delta,
    nearMin,
  };
}

export const PublicProductPage: FC<{
  product: Product;
  internalLinks?: SeoInternalLinkGraph | null;
  dealScore?: DealScoreBadge | null;
  variants?: unknown[];
  priceHistory?: PriceHistoryPoint[];
}> = ({ product, internalLinks, dealScore, variants, priceHistory = [] }) => {
  const name = product.canonicalName || product.title;
  const unit = resolveUnit({ category: product.category, title: product.title, variantLabel: product.variantLabel });
  const available = product.offers.filter((o) => o.availability).sort((a, b) => offerPrice(a) - offerPrice(b));
  const allOffers = available;
  const best = available[0] ?? null;
  const bestPrice = best ? offerPrice(best) : null;
  const prices = available.map(offerPrice);
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const spread = bestPrice !== null && maxPrice !== null ? maxPrice - bestPrice : 0;
  const advice = buyAdvice(dealScore?.score);
  const recentHistory = priceHistory.slice(-30);
  const recentSummary = historySummary(recentHistory, bestPrice);

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
      { '@type': 'ListItem', position: 1, name: 'Nuvii Baby', item: SITE_URL },
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

      <SiteHeader />
      <main className="min-h-screen bg-[#F7F8FC] px-4 py-6 text-[#090A3D]">
        <div className="mx-auto max-w-5xl space-y-5">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-xs text-[#5B607C]">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-[#5B4CF0]">Nuvii Baby</Link></li>
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
            <div className="grid gap-6 lg:grid-cols-[168px_1fr_280px] lg:items-start">

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
                </div>

                <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight">{name}</h1>

                {product.variantLabel && (
                  <p className="mt-1 text-sm font-medium text-[#5B607C]">{product.variantLabel}</p>
                )}

                <div className={`mt-4 rounded-lg border p-4 ${
                  advice.tone === 'good'
                    ? 'border-[#b9e4c7] bg-[#f3fbf6]'
                    : advice.tone === 'bad'
                      ? 'border-[#f0c7c7] bg-[#fff7f7]'
                      : advice.tone === 'warn'
                        ? 'border-[#f3dc9b] bg-[#fffaf0]'
                        : 'border-[#E4E7F2] bg-[#FAFBFF]'
                }`}>
                  <p className="text-sm font-semibold text-[#090A3D]">{advice.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5B607C]">{advice.body}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <PriceStat label="Lojas com oferta" value={`${available.length}`} />
                  <PriceStat label="Diferença entre lojas" value={spread > 0 ? money(spread) : '-'} />
                  <PriceStat label="Atualização" value={updatedLabel ?? 'Recente'} />
                </div>
              </div>

              {/* CTA */}
              <div className="rounded-lg border border-[#DDE2FF] bg-[#F4F6FF] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5B607C]">Melhor oferta agora</p>
                <p className="mt-2 text-3xl font-black text-[#5B4CF0]">{best ? money(offerPrice(best)) : '-'}</p>
                {best?.pricePerUnit && (
                  <p className="mt-1 text-sm font-semibold text-[#090A3D]">{formatPricePerUnit(Number(best.pricePerUnit), unit)}</p>
                )}
                {best && <p className="mt-1 text-sm text-[#090A3D]">{best.marketplace.name}</p>}
                {dealScore && (
                  <div
                    style={{ background: dealScore.labelColor + '12', borderColor: dealScore.labelColor + '44', color: dealScore.labelColor }}
                    className="mt-3 rounded-lg border px-3 py-2.5"
                  >
                    <p className="text-sm font-bold">
                      {dealScoreEmoji(dealScore.score)} {dealScoreLabel(dealScore.score)} · {dealScore.score}/100
                    </p>
                    <p className="mt-0.5 text-xs font-medium opacity-90">{dealScorePhrase(dealScore.score)}</p>
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
                <p className="mt-2 text-center text-xs text-[#8A8FB1]">Receba aviso quando ficar mais barato</p>
              </div>
            </div>
          </section>

          {/* Comparação de farmácias */}
          <section id="lojas" className="rounded-lg border border-[#E4E7F2] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Compare as lojas antes de sair para comprar</h2>
            <p className="mt-1 mb-4 text-sm text-[#5B607C]">
              {available.length} loja{available.length !== 1 ? 's' : ''} com disponibilidade no momento. O menor preço fica destacado — confira frete e custo por {unit} antes de decidir.
            </p>
            <div className="space-y-3">
              {allOffers.length === 0 && (
                <p className="text-sm text-[#8A8FB1]">Nenhuma oferta disponível no momento.</p>
              )}
              {allOffers.map((offer, i) => (
                <div
                  key={offer.id}
                  className={`rounded-lg border p-4 ${i === 0 && offer.availability ? 'border-[#5B4CF0] bg-[#FAF7FF]' : 'border-[#E4E7F2] bg-white'} ${!offer.availability ? 'opacity-75' : ''}`}
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_150px_120px] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {i === 0 && offer.availability && (
                          <span className="rounded-full bg-[#e8f8ee] px-2 py-0.5 text-xs font-semibold text-[#2f8a51]">🏆 Melhor preço hoje</span>
                        )}
                        <span className="font-semibold">{offer.marketplace.name}</span>
                        {!offer.availability && (
                          <span className="rounded-full bg-[#fff1f1] px-2 py-0.5 text-xs font-semibold text-[#b13a3a]">indisponível</span>
                        )}
                      </div>
                      {offer.pricePerUnit && (
                        <p className="mt-1 text-xs text-[#5B607C]">{formatPricePerUnit(Number(offer.pricePerUnit), unit)}</p>
                      )}
                    </div>
                    <div className="sm:text-right">
                      {offer.originalPrice && Number(offer.originalPrice) > offerPrice(offer) && (
                        <p className="text-xs text-[#8A8FB1] line-through">de {money(Number(offer.originalPrice))}</p>
                      )}
                      <p className="text-xl font-bold text-[#5B4CF0]">{money(offerPrice(offer))}</p>
                      {Number(offer.freightPrice ?? 0) > 0 && (
                        <p className="text-xs text-[#5B607C]">+ frete {money(Number(offer.freightPrice))}</p>
                      )}
                    </div>
                    <div className="sm:text-right">
                      {offer.availability && offer.productUrl && (
                        <a
                          href={offer.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-[#5B4CF0] px-3 py-2 text-sm font-semibold text-white hover:bg-[#493BD0]"
                        >
                          Ver oferta
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Historico publico */}
          <section className="rounded-lg border border-[#E4E7F2] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Histórico de preço — últimos 30 dias</h2>
            <p className="mt-1 text-sm text-[#5B607C]">
              Menor preço encontrado entre as lojas monitoradas a cada dia.
            </p>
            {recentSummary && (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-[#E4E7F2] bg-[#FAFBFF] p-3">
                  <p className="text-xs font-medium text-[#5B607C]">Variação no período</p>
                  <p className="mt-1 text-sm font-semibold text-[#090A3D]">
                    Entre {money(recentSummary.min)} e {money(recentSummary.max)}
                  </p>
                </div>
                <div className={`rounded-lg border p-3 ${recentSummary.nearMin ? 'border-[#b9e4c7] bg-[#f3fbf6]' : 'border-[#E4E7F2] bg-[#FAFBFF]'}`}>
                  <p className="text-xs font-medium text-[#5B607C]">Menor preço do período</p>
                  <p className="mt-1 text-sm font-semibold text-[#2f8a51]">{money(recentSummary.min)}</p>
                  {recentSummary.nearMin && <p className="text-xs text-[#2f8a51]">✓ Preço atual próximo do mínimo</p>}
                </div>
                <div className={`rounded-lg border p-3 ${recentSummary.delta >= 0 ? 'border-[#b9e4c7] bg-[#f3fbf6]' : 'border-[#f3dc9b] bg-[#fffaf0]'}`}>
                  <p className="text-xs font-medium text-[#5B607C]">Preço atual vs. média</p>
                  <p className={`mt-1 text-sm font-semibold ${recentSummary.delta >= 0 ? 'text-[#2f8a51]' : 'text-[#b87d00]'}`}>
                    {Math.abs(recentSummary.delta)}% {recentSummary.delta >= 0 ? 'abaixo' : 'acima'} da média
                  </p>
                </div>
              </div>
            )}
            <div className="mt-4">
              {recentHistory.length > 0 ? (
                <PriceChart data={recentHistory} />
              ) : (
                <div className="rounded-lg bg-[#F2F4FF] p-6 text-center text-sm text-[#5B607C]">
                  O histórico será formado nas próximas coletas deste produto.
                </div>
              )}
            </div>
          </section>

          {/* Comparador de pacotes */}
          {variants && variants.length > 0 && (
            <PackageComparator
              currentId={product.id}
              variants={variants as Parameters<typeof PackageComparator>[0]['variants']}
              category={product.category}
              title={product.title}
            />
          )}

          {/* CTA — decisão de compra */}
          <section className="rounded-lg border border-[#E4E7F2] bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#090A3D]">Vale a pena comprar agora?</h2>
            <div className={`mt-3 rounded-lg border p-4 ${
              advice.tone === 'good' ? 'border-[#b9e4c7] bg-[#f3fbf6]'
              : advice.tone === 'bad' ? 'border-[#f0c7c7] bg-[#fff7f7]'
              : advice.tone === 'warn' ? 'border-[#f3dc9b] bg-[#fffaf0]'
              : 'border-[#E4E7F2] bg-[#FAFBFF]'
            }`}>
              <p className="text-sm font-semibold text-[#090A3D]">{advice.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#5B607C]">{advice.body}</p>
            </div>
            {dealScore && (
              <p className="mt-3 text-sm font-medium" style={{ color: dealScore.labelColor }}>
                {dealScoreEmoji(dealScore.score)} {dealScorePhrase(dealScore.score)}
              </p>
            )}
            <Link
              href="/login"
              className="mt-4 block w-full rounded-lg bg-[#5B4CF0] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#493BD0]"
            >
              🔔 Criar alerta grátis para {name.split(' ').slice(0, 3).join(' ')}
            </Link>
            <p className="mt-2 text-center text-xs text-[#8A8FB1]">Grátis · Sem cartão · Cancele quando quiser</p>
          </section>

          <SeoInternalLinks graph={internalLinks} />
        </div>
      </main>
      <SiteFooter />
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
