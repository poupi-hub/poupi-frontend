'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';

type Offer = {
  id: string;
  price: string | number;
  currentPrice?: string | number | null;
  originalPrice?: string | number | null;
  pricePerUnit?: string | number | null;
  scrapingStatus?: string | null;
  lastValidScrapedAt?: string | null;
  city?: string | null;
  state?: string | null;
  availability: boolean;
  marketplace?: { name: string };
};

type Product = {
  id: string;
  title: string;
  imageUrl?: string;
  category?: string | null;
  offers: Offer[];
};

type AlertItem = {
  id: string;
  targetPrice: string | number;
  active: boolean;
  product: { id: string; title: string };
};

type Quota = {
  plan: string;
  planName?: string;
  current: number;
  max: number;
  unlimited: boolean;
  atLimit: boolean;
};

type BillingStatus = {
  currentPlan?: string;
  plan?: string;
  planName?: string;
  daysRemaining?: number | null;
};

type Profile = {
  name?: string;
  email?: string;
  emailVerified?: boolean;
};

type ScoreBadge = { score: number; emoji: string; label: string; labelColor: string } | null;

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const offerPrice = (offer?: Offer | null) => Number(offer?.currentPrice ?? offer?.price ?? 0);

function bestOffer(product: Product) {
  return product.offers?.filter((o) => o.availability).sort((a, b) => offerPrice(a) - offerPrice(b))[0] ?? product.offers?.[0];
}

function productDiscount(product: Product) {
  const prices = product.offers?.map((o) => offerPrice(o)).filter((p) => Number.isFinite(p) && p > 0) ?? [];
  if (prices.length < 2) return 0;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return max > min ? Math.round(((max - min) / max) * 100) : 0;
}

function productSavings(product: Product) {
  const prices = product.offers?.map((o) => offerPrice(o)).filter((p) => Number.isFinite(p) && p > 0) ?? [];
  if (prices.length < 2) return 0;
  return Math.max(...prices) - Math.min(...prices);
}

