'use client';

import { useState } from 'react';
import { track } from '@vercel/analytics';

type Props = {
  productId: string;
  productTitle: string;
  currentPrice: number;
  onClose: () => void;
  onCreated: () => void;
};

type AlertMode = 'target' | 'discount' | 'drop';

export function AlertModal({
  productId,
  productTitle,
  currentPrice,
  onClose,
  onCreated,
}: Props) {
  const [mode, setMode] = useState<AlertMode>('target');
  const [targetPrice, setTargetPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function computeTargetPrice() {
    if (mode === 'target') return Number(targetPrice.replace(',', '.'));
    if (mode === 'discount') {
      const discount = Number(discountPercent.replace(',', '.'));
      return currentPrice * (1 - discount / 100);
    }
    return currentPrice - 0.01;
  }

  async function handleSubmit() {
    const price = computeTargetPrice();

    if (!Number.isFinite(price) || price <= 0) {
      setError('Informe uma regra de alerta valida.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        targetPrice: Math.round(price * 100) / 100,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data?.message || data?.error || 'Erro ao criar alerta.');
      return;
    }

    track('alert_created', { mode });
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <h2 className="text-2xl font-black text-[#111827]">Criar alerta</h2>
        <p className="mt-1 line-clamp-2 text-sm text-[#6b7280]">{productTitle}</p>
        <p className="mt-3 text-sm text-[#6b7280]">
          Preco atual:{' '}
          <span className="font-bold text-[#111827]">R$ {currentPrice.toFixed(2)}</span>
        </p>

        <div className="mt-6 grid gap-2">
          {([
            ['target', 'Preco alvo'],
            ['discount', 'Percentual de desconto'],
            ['drop', 'Qualquer queda'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                mode === value
                  ? 'border-[#6f36ff] bg-[#f6f1ff] text-[#4b23b7]'
                  : 'border-[#e5e7eb] text-[#6b7280] hover:bg-[#fafafa]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'target' && (
          <div className="mt-4">
            <label className="text-sm font-semibold text-[#111827]">
              Me notificar quando chegar em:
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[#e5e7eb] bg-[#fafafa] px-4">
              <span className="text-sm font-bold text-[#6b7280]">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="h-14 flex-1 bg-transparent text-base outline-none"
              />
            </div>
          </div>
        )}

        {mode === 'discount' && (
          <div className="mt-4">
            <label className="text-sm font-semibold text-[#111827]">
              Me notificar com desconto de:
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[#e5e7eb] bg-[#fafafa] px-4">
              <input
                type="number"
                step="1"
                min="1"
                max="95"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="h-14 flex-1 bg-transparent text-base outline-none"
              />
              <span className="text-sm font-bold text-[#6b7280]">%</span>
            </div>
            <p className="mt-2 text-xs text-[#6b7280]">
              Equivale a R$ {(currentPrice * (1 - Number(discountPercent || 0) / 100)).toFixed(2)}
            </p>
          </div>
        )}

        {mode === 'drop' && (
          <div className="mt-4 rounded-2xl bg-[#fafafa] p-4 text-sm text-[#6b7280]">
            Avisaremos em qualquer queda abaixo de R$ {currentPrice.toFixed(2)}.
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-[#e5e7eb] py-3 text-sm font-semibold text-[#6b7280] hover:bg-[#f5f5f7]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-2xl bg-[#6f36ff] py-3 text-sm font-bold text-white hover:bg-[#5a28cc] disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Criar alerta'}
          </button>
        </div>
      </div>
    </div>
  );
}
