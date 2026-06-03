import Link from 'next/link';
import { BrandLogo } from './brand/BrandLogo';

export function SiteHeader() {
  return (
    <header className="border-b border-[#E4E7F2] bg-white px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <BrandLogo compact href="/" />
        <nav className="hidden items-center gap-5 text-sm font-medium text-[#5B607C] sm:flex">
          <Link href="/produtos" className="hover:text-[#5B4CF0]">Produtos</Link>
          <Link href="/categoria/fraldas" className="hover:text-[#5B4CF0]">Fraldas</Link>
          <Link href="/faq" className="hover:text-[#5B4CF0]">FAQ</Link>
        </nav>
        <Link
          href="/login"
          className="rounded-lg bg-[#5B4CF0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#493BD0]"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}
