'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, ErrorNotice, MetricCard, PageHeader, Panel, fmtDate } from '../components/AdminUi';
import { useAdminApi } from '../components/admin-api';

type RadarItem = {
  productId: string;
  offerId: string;
  product: string;
  marketplace: string | null;
  price: number;
  pricePerUnit: number | null;
  score: number;
  reasons: string[];
  message: string;
};

type RadarRun = {
  dryRun: boolean;
  analyzed: number;
  eligible: number;
  sent: number;
  skippedDuplicate: number;
  skippedCooldown: number;
  skippedConfig: number;
  items: RadarItem[];
};

type RadarHistory = {
  id: string;
  productId: string;
  offerId: string;
  chatId: string;
  priceSnapshot: number;
  score: number;
  status: string;
  reason?: string | null;
  sentAt: string;
  payload?: Partial<RadarItem>;
};

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdminRadarPage() {
  const { request, ready } = useAdminApi();
  const [preview, setPreview] = useState<RadarRun | null>(null);
  const [history, setHistory] = useState<RadarHistory[]>([]);
  const [limit, setLimit] = useState(5);
  const [chatId, setChatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metrics = useMemo(() => ({
    analyzed: preview?.analyzed ?? '-',
    eligible: preview?.eligible ?? '-',
    sent: preview?.sent ?? '-',
    blocked: preview ? preview.skippedCooldown + preview.skippedDuplicate + preview.skippedConfig : '-',
  }), [preview]);

  async function loadHistory() {
    if (!ready) return;
    const rows = await request<RadarHistory[]>('/promotions/telegram-radar?limit=20');
    setHistory(rows);
  }

  async function runRadar(dryRun: boolean) {
    setError(null);
    dryRun ? setLoading(true) : setSending(true);
    try {
      const result = await request<RadarRun>('/promotions/telegram-radar', {
        method: 'POST',
        body: JSON.stringify({
          dryRun,
          limit,
          chatId: chatId.trim() || undefined,
        }),
      });
      setPreview(result);
      await loadHistory();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setSending(false);
    }
  }

  useEffect(() => {
    loadHistory().catch((err) => setError((err as Error).message));
  }, [ready]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Radar do Berço"
        description="Operacao editorial do canal Telegram: gere a pre-via, revise as mensagens e envie apenas oportunidades com contexto real."
        actions={(
          <>
            <Button onClick={() => runRadar(true)} disabled={!ready || loading || sending}>
              <i className="ti ti-eye" />
              {loading ? 'Gerando...' : 'Gerar previa'}
            </Button>
            <Button tone="primary" onClick={() => runRadar(false)} disabled={!ready || loading || sending}>
              <i className="ti ti-send" />
              {sending ? 'Enviando...' : 'Enviar radar'}
            </Button>
          </>
        )}
      />

      <ErrorNotice message={error} />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Ofertas analisadas" value={metrics.analyzed} hint="Amostra recente elegivel" />
        <MetricCard label="Entraram no radar" value={metrics.eligible} hint="Acima do score minimo" tone="good" />
        <MetricCard label="Enviadas" value={metrics.sent} hint="No ultimo disparo" tone="info" />
        <MetricCard label="Bloqueadas" value={metrics.blocked} hint="Cooldown, duplicadas ou config" tone="warn" />
      </div>

      <Panel title="Configuracao do disparo" subtitle="Use chatId apenas para sobrescrever o canal padrao do .env em testes.">
        <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr]">
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-slate-500">Limite</span>
            <input
              type="number"
              min={1}
              max={20}
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-slate-100 outline-none focus:border-violet-500"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-slate-500">Chat ID opcional</span>
            <input
              value={chatId}
              onChange={(event) => setChatId(event.target.value)}
              placeholder="Use vazio para TELEGRAM_CHAT_ID / TELEGRAM_CHANNEL_ID"
              className="h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-slate-100 outline-none focus:border-violet-500"
            />
          </label>
        </div>
      </Panel>

      <Panel title="Previa editorial" subtitle="Mensagens geradas pelo ranking atual. Nada e enviado no modo previa.">
        <div className="grid gap-4 p-4 xl:grid-cols-2">
          {preview?.items.length ? preview.items.map((item) => (
            <article key={`${item.productId}-${item.offerId}`} className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-slate-100">{item.product}</h2>
                  <p className="mt-1 text-xs text-slate-500">{item.marketplace ?? 'Loja monitorada'} · {money(item.price)}</p>
                </div>
                <Badge tone={item.score >= 0.62 ? 'good' : 'warn'}>score {item.score}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.pricePerUnit && <Badge tone="info">{money(item.pricePerUnit)}/un</Badge>}
                {item.reasons.slice(0, 3).map((reason) => <Badge key={reason} tone="default">{reason}</Badge>)}
              </div>
              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-slate-800 bg-[#080b12] p-3 text-xs leading-relaxed text-slate-300">{item.message}</pre>
            </article>
          )) : (
            <div className="col-span-full rounded-lg border border-slate-800 p-8 text-center text-sm text-slate-500">
              Gere uma previa para revisar as mensagens do radar.
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Histórico recente" subtitle="Ultimos envios e bloqueios registrados no banco.">
        <div className="divide-y divide-slate-900">
          {history.length ? history.map((row) => (
            <div key={row.id} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_120px_120px_160px] md:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">{row.payload?.product ?? row.productId}</p>
                <p className="mt-1 text-xs text-slate-500">{row.payload?.marketplace ?? row.chatId} · {row.reason ?? 'sem observacao'}</p>
              </div>
              <div className="text-sm text-slate-300">{money(row.priceSnapshot)}</div>
              <Badge tone={row.status === 'sent' ? 'good' : 'warn'}>{row.status}</Badge>
              <div className="text-xs text-slate-500">{fmtDate(row.sentAt)}</div>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-slate-500">Nenhum post registrado ainda.</div>
          )}
        </div>
      </Panel>
    </div>
  );
}
