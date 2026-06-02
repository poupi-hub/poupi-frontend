'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/dashboard', label: 'Inicio', icon: 'ti-layout-dashboard' },
  { href: '/alertas', label: 'Alertas', icon: 'ti-bell' },
  { href: '/billing', label: 'Planos', icon: 'ti-crown' },
  { href: '/conta', label: 'Conta', icon: 'ti-user-circle' },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegacao principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E4E7F2] bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(17,24,39,0.08)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition ${
                active ? 'bg-[#EEF2FF] text-[#5B4CF0]' : 'text-[#5B607C] hover:bg-[#F7F8FC] hover:text-[#5B4CF0]'
              }`}
            >
              <i className={`ti ${item.icon} text-xl`} aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
