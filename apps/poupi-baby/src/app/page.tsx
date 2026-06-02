'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { track } from '@vercel/analytics';
import { BrandLogo, CribRadarIcon } from '../components/brand/BrandLogo';

const categories = [
  { name: 'Fraldas',    slug: 'fraldas',    icon: 'ti-baby-carriage',   tone: 'bg-[#EAF7FF]' },
  { name: 'Fórmulas',   slug: 'formulas',   icon: 'ti-bottle',          tone: 'bg-[#FFF2CE]' },
  { name: 'Mamadeiras', slug: 'mamadeiras', icon: 'ti-cup',             tone: 'bg-[#F0EEFF]' },
  { name: 'Higiene',    slug: 'higiene',    icon: 'ti-droplet',         tone: 'bg-[#FFEAF3]' },
  { name: 'Brinquedos', slug: 'brinquedos', icon: 'ti-ball-football',   tone: 'bg-[#EAF8E9]' },
  { name: 'Alimentação',slug: 'alimentacao',icon: 'ti-bowl',            tone: 'bg-[#EEF4FF]' },
];

const benefits = [
  { title: 'Comparação em segundos', description: 'Veja onde o mesmo produto está mais barato sem abrir várias abas.', icon: 'ti-clock' },
  { title: 'Alertas de preço', description: 'Receba aviso quando fraldas, fórmulas ou itens essenciais baixarem.', icon: 'ti-bell-ringing' },
  { title: 'Histórico de preços', description: 'Entenda se a oferta esta realmente boa antes de comprar.', icon: 'ti-chart-line' },
  { title: 'Economia real', description: 'Compare preço por unidade e evite promoções que parecem melhores do que são.', icon: 'ti-coin' },
  { title: 'Centenas de lojas', description: 'Acompanhe ofertas em farmácias, marketplaces e lojas infantis conectadas.', icon: 'ti-building-store' },
  { title: 'Gratuito', description: 'Comece a buscar e criar alertas sem compromisso.', icon: 'ti-circle-check' },
];

const steps = [
  ['Busque um produto', 'Digite o nome ou cole o link do item que você precisa comprar.'],
  ['Comparamos os preços', 'O Radar do Berço organiza ofertas, lojas e histórico em uma única tela.'],
  ['Você economiza', 'Escolha a melhor oferta ou ative um alerta para comprar no momento certo.'],
];

