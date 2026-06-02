'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const nav = [
  ['dashboard', 'Visão geral', 'ti-layout-dashboard'],
  ['products', 'Produtos', 'ti-packages'],
  ['offers', 'Ofertas', 'ti-tags'],
  ['marketplaces', 'Marketplaces', 'ti-building-store'],
  ['users', 'Usuários', 'ti-users'],
  ['alerts', 'Alertas', 'ti-bell'],
  ['radar', 'Radar Telegram', 'ti-send'],
  ['scraping', 'Scraping', 'ti-robot'],
  ['jobs', 'Filas', 'ti-list-check'],
  ['analytics', 'Analytics', 'ti-chart-line'],
  ['logs', 'Logs', 'ti-file-text'],
  ['settings', 'Configurações', 'ti-settings'],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-800 bg-[#0b1020]">
        <div className="shrink-0 border-b border-slate-800 px-5 py-5">
          <div className="text-lg font-semibold tracking-tight">Radar do Berço</div>
          <div className="mt-1 text-xs text-slate-500">Painel administrativo</div>
          <Link href="/dashboard" className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-slate-800 px-3 text-xs text-slate-400 hover:bg-slate-900 hover:text-slate-100">
            <i className="ti ti-arrow-left text-sm" />
            Voltar
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 pb-5">
          {nav.map(([href, label, icon]) => {
            const url = href === 'dashboard' ? '/admin/dashboard' : `/admin/${href}`;
            const active = pathname === url || pathname.startsWith(`${url}/`);
            return (
              <Link key={href} href={url} className={['flex items-center gap-3 rounded-md px-3 py-2 text-sm transition', active ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'].join(' ')}>
                <i className={`ti ${icon} text-base`} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-slate-800 bg-[#0b1020] p-4">
          <div className="truncate text-xs text-slate-500">{session?.user?.email}</div>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="mt-3 w-full rounded-md border border-slate-800 px-3 py-2 text-xs text-slate-400 hover:bg-slate-900">Sair</button>
        </div>
      </aside>
      <main className="ml-64 min-h-screen p-6">{children}</main>
    </div>
  );
}