function offerStores(product: Product) {
  return Array.from(new Set(product.offers?.map((o) => o.marketplace?.name).filter(Boolean) as string[]));
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [url, setUrl] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'discount' | 'price' | 'recent' | 'score'>('score');
  const [scores, setScores] = useState<Record<string, ScoreBadge>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const [productRes, alertRes, quotaRes, billingRes, accountRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/alerts'),
      fetch('/api/products/quota'),
      fetch('/api/billing/status'),
      fetch('/api/account'),
    ]);
    const productsData: Product[] = productRes.ok ? await productRes.json() : [];
    if (productRes.ok) setProducts(productsData);
    if (alertRes.ok) setAlerts(await alertRes.json());
    if (quotaRes.ok) setQuota(await quotaRes.json());
    if (billingRes.ok) setBilling(await billingRes.json());
    if (accountRes.ok) setProfile(await accountRes.json());

    // Fetch deal scores in parallel for all products
    if (productsData.length > 0) {
      const scoreEntries = await Promise.all(
        productsData.map(async (p) => {
          try {
            const res = await fetch(`/api/deal-score/${p.id}`);
            if (!res.ok) return [p.id, null] as [string, ScoreBadge];
            const data = await res.json();
            const best = data?.best?.score;
            if (!best) return [p.id, null] as [string, ScoreBadge];
            return [p.id, { score: best.score, emoji: best.emoji, label: best.label, labelColor: best.labelColor }] as [string, ScoreBadge];
          } catch {
            return [p.id, null] as [string, ScoreBadge];
          }
        }),
      );
      setScores(Object.fromEntries(scoreEntries));
    }
  }

  useEffect(() => { refresh(); }, []);

  async function addProduct() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data?.error || data?.message || 'Não foi possível adicionar o produto.');
      return;
    }
    setUrl('');
    await refresh();
  }

  async function removeProduct(productId: string) {
    if (!confirm('Remover este produto da sua lista?')) return;
    const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      await refresh();
    }
  }

  const activeAlerts = alerts.filter((a) => a.active);
  const storeCount = useMemo(() => {
    const stores = new Set<string>();
    products.forEach((p) => p.offers?.forEach((o) => o.marketplace?.name && stores.add(o.marketplace.name)));
    return stores.size;
  }, [products]);
  const displayName = profile?.name || session?.user?.name || '';
  const greeting = displayName ? `Olá, ${displayName.split(' ')[0]}` : 'Olá';

  const sortedProducts = useMemo(() => {
    const filtered = products.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()));
    return [...filtered].sort((a, b) => {
      if (sort === 'price') return offerPrice(bestOffer(a)) - offerPrice(bestOffer(b));
      if (sort === 'discount') return productDiscount(b) - productDiscount(a);
      if (sort === 'score') return (scores[b.id]?.score ?? 0) - (scores[a.id]?.score ?? 0);
      return 0;
    });
  }, [products, query, sort]);

  // Top 3 products by deal score for the "Melhores Oportunidades" section
  const topOpportunities = useMemo(() => {
    return products
      .map((p) => ({ product: p, badge: scores[p.id] }))
      .filter((item): item is { product: Product; badge: NonNullable<ScoreBadge> } => !!item.badge && item.badge.score >= 60)
      .sort((a, b) => b.badge.score - a.badge.score)
      .slice(0, 3);
  }, [products, scores]);

  const planName = billing?.planName || quota?.planName || quota?.plan || billing?.currentPlan || 'Free';
  const daysRemaining = billing?.daysRemaining;
  const offerCount = products.reduce((sum, product) => sum + (product.offers?.length ?? 0), 0);

  return (
    <main className="min-h-screen bg-[#F7F8FC] text-[#090A3D]">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 rounded-2xl border border-[#E4E7F2] bg-white p-4 shadow-sm">
            <BrandLogo compact />
            <nav className="mt-6 grid gap-1 text-sm font-medium">
              <Link className="rounded-lg bg-[#EEF2FF] px-3 py-2 text-[#5B4CF0]" href="/dashboard"><i className="ti ti-layout-dashboard mr-2" />Inicio</Link>
              <a className="rounded-lg px-3 py-2 text-[#5B607C] hover:bg-[#F2F4FF]" href="#produtos"><i className="ti ti-tags mr-2" />Produtos</a>
              <Link className="rounded-lg px-3 py-2 text-[#5B607C] hover:bg-[#F2F4FF]" href="/alertas"><i className="ti ti-bell mr-2" />Alertas</Link>
              <Link className="rounded-lg px-3 py-2 text-[#5B607C] hover:bg-[#F2F4FF]" href="/billing"><i className="ti ti-crown mr-2" />Planos</Link>
              <Link className="rounded-lg px-3 py-2 text-[#5B607C] hover:bg-[#F2F4FF]" href="/conta"><i className="ti ti-user-circle mr-2" />Conta</Link>
              {session?.user?.role === 'admin' && <Link className="rounded-lg px-3 py-2 text-[#5B607C] hover:bg-[#F2F4FF]" href="/admin/dashboard"><i className="ti ti-shield-lock mr-2" />Admin</Link>}
            </nav>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="mt-6 w-full rounded-lg border border-[#E4E7F2] px-3 py-2 text-sm font-medium text-[#5B607C] hover:bg-[#F2F4FF]">Sair</button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="rounded-3xl bg-[#5B4CF0] p-6 text-white shadow-sm">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-sm text-white/75">{displayName ? 'Que bom ter você por aqui.' : 'Atualize seu perfil para personalizar sua experiência.'}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">{greeting} <span aria-hidden>👋</span></h1>
                {/* email verification moved below header for higher visibility */}
              </div>
              <div className="rounded-lg bg-white/14 p-4">
                <div className="text-sm text-white/75">Plano atual</div>
                <div className="mt-1 text-2xl font-semibold">{planName}</div>
                <div className="mt-1 text-sm text-white/80">
                  {typeof daysRemaining === 'number' ? `${daysRemaining} dias de Premium restantes` : 'Plano gratuito ativo'}
                </div>
              </div>
            </div>
          </header>

          {/* ── Email verification banner ── */}
          {!profile?.emailVerified && (
            <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-[#F59E0B] bg-[#FFFBEB] px-4 py-3 sm:flex-row sm:items-center">
              <i className="ti ti-alert-triangle shrink-0 text-xl text-[#D97706]" />
              <p className="flex-1 text-sm font-medium text-[#92400E]">
                ⚠️ Confirme seu e-mail para receber alertas de preço. Sem confirmação, as notificações não chegam.
              </p>
              <Link href="/conta" className="shrink-0 rounded-lg bg-[#F59E0B] px-4 py-2 text-xs font-bold text-white hover:bg-[#D97706]">
                Confirmar agora →
              </Link>
            </div>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <Metric label="Produtos monitorados" value={products.length} hint={quota?.unlimited ? 'Ilimitado no seu plano' : quota ? `${Math.max(0, quota.max - quota.current)} espaços restantes` : 'Monitorados por você'} icon="ti-package" />
            <Metric label="Ofertas comparadas" value={offerCount} hint="Farmácias e lojas vinculadas" icon="ti-tags" />
            <Metric label="Lojas cobertas" value={storeCount} hint="Quantidade real nas suas ofertas" icon="ti-building-store" />
            <Metric label="Premium" value={typeof daysRemaining === 'number' ? daysRemaining : '-'} hint={typeof daysRemaining === 'number' ? 'dias restantes' : `${activeAlerts.length} alertas ativos`} icon="ti-crown" />
          </div>

          <section className="mt-5 rounded-lg border border-[#E4E7F2] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addProduct()}
                className="h-12 flex-1 rounded-lg border border-[#E4E7F2] px-4 text-sm outline-none focus:border-[#5B4CF0]"
                placeholder="Cole a URL do produto ou agregador para comparar lojas"
              />
              <button onClick={addProduct} disabled={loading} className="rounded-lg bg-[#5B4CF0] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {loading ? 'Comparando...' : 'Monitorar produto'}
              </button>
            </div>
            <p className="mt-2 text-xs text-[#8A8FB1]">Se o link trouxer várias farmácias, o Radar do Berço salva uma única ficha do produto com todas as ofertas encontradas.</p>
            {error && <div className="mt-3 rounded-lg border border-[#f0a5a5] bg-[#fff1f1] px-4 py-3 text-sm text-[#9f2828]">{error}</div>}
          </section>

          {topOpportunities.length > 0 && (
            <section className="mt-5 rounded-lg border border-[#d5f0de] bg-[#f6fdf8] p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-semibold text-[#2f8a51]">
                <i className="ti ti-sparkles" />Melhores oportunidades agora
                <span title="DealScore combina preço atual, histórico e disponibilidade. 80+ = Excelente oportunidade | 60–79 = Bom preço | Abaixo de 60 = preço normal" className="cursor-help text-xs font-normal text-[#4a7a5e]">
                  <i className="ti ti-info-circle" />
                </span>
              </h2>
              <p className="mt-1 text-xs text-[#4a7a5e]">Produtos da sua lista com o melhor DealScore no momento.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {topOpportunities.map(({ product, badge }) => {
                  const offer = bestOffer(product);
                  return (
                    <Link key={product.id} href={`/produto/${product.id}`} className="flex flex-col gap-2 rounded-lg border border-[#c0ecd0] bg-white p-3 transition hover:border-[#2f8a51] hover:shadow-md">
                      <div className="flex items-center gap-2">
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.title} className="h-10 w-10 rounded object-contain" /> : <div className="flex h-10 w-10 items-center justify-center rounded bg-[#EEF2FF]"><i className="ti ti-package text-[#5B4CF0]" /></div>}
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{product.title}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-xs text-[#5B607C]">melhor preço</div>
                          <div className="text-base font-semibold text-[#090A3D]">{offer ? money(offerPrice(offer)) : '-'}</div>
                        </div>
                        <span style={{ background: badge.labelColor + '22', color: badge.labelColor }} className="rounded-full px-2 py-0.5 text-sm font-bold">{badge.emoji} {badge.score}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section id="produtos" className="mt-5 rounded-lg border border-[#E4E7F2] bg-white shadow-sm">
            <div className="border-b border-[#E4E7F2] p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <h2 className="text-xl font-semibold">Central de oportunidades</h2>
                  <p className="mt-1 text-sm text-[#5B607C]">Produtos unificados com melhor preço, lojas monitoradas e economia entre ofertas.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 rounded-lg border border-[#E4E7F2] px-3 text-sm outline-none focus:border-[#5B4CF0]" placeholder="Filtrar produtos" />
                  <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 rounded-lg border border-[#E4E7F2] bg-white px-3 text-sm">
                    <option value="score">Melhor DealScore</option>
                    <option value="discount">Maior economia</option>
                    <option value="price">Menor preço</option>
                    <option value="recent">Recentes</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="divide-y divide-[#EDF0FB]">
              {sortedProducts.length === 0 ? (
                <div className="p-10 text-center">
                  {/* ── Onboarding: shown only on first access (no products, no alerts) ── */}
                  {alerts.length === 0 ? (
                    <div className="px-4 py-8">
                      <i className="ti ti-radar text-5xl text-[#5B4CF0]" />
                      <h3 className="mt-4 text-lg font-bold text-[#090A3D]">Bem-vindo ao Radar do Berço</h3>
                      <p className="mt-2 text-sm text-[#5B607C]">Comece em 3 passos para nunca pagar caro em produtos infantis.</p>
                      <div className="mt-6 grid gap-4 text-left sm:grid-cols-3">
                        {([
                          { step: '1', title: 'Adicione um produto', desc: 'Cole o link de uma farmácia ou marketplace. O Radar busca todas as lojas.', icon: 'ti-link' },
                          { step: '2', title: 'Compare os preços', desc: 'Veja o menor preço atual, histórico e custo por unidade em uma tela.', icon: 'ti-chart-bar' },
                          { step: '3', title: 'Crie um alerta', desc: 'Defina seu preço-alvo e receba aviso por e-mail ou Telegram quando baixar.', icon: 'ti-bell-ringing' },
                        ] as const).map(({ step, title, desc, icon }) => (
                          <div key={step} className="rounded-xl border border-[#E4E7F2] bg-[#FAFBFF] p-4 text-left">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B4CF0] text-sm font-black text-white">{step}</span>
                            <i className={`ti ${icon} mt-3 text-2xl text-[#5B4CF0]`} />
                            <h4 className="mt-2 text-sm font-bold text-[#090A3D]">{title}</h4>
                            <p className="mt-1 text-xs leading-5 text-[#5B607C]">{desc}</p>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="URL"]')?.focus()}
                        className="mt-6 rounded-xl bg-[#5B4CF0] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(91,76,240,0.3)] hover:bg-[#493BD0]"
                      >
                        Adicionar primeiro produto →
                      </button>
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      <i className="ti ti-package text-4xl text-[#b9aec8]" />
                      <h3 className="mt-3 text-base font-semibold text-[#090A3D]">Nenhum produto monitorado ainda</h3>
                      <p className="mt-2 mx-auto max-w-sm text-sm text-[#5B607C]">
                        Cole o link de qualquer produto de Farmácia acima. O Radar do Berço compara preços entre lojas e te avisa quando cair.
                      </p>
                      <div className="mt-4 mx-auto max-w-sm rounded-lg bg-[#EEF2FF] px-4 py-3 text-left text-xs text-[#5B607C]">
                        <span className="font-semibold text-[#5B4CF0]">Exemplo:</span>{' '}
                        <span className="break-all">https://www.drogasil.com.br/produto/fraldas-pampers...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : sortedProducts.map((product) => {
                const offer = bestOffer(product);
                const discount = productDiscount(product);
                const savings = productSavings(product);
                const stores = offerStores(product);
                const availableOffers = product.offers?.filter((o) => o.availability).length ?? 0;
                const scoreBadge = scores[product.id];
                return (
                  <article key={product.id} className="flex flex-col gap-4 p-4 transition hover:bg-[#fffcf7] md:flex-row md:items-center">
                    <Link href={`/produto/${product.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                      {product.imageUrl ? <img src={product.imageUrl} alt={product.title} className="h-16 w-16 rounded-lg object-contain" /> : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#5B4CF0]"><i className="ti ti-package text-2xl" /></div>}
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">{product.title}</h3>
                        <p className="mt-1 truncate text-xs text-[#5B607C]">{stores.join(' • ') || 'Sem ofertas ativas'}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {discount > 0 && <span className="rounded-full bg-[#e8f8ee] px-2.5 py-1 text-xs font-semibold text-[#2f8a51]">{discount}% abaixo da maior oferta</span>}
                          {savings > 0 && <span className="rounded-full bg-[#fff5d8] px-2.5 py-1 text-xs font-semibold text-[#8a6316]">economia até {money(savings)}</span>}
                          <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-semibold text-[#5B4CF0]">{availableOffers}/{product.offers?.length ?? 0} ofertas ativas</span>
                          {offer?.pricePerUnit && <span className="rounded-full bg-[#F2F4FF] px-2.5 py-1 text-xs font-semibold text-[#5B607C]">{money(Number(offer.pricePerUnit))}/un</span>}
                          {scoreBadge && <span title="DealScore combina preço atual, histórico e disponibilidade. 80+ = Excelente oportunidade | 60–79 = Bom preço | Abaixo de 60 = preço normal" style={{ background: scoreBadge.labelColor + '22', color: scoreBadge.labelColor, borderColor: scoreBadge.labelColor + '55' }} className="cursor-help rounded-full border px-2.5 py-1 text-xs font-semibold">{scoreBadge.emoji} {scoreBadge.score} · {scoreBadge.label}</span>}
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center justify-between gap-4 md:justify-end">
                      <div className="text-right">
                        <div className="text-xs font-medium text-[#2f8a51]">melhor preço</div>
                        <div className="text-lg font-semibold">{offer ? money(offerPrice(offer)) : '-'}</div>
                        <div className="text-xs text-[#5B607C]">{offer?.marketplace?.name ?? 'Sem loja'}</div>
                      </div>
                      <button onClick={() => removeProduct(product.id)} className="rounded-lg border border-[#f2dada] px-3 py-2 text-sm font-medium text-[#b13a3a] hover:bg-[#fff1f1]">Remover</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
          <footer className="mt-8 flex flex-wrap gap-4 pb-4 text-sm text-[#5B607C]">
            <Link href="/faq" className="hover:text-[#5B4CF0]">FAQ</Link>
            <Link href="/privacidade" className="hover:text-[#5B4CF0]">Política de Privacidade</Link>
            <Link href="/termos" className="hover:text-[#5B4CF0]">Termos de Uso</Link>
          </footer>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, hint, icon }: { label: string; value: number | string; hint: string; icon: string }) {
  return (
    <div className="rounded-lg border border-[#E4E7F2] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-[#5B607C]"><i className={`ti ${icon} text-[#5B4CF0]`} />{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-[#090A3D]">{value}</div>
      <div className="mt-1 text-xs text-[#8A8FB1]">{hint}</div>
    </div>
  );
}