const monitoredStores = [
  { name: 'Amazon', logo: '/logos/amazon.svg' },
  { name: 'Magalu', logo: '/logos/magalu.svg' },
  { name: 'Mercado Livre', logo: '/logos/mercado-livre.svg' },
  { name: 'Drogasil', logo: '/logos/drogasil.svg' },
  { name: 'Raia', logo: '/logos/raia.svg' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F8FC] text-[#090A3D]">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <BrandLogo compact />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#17183F] md:flex">
            <a href="#como-funciona" className="hover:text-[#5B4CF0]">Como funciona</a>
            <Link href="/produtos" className="hover:text-[#5B4CF0]">Produtos</Link>
            <a href="#categorias" className="hover:text-[#5B4CF0]">Categorias</a>
            <a href="#alertas" className="hover:text-[#5B4CF0]">Alertas de preço</a>
            <Link href="/faq" className="hover:text-[#5B4CF0]">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/alertas" className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#17183F] shadow-sm ring-1 ring-[#E4E7F2] sm:inline-flex">
              <i className="ti ti-bell mr-2 text-[#5B4CF0]" />Alertas
            </Link>
            <button
              onClick={() => { track('login_cta_clicked', { source: 'home' }); signIn('google', { callbackUrl: '/dashboard' }); }}
              className="rounded-full bg-[#5B4CF0] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(91,76,240,0.28)] transition hover:bg-[#493BD0]"
            >
              Entrar / Cadastrar
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[linear-gradient(112deg,#F7FAFF_0%,#FFFFFF_42%,#F3F0FF_100%)]">
        <div className="absolute inset-y-0 right-0 hidden w-[54%] bg-[url('/images/radar-berco-hero.svg')] bg-cover bg-center lg:block" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-10 lg:min-h-[720px] lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-12">
          <div className="relative z-10">
            <BrandLogo href="/" />
            <p className="mt-10 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#5B4CF0] shadow-sm ring-1 ring-[#E2E5F4]">
              Menos tempo procurando. Mais tempo cuidando.
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              O menor preço para tudo o que seu bebê precisa
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#3D4263]">
              Compare preços de fraldas, fórmulas, mamadeiras, higiene, brinquedos e muito mais em centenas de lojas.
            </p>
            <div className="mt-7 flex max-w-2xl flex-col gap-3 rounded-3xl bg-white p-2 shadow-[0_18px_60px_rgba(91,76,240,0.13)] ring-1 ring-[#E3E7F5] sm:flex-row">
              <div className="flex min-h-12 flex-1 items-center gap-3 px-4 text-[#8A8FB1]">
                <i className="ti ti-search text-xl text-[#5B4CF0]" />
                <span>O que você precisa hoje?</span>
              </div>
              <Link href="/produtos" className="rounded-2xl bg-[#5B4CF0] px-6 py-3 text-center text-sm font-bold text-white hover:bg-[#493BD0]">
                Buscar preços
              </Link>
              <a href="#como-funciona" className="rounded-2xl px-6 py-3 text-center text-sm font-bold text-[#5B4CF0] hover:bg-[#F2F0FF]">
                Como funciona
              </a>
            </div>
            <div className="mt-7 grid gap-3 text-sm font-semibold text-[#17183F] sm:grid-cols-4">
              {['100% gratuito', 'Comparação em segundos', 'Alertas de preço', 'Cupons e promoções'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF2FF] text-[#5B4CF0]">
                    <i className="ti ti-sparkles" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-[#E3E7F5]">
              <p className="text-center text-sm font-semibold text-[#3D4263]">Comparamos preços de:</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {monitoredStores.map((store) => (
                  <div key={store.name} className="flex h-14 items-center justify-center rounded-lg border border-[#EEF0F8] bg-white px-3">
                    <img src={store.logo} alt={`Logo ${store.name}`} width={180} height={56} className="h-9 w-full object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 lg:min-h-[640px]">
            <div className="mx-auto max-w-lg rounded-[2rem] bg-white/88 p-5 shadow-[0_28px_80px_rgba(17,24,39,0.18)] ring-1 ring-white/80 backdrop-blur lg:absolute lg:right-4 lg:top-28">
              <div className="flex items-center gap-4">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF2FF] text-[#5B4CF0]">
                  <i className="ti ti-pig-money text-4xl" />
                </span>
                <div>
                  <h2 className="text-xl font-black">Economize todo mês sem esforço</h2>
                  <p className="mt-2 text-sm leading-6 text-[#3D4263]">Encontre o melhor preço e receba alertas quando baixar ainda mais.</p>
                </div>
              </div>
            </div>
            <div className="mx-auto mt-8 max-w-[330px] rounded-[2.2rem] border-[10px] border-[#111827] bg-white p-4 shadow-[0_30px_90px_rgba(17,24,39,0.22)] lg:absolute lg:bottom-0 lg:right-8">
              <div className="mb-4 flex items-center justify-between">
                <BrandLogo compact href="/" />
                <i className="ti ti-bell text-xl text-[#5B4CF0]" />
              </div>
              <div className="rounded-2xl bg-[#F5F7FF] px-4 py-3 text-sm text-[#8A8FB1]">
                <i className="ti ti-search mr-2 text-[#5B4CF0]" />Buscar produto
              </div>
              <p className="mt-5 text-sm font-bold">Ofertas em destaque</p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {['Fralda Pampers', 'Fórmula Aptamil', 'Mamadeira'].map((item, index) => (
                  <div key={item} className="rounded-2xl bg-[#F7F8FC] p-2">
                    <div className="flex aspect-square items-center justify-center rounded-xl bg-white text-[#5B4CF0]">
                      <i className={`ti ${index === 0 ? 'ti-baby-carriage' : index === 1 ? 'ti-bottle' : 'ti-cup'} text-2xl`} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-[10px] font-semibold">{item}</p>
                    <p className="mt-1 text-xs font-black text-[#5B4CF0]">R$ {index === 0 ? '89,90' : index === 1 ? '119,90' : '49,90'}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-[#EEF2FF] p-4 text-sm font-semibold text-[#5B4CF0]">
                <i className="ti ti-bell-ringing mr-2" />Alerta de preço ativo
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="categorias" className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {categories.map((category) => (
            <Link key={category.name} href={`/categoria/${category.slug}`} className={`rounded-2xl ${category.tone} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}>
              <i className={`ti ${category.icon} text-3xl text-[#5B4CF0]`} />
              <h2 className="mt-5 text-lg font-black">{category.name}</h2>
              <p className="mt-2 text-sm font-semibold text-[#3D4263]">Compare agora</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5B4CF0]">Como funciona</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Da busca ao melhor preço em poucos passos</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map(([title, description], index) => (
              <article key={title} className="rounded-3xl border border-[#E4E7F2] bg-[#FBFCFF] p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5B4CF0] text-lg font-black text-white">{index + 1}</span>
                <h3 className="mt-5 text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#3D4263]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map(({ title, description, icon }) => (
            <article key={title} className="rounded-3xl border border-[#E4E7F2] bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#5B4CF0]">
                <i className={`ti ${icon} text-xl`} />
              </span>
              <h3 className="mt-5 text-lg font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#3D4263]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="alertas" className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid overflow-hidden rounded-[2rem] bg-[#090A3D] text-white shadow-[0_24px_80px_rgba(9,10,61,0.24)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-8 sm:p-10">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 text-white">
              <CribRadarIcon className="h-10 w-10" />
            </span>
            <h2 className="mt-6 text-3xl font-black tracking-tight">Receba alertas quando o preço baixar</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
              Ative alertas por Telegram ou e-mail e acompanhe os produtos essenciais da sua família sem gastar tempo procurando.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-4 bg-[#5B4CF0] p-8 sm:p-10">
              <Link href="/produtos" className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-black text-[#5B4CF0] hover:bg-[#F4F6FF]">
                Buscar preços
              </Link>
            <Link href="/alertas" className="rounded-2xl border border-white/25 px-6 py-4 text-center text-sm font-black text-white hover:bg-white/10">
              Ver meus alertas
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E4E7F2] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <BrandLogo compact />
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-[#3D4263]">
            <Link href="/privacidade" className="hover:text-[#5B4CF0]">Privacidade</Link>
            <Link href="/termos" className="hover:text-[#5B4CF0]">Termos</Link>
            <Link href="/faq" className="hover:text-[#5B4CF0]">FAQ</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
