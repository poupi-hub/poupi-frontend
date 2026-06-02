import { getSiteUrl } from '@/lib/site-url';
import { getBackendUrl } from '@/lib/backend-url';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

const BACKEND  = getBackendUrl("3001");
const SITE_URL = getSiteUrl();

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${BACKEND}/seo/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Parse slug format: produto-a-vs-produto-b */
function parseComparação(comparação: string): [string, string] | null {
  const idx = comparação.indexOf('-vs-');
  if (idx === -1) return null;
  return [comparação.slice(0, idx), comparação.slice(idx + 4)];
}

function canonicalComparison(slugs: [string, string]) {
  return [...slugs].sort().join('-vs-');
}

type Props = { params: Promise<{ comparação: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { comparação } = await params;
  const slugs = parseComparação(comparação);
  if (!slugs) return { title: 'Comparador | Radar do Berço', robots: { index: false } };
  const canonicalSlug = canonicalComparison(slugs);
  if (slugs[0] === slugs[1]) return { title: 'Comparador | Radar do Berço', robots: { index: false } };

  const [a, b] = await Promise.all([fetchProduct(slugs[0]), fetchProduct(slugs[1])]);
  if (!a || !b) return { title: 'Comparador | Radar do Berço', robots: { index: false } };

  const nameA = a.canonicalName || a.title;
  const nameB = b.canonicalName || b.title;
  const url = `${SITE_URL}/comparar/${canonicalSlug}`;
  const title = `${nameA} vs ${nameB} — Qual é Melhor? | Radar do Berço`;
  const description = `Compare ${nameA} e ${nameB}: Preço atual, histórico, custo por unidade e qual tem o melhor custo-benefício agora.`;

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
      images: a.imageUrl || b.imageUrl ? [{ url: a.imageUrl || b.imageUrl, alt: `${nameA} vs ${nameB}` }] : [],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CompararPage({ params }: Props) {
  const { comparação } = await params;
  const slugs = parseComparação(comparação);
  if (!slugs) notFound();
  const canonicalSlug = canonicalComparison(slugs);
  if (slugs[0] === slugs[1]) notFound();
  if (comparação !== canonicalSlug) redirect(`/comparar/${canonicalSlug}`);

  const [prodA, prodB] = await Promise.all([fetchProduct(slugs[0]), fetchProduct(slugs[1])]);
  if (!prodA || !prodB) notFound();

  const nameA = prodA.canonicalName || prodA.title;
  const nameB = prodB.canonicalName || prodB.title;

  function bestOffer(p: any) {
    return (p.offers ?? []).filter((o: any) => o.availability).sort((a: any, b: any) =>
      Number(a.currentPrice ?? a.price) - Number(b.currentPrice ?? b.price)
    )[0] ?? null;
  }

  const offerA = bestOffer(prodA);
  const offerB = bestOffer(prodB);
  const priceA = offerA ? Number(offerA.currentPrice ?? offerA.price) : null;
  const priceB = offerB ? Number(offerB.currentPrice ?? offerB.price) : null;
  const ppuA = offerA?.pricePerUnit ? Number(offerA.pricePerUnit) : null;
  const ppuB = offerB?.pricePerUnit ? Number(offerB.pricePerUnit) : null;

  const winnerByPrice = priceA !== null && priceB !== null
    ? (priceA < priceB ? 'A' : priceA > priceB ? 'B' : 'tie')
    : null;
  const winnerByPpu = ppuA !== null && ppuB !== null
    ? (ppuA < ppuB ? 'A' : ppuA > ppuB ? 'B' : 'tie')
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${nameA} vs ${nameB}`,
    url: `${SITE_URL}/comparar/${comparação}`,
    description: `Comparação de preços entre ${nameA} e ${nameB}.`,
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Qual é mais barato, ${nameA} ou ${nameB}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: winnerByPrice === 'A'
            ? `${nameA} está mais barato: ${priceA ? money(priceA) : '–'} vs ${priceB ? money(priceB) : '–'}.`
            : winnerByPrice === 'B'
            ? `${nameB} está mais barato: ${priceB ? money(priceB) : '–'} vs ${priceA ? money(priceA) : '–'}.`
            : `${nameA} e ${nameB} estão com preços iguais no momento.`,
        },
      },
      ...(winnerByPpu ? [{
        '@type': 'Question',
        name: `Qual tem melhor custo-benefício por unidade?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: winnerByPpu === 'A'
            ? `${nameA} tem menor custo por unidade: ${ppuA ? money(ppuA) : '–'}/un vs ${ppuB ? money(ppuB) : '–'}/un.`
            : winnerByPpu === 'B'
            ? `${nameB} tem menor custo por unidade: ${ppuB ? money(ppuB) : '–'}/un vs ${ppuA ? money(ppuA) : '–'}/un.`
            : 'Ambos têm o mesmo custo por unidade.',
        },
      }] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <main className="min-h-screen bg-[#F7F8FC] px-4 py-6 text-[#090A3D]">
        <div className="mx-auto max-w-4xl space-y-5">

          <nav className="text-xs text-[#5B607C]">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-[#5B4CF0]">Radar do Berço</Link></li>
              <li aria-hidden>/</li>
              <li className="font-medium text-[#090A3D]">Comparar</li>
            </ol>
          </nav>

          <h1 className="text-2xl font-semibold tracking-tight">{nameA} <span className="text-[#5B4CF0]">vs</span> {nameB}</h1>
          <p className="text-sm text-[#5B607C]">Comparação de Preço, custo por unidade e disponibilidade nas farmácias.</p>

          {/* Cards de Comparação */}
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              { product: prodA, offer: offerA, price: priceA, ppu: ppuA, slug: slugs[0], winner: winnerByPpu === 'A' || winnerByPrice === 'A', label: nameA },
              { product: prodB, offer: offerB, price: priceB, ppu: ppuB, slug: slugs[1], winner: winnerByPpu === 'B' || winnerByPrice === 'B', label: nameB },
            ] as const).map(({ product: p, offer: o, price, ppu, slug, winner, label }) => (
              <a
                key={p.id}
                href={`/produto/${slug}`}
                className={`rounded-lg border bg-white p-5 shadow-sm transition hover:border-[#cdb8ef] ${winner ? 'border-[#5B4CF0] ring-1 ring-[#5B4CF0]' : 'border-[#E4E7F2]'}`}
              >
                {winner && (
                  <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#e8f8ee] px-2.5 py-1 text-xs font-bold text-[#2f8a51]">
                    ✓ Melhor opção
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={label} width={64} height={64} className="h-16 w-16 rounded-lg object-contain" />
                    : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-3xl">📦</div>}
                  <div>
                    {p.brand && <p className="text-xs font-semibold text-[#5B4CF0]">{p.brand}</p>}
                    <h2 className="font-semibold">{label}</h2>
                    {p.variantLabel && <p className="text-xs text-[#5B607C]">{p.variantLabel}</p>}
                  </div>
                </div>
                <div className="mt-4 space-y-2 border-t border-[#E4E7F2] pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5B607C]">Menor Preço</span>
                    <span className="font-bold text-[#5B4CF0]">{price ? money(price) : '—'}</span>
                  </div>
                  {ppu && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#5B607C]">Por unidade</span>
                      <span className="font-semibold">{money(ppu)}</span>
                    </div>
                  )}
                  {o?.marketplace && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#5B607C]">Farmácia</span>
                      <span>{o.marketplace.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5B607C]">Lojas</span>
                    <span>{(p.offers ?? []).length}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* FAQ Schema visível */}
          {winnerByPrice && (
            <section className="rounded-lg border border-[#E4E7F2] bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-base font-semibold">Qual é mais barato?</h2>
              <p className="text-sm text-[#5B607C]">
                {winnerByPrice === 'A'
                  ? `${nameA} está mais barato: ${priceA ? money(priceA) : '–'} vs ${priceB ? money(priceB) : '–'}.`
                  : winnerByPrice === 'B'
                  ? `${nameB} está mais barato: ${priceB ? money(priceB) : '–'} vs ${priceA ? money(priceA) : '–'}.`
                  : 'Ambos estão com o mesmo Preço no momento.'}
              </p>
              {winnerByPpu && (
                <div className="mt-3">
                  <h3 className="text-sm font-semibold">Custo por unidade</h3>
                  <p className="mt-1 text-sm text-[#5B607C]">
                    {winnerByPpu === 'A'
                      ? `${nameA} tem menor custo por unidade: ${ppuA ? money(ppuA) : '–'}/un.`
                      : winnerByPpu === 'B'
                      ? `${nameB} tem menor custo por unidade: ${ppuB ? money(ppuB) : '–'}/un.`
                      : 'Custo por unidade idêntico.'}
                  </p>
                </div>
              )}
            </section>
          )}

          <section className="rounded-lg border border-[#E4E7F2] bg-white p-5 text-center shadow-sm">
            <h2 className="text-base font-semibold">Monitore os dois e compre na promoção</h2>
            <p className="mt-1 text-sm text-[#5B607C]">Crie alertas gratuitos e receba notificação quando o Preço baixar.</p>
            <a href="/login" className="mt-3 inline-block rounded-lg bg-[#5B4CF0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#493BD0]">
              Criar alertas Grátis
            </a>
          </section>
        </div>
      </main>
    </>
  );
}
