import Link from 'next/link';
import { SeoInternalLinks, type SeoInternalLinkGraph } from './SeoInternalLinks';

type ProductCard = {
  id: string;
  slug: string;
  canonicalName?: string | null;
  title: string;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  offers?: Array<{ price: number; currentPrice?: number | null; pricePerUnit?: number | null; marketplace?: { name: string } }>;
  bestPrice?: number;
  pricePerUnit?: number | null;
};

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ProgrammaticListingPage({
  title,
  description,
  breadcrumb,
  products,
  internalLinks,
}: {
  title: string;
  description: string;
  breadcrumb: Array<{ label: string; href?: string }>;
  products: ProductCard[];
  internalLinks?: SeoInternalLinkGraph | null;
}) {
  return (
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-6 text-[#090A3D]">
      <div className="mx-auto max-w-5xl space-y-5">
        <nav className="text-xs text-[#5B607C]">
          <ol className="flex flex-wrap items-center gap-1">
            {breadcrumb.map((item, index) => (
              <li key={`${item.label}:${index}`} className="flex items-center gap-1">
                {index > 0 && <span aria-hidden>/</span>}
                {item.href ? <Link href={item.href} className="hover:text-[#5B4CF0]">{item.label}</Link> : <span className="font-medium text-[#090A3D]">{item.label}</span>}
              </li>
            ))}
          </ol>
        </nav>

        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-[#5B607C]">{description}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => {
            const bestOffer = product.offers?.[0] ?? null;
            const price = product.bestPrice ?? (bestOffer ? Number(bestOffer.currentPrice ?? bestOffer.price) : null);
            const pricePerUnit = product.pricePerUnit ?? bestOffer?.pricePerUnit ?? null;
            const name = product.canonicalName || product.title;
            return (
              <Link key={product.id} href={`/produto/${product.slug}`} className="rounded-lg border border-[#E4E7F2] bg-white p-4 shadow-sm transition hover:border-[#cdb8ef]">
                <div className="flex items-start gap-3">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={name} width={56} height={56} className="h-14 w-14 rounded-lg object-contain" />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-sm font-semibold text-[#5B4CF0]">
                      #{index + 1}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    {index === 0 && price !== null && (
                      <span className="mb-1 inline-block rounded-full bg-[#e8f8ee] px-2 py-0.5 text-[11px] font-semibold text-[#2f8a51]">🏆 Melhor preço</span>
                    )}
                    <span className="line-clamp-2 text-sm font-semibold">{name}</span>
                    {(product.brand || product.category) && (
                      <span className="mt-1 block text-xs text-[#5B607C]">{[product.brand, product.category].filter(Boolean).join(' - ')}</span>
                    )}
                  </span>
                </div>
                <div className="mt-3">
                  {pricePerUnit ? (
                    <>
                      <p className="text-xl font-black text-[#5B4CF0]">{money(Number(pricePerUnit))}<span className="ml-1 text-xs font-semibold text-[#5B607C]">/un</span></p>
                      {price && <p className="text-sm text-[#5B607C]">{money(price)} total</p>}
                    </>
                  ) : price ? (
                    <p className="text-xl font-black text-[#5B4CF0]">{money(price)}</p>
                  ) : (
                    <p className="text-sm text-[#8A8FB1]">Indisponível</p>
                  )}
                  {bestOffer?.marketplace?.name && <p className="mt-1 text-xs text-[#8A8FB1]">🛒 {bestOffer.marketplace.name}</p>}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Banner de conversão — usuários SEO chegam aqui sem conta */}
        <section className="rounded-lg bg-gradient-to-r from-[#5B4CF0] to-[#493BD0] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">🔔 Receba alerta quando o preço cair</h2>
              <p className="mt-1 text-sm text-white/80">
                Monitore esses produtos e seja avisado por e-mail quando o preço atingir sua meta. Grátis.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#5B4CF0] hover:bg-white/90"
            >
              Criar conta grátis →
            </Link>
          </div>
        </section>

        <SeoInternalLinks graph={internalLinks} />
      </div>
    </main>
  );
}
