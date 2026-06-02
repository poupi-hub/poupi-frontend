import { getSiteUrl } from '@/lib/site-url';
import { getBackendUrl } from '@/lib/backend-url';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductPageClient } from './ProductPageClient';
import { PublicProductPage } from '@/components/seo/PublicProductPage';

const BACKEND = getBackendUrl("3001");
const SITE_URL = getSiteUrl();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchPublicProduct(slugOrId: string) {
  try {
    const res = await fetch(`${BACKEND}/seo/products/${encodeURIComponent(slugOrId)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchInternalLinks(slugOrId: string) {
  try {
    const res = await fetch(`${BACKEND}/seo/products/${encodeURIComponent(slugOrId)}/internal-links`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchPublicProduct(id);

  if (!product) {
    return { title: 'Produto | Radar do Berço', robots: { index: false } };
  }

  const name = product.canonicalName || product.title;
  const bestOffer = product.offers?.find((o: any) => o.availability) ?? product.offers?.[0];
  const price = bestOffer ? Number(bestOffer.currentPrice ?? bestOffer.price) : null;
  const store = bestOffer?.marketplace?.name ?? '';
  const canonicalUrl = `${SITE_URL}/produto/${product.slug}`;

  const description = [
    name,
    product.brand ? `Marca: ${product.brand}` : '',
    price ? `Menor Preço: R$ ${price.toFixed(2).replace('.', ',')}` : '',
    store ? `em ${store}` : '',
    product.category ? `| ${product.category}` : '',
    '| Radar do Berço Monitor de preços',
  ].filter(Boolean).join(' ');

  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: `Compare preços de ${name} nas principais farmácias. histórico de Preço, score Radar do Berço e alertas automáticos.`,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    sku: product.ean ?? undefined,
    image: product.imageUrl ?? undefined,
    url: canonicalUrl,
  };

  if (price && bestOffer) {
    productJsonLd.offers = {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: bestOffer.marketplace?.name },
      url: bestOffer.productUrl,
    };
  }

  return {
    title: `${name} — Melhor Preço | Radar do Berço`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${name} — Melhor Preço`,
      description,
      url: canonicalUrl,
      type: 'website',
      images: product.imageUrl ? [{ url: product.imageUrl, alt: name }] : [],
      siteName: 'Radar do Berço',
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} — Melhor Preço | Radar do Berço`,
      description,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
    other: {
      'application/ld+json': JSON.stringify(productJsonLd),
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  if (UUID_RE.test(id)) {
    return <ProductPageClient />;
  }

  const [product, internalLinks] = await Promise.all([
    fetchPublicProduct(id),
    fetchInternalLinks(id),
  ]);
  if (!product) notFound();

  // Fetch deal score — endpoint is now public (no auth required)
  let dealScore: { score: number; emoji: string; label: string; labelColor: string } | null = null;
  try {
    const dsRes = await fetch(`${BACKEND}/deal-score/product/${product.id}`, {
      next: { revalidate: 900 },
    });
    if (dsRes.ok) {
      const dsData = await dsRes.json();
      const best = dsData?.best?.score;
      if (best) dealScore = { score: best.score, emoji: best.emoji, label: best.label, labelColor: best.labelColor };
    }
  } catch { /* non-critical */ }

  return <PublicProductPage product={product} internalLinks={internalLinks} dealScore={dealScore} />;
}
