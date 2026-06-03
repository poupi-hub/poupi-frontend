import Link from 'next/link';
import { BrandLogo } from './brand/BrandLogo';

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-[#E4E7F2] bg-white px-4 py-8 text-sm text-[#5B607C]">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <BrandLogo compact href="/" />
        <nav className="flex flex-wrap justify-center gap-4 text-xs">
          <Link href="/produtos" className="hover:text-[#5B4CF0]">Produtos</Link>
          <Link href="/categoria/fraldas" className="hover:text-[#5B4CF0]">Fraldas</Link>
          <Link href="/faq" className="hover:text-[#5B4CF0]">FAQ</Link>
          <Link href="/privacidade" className="hover:text-[#5B4CF0]">Privacidade</Link>
          <Link href="/termos" className="hover:text-[#5B4CF0]">Termos</Link>
        </nav>
        <p className="text-xs text-[#8A8FB1]">© {new Date().getFullYear()} Nuvii Baby</p>
      </div>
    </footer>
  );
}
