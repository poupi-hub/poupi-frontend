'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MobileBottomNav } from '../../components/MobileBottomNav';

type Alert = {
  id: string;
  targetPrice: string | number;
  active: boolean;
  createdAt: string;
  product: { id: string; title: string; imageUrl?: string };
};

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAlerts() {
    const res = await fetch('/api/alerts');
    if (res.ok) setAlerts(await res.json());
    setLoading(false);
  }

  async function cancelAlert(id: string) {
    await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
    setAlerts((prev) => prev.map((alert) => alert.id === id ? { ...alert, active: false } : alert));
  }

  useEffect(() => { loadAlerts(); }, []);

  const active = alerts.filter((alert) => alert.active);
  const history = alerts.filter((alert) => !alert.active);

  return (
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-8 pb-28 text-[#090A3D] lg:pb-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-sm font-medium text-[#5B4CF0]">Voltar ao painel</Link>
        <header className="mt-5 rounded-lg bg-white p-6 shadow-sm ring-1 ring-[#E4E7F2]">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Alertas de preço</h1>
              <p className="mt-2 text-sm text-[#5B607C]">Acompanhe o que ainda está ativo e o histórico do que já foi encerrado.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-[#EEF2FF] px-5 py-3">
                <div className="text-2xl font-semibold text-[#5B4CF0]">{active.length}</div>
                <div className="text-xs text-[#5B607C]">ativos</div>
              </div>
              <div className="rounded-lg bg-[#eefaf2] px-5 py-3">
                <div className="text-2xl font-semibold text-[#2f8a51]">{history.length}</div>
                <div className="text-xs text-[#5B607C]">histórico</div>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5B4CF0] border-t-transparent" />
          </div>
        ) : alerts.length === 0 ? (
          <section className="mt-6 rounded-lg border border-[#E4E7F2] bg-white p-10 text-center shadow-sm">
            <i className="ti ti-bell-ringing text-4xl text-[#5B4CF0]" />
            <h2 className="mt-3 text-base font-semibold">Nenhum alerta criado ainda</h2>
            <p className="mt-2 max-w-sm mx-auto text-sm text-[#5B607C]">
              Alertas avisam você por e-mail ou Telegram quando o preço de um produto cair abaixo da sua meta. Grátis e sem limites.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg bg-[#5B4CF0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#493BD0]"
              >
                Ir para produtos →
              </Link>
              <Link href="/faq" className="text-sm font-medium text-[#5B607C] hover:text-[#5B4CF0]">
                Como funciona?
              </Link>
            </div>
          </section>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-lg border border-[#E4E7F2] bg-white shadow-sm">
              <div className="border-b border-[#E4E7F2] px-5 py-4">
                <h2 className="font-semibold">Alertas ativos</h2>
                <p className="mt-1 text-sm text-[#5B607C]">Produtos que ainda podem gerar notificação.</p>
              </div>
              <div className="divide-y divide-[#EDF0FB]">
                {active.length ? active.map((alert) => <AlertRow key={alert.id} alert={alert} onCancel={() => cancelAlert(alert.id)} />) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-[#8A8FB1]">Nenhum alerta ativo no momento.</p>
                    <Link href="/dashboard" className="mt-3 inline-block text-sm font-semibold text-[#5B4CF0] hover:underline">
                      Criar alerta para um produto →
                    </Link>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-[#E4E7F2] bg-white shadow-sm">
              <div className="border-b border-[#E4E7F2] px-5 py-4">
                <h2 className="font-semibold">Histórico</h2>
                <p className="mt-1 text-sm text-[#5B607C]">Alertas cancelados ou já encerrados.</p>
              </div>
              <div className="divide-y divide-[#EDF0FB]">
                {history.length ? history.map((alert) => <AlertRow key={alert.id} alert={alert} compact />) : <Empty text="Seu histórico ainda está vazio." />}
              </div>
            </section>
          </div>
        )}
        <footer className="mt-8 flex flex-wrap gap-4 text-sm text-[#5B607C]">
          <Link href="/faq" className="hover:text-[#5B4CF0]">FAQ</Link>
          <Link href="/privacidade" className="hover:text-[#5B4CF0]">Política de Privacidade</Link>
          <Link href="/termos" className="hover:text-[#5B4CF0]">Termos de Uso</Link>
        </footer>
      </div>
      <MobileBottomNav />
    </main>
  );
}

function AlertRow({ alert, onCancel, compact }: { alert: Alert; onCancel?: () => void; compact?: boolean }) {
  return (
    <article className={`flex gap-4 p-4 ${compact ? 'opacity-75' : ''}`}>
      {alert.product.imageUrl ? <img src={alert.product.imageUrl} alt={alert.product.title} className="h-14 w-14 rounded-lg object-contain" /> : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#5B4CF0]"><i className="ti ti-package text-xl" /></div>}
      <div className="min-w-0 flex-1">
        <Link href={`/produto/${alert.product.id}`} className="block truncate text-sm font-semibold hover:text-[#5B4CF0]">{alert.product.title}</Link>
        <p className="mt-1 text-sm text-[#5B607C]">Meta: <strong className="text-[#5B4CF0]">{Number(alert.targetPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
        <p className="mt-1 text-xs text-[#8A8FB1]">Criado em {new Date(alert.createdAt).toLocaleDateString('pt-BR')}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${alert.active ? 'bg-[#e8f8ee] text-[#2f8a51]' : 'bg-[#f1eef5] text-[#5B607C]'}`}>{alert.active ? 'Ativo' : 'Inativo'}</span>
        {onCancel && <button onClick={onCancel} className="text-xs font-semibold text-[#b13a3a] hover:underline">Cancelar</button>}
      </div>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm text-[#8A8FB1]">{text}</div>;
}
