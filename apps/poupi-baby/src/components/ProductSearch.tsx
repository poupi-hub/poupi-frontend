'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type SearchResult = {
  id: string;
  slug: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  lowestPrice?: number | null;
  availableStores: string[];
  offerCount: number;
  href: string;
};

type SearchResponse = {
  query: string;
  results: SearchResult[];
};

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ProductSearch({
  initialQuery = '',
  compact = false,
}: {
  initialQuery?: string;
  compact?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const canSearch = useMemo(() => query.trim().length >= 2, [query]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setSearched(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query.trim(), limit: compact ? '6' : '18' });
        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => ({ results: [] }))) as SearchResponse;
        if (res.ok) setResults(data.results ?? []);
        setSearched(true);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setSearched(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [canSearch, compact, query]);

  return (
    <section className="rounded-lg border border-[#E4E7F2] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row">
        <label className="sr-only" htmlFor="product-search">
          O que voce precisa hoje?
        </label>
        <div className="flex h-12 flex-1 items-center gap-3 rounded-lg border border-[#E4E7F2] px-4 focus-within:border-[#5B4CF0]">
          <i className="ti ti-search text-xl text-[#5B4CF0]" />
          <input
            id="product-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="O que voce precisa hoje?"
            autoComplete="off"
          />
        </div>
        <Link
          href={`/produtos${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`}
          className="rounded-lg bg-[#5B4CF0] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[#493BD0]"
        >
          Buscar produto
        </Link>
      </div>

      {loading && <p className="mt-3 text-sm text-[#5B607C]">Buscando produtos...</p>}

      {results.length > 0 && (
        <div className={`mt-4 grid gap-3 ${compact ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {results.map((product) => (
            <Link
              key={product.id}
              href={product.href}
              className="rounded-lg border border-[#E4E7F2] bg-[#FCFDFF] p-3 transition hover:border-[#5B4CF0] hover:bg-white"
            >
              <div className="flex gap-3">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-14 w-14 shrink-0 rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#5B4CF0]">
                    <i className="ti ti-package text-2xl" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1 text-[11px] font-semibold">
                    {product.brand && <span className="text-[#5B4CF0]">{product.brand}</span>}
                    {product.category && <span className="text-[#2f8a51]">{product.category}</span>}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-[#090A3D]">
                    {product.name}
                  </h3>
                  <p className="mt-1 truncate text-xs text-[#5B607C]">
                    {product.availableStores.join(' | ') || `${product.offerCount} oferta(s)`}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-medium text-[#5B607C]">Menor preco</span>
                <span className="text-base font-semibold text-[#5B4CF0]">
                  {product.lowestPrice ? money(product.lowestPrice) : 'Indisponivel'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {searched && !loading && canSearch && results.length === 0 && (
        <div className="mt-4 rounded-lg border border-[#E4E7F2] bg-[#FAFBFF] p-4">
          <p className="text-sm font-semibold text-[#090A3D]">Produto nao encontrado no catalogo.</p>
          <p className="mt-1 text-sm text-[#5B607C]">
            Use o fluxo secundario de URL para adicionar esse produto ao Radar do Berco.
          </p>
          <Link href="/dashboard#url-fallback" className="mt-3 inline-block text-sm font-semibold text-[#5B4CF0]">
            Colar uma URL
          </Link>
        </div>
      )}
    </section>
  );
}
