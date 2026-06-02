'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { track } from '@vercel/analytics';
import { BrandLogo } from '../../components/brand/BrandLogo';

const products = [
  { name: 'Fralda Pampers Premium', price: '89,90', change: '-23%', icon: 'ti-baby-carriage' },
  { name: 'Fórmula Nan Supreme', price: '64,50', change: '-17%', icon: 'ti-bottle' },
  { name: 'Lenço Huggies One Done', price: '18,90', change: '-31%', icon: 'ti-droplet' },
];

const loginErrorMessages: Record<string, string> = {
  CredentialsSignin: 'Email ou senha inválidos.',
  'Email nao encontrado': 'Email não encontrado.',
  'Senha invalida': 'Senha inválida.',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    getProviders().then((providers) => setGoogleEnabled(Boolean(providers?.google))).catch(() => setGoogleEnabled(false));
  }, []);

  function callbackUrl() {
    if (typeof window === 'undefined') return '/dashboard';
    const value = new URLSearchParams(window.location.search).get('callbackUrl');
    return value?.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
  }

  async function handleEmailLogin() {
    if (!email || !password) {
      setLoginError('Preencha email e senha.');
      return;
    }

    track('login_attempted', { method: 'email' });
    setLoginLoading(true);
    setLoginError(null);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl(),
    });

    setLoginLoading(false);

    if (result?.error) {
      setLoginError(loginErrorMessages[result.error] ?? 'Não foi possível entrar. Tente novamente.');
    } else if (result?.url) {
      window.location.href = result.url;
    }
  }

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#F7F8FC]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#090A3D] via-[#3127A8] to-[#6C8CFF] lg:flex lg:w-[42%] xl:w-[45%]">
        <div className="absolute left-[-100px] top-[-100px] h-[320px] w-[320px] rounded-full bg-white/16 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[420px] w-[420px] rounded-full bg-[#6C8CFF]/30 blur-3xl" />

        <div className="relative z-10 flex w-full flex-col justify-between px-8 py-8 xl:px-12 xl:py-12">
          <div>
            <BrandLogo light href="/" />

            <div className="mt-8 space-y-2 xl:mt-10">
              <p className="text-2xl font-light text-white/90 xl:text-3xl">
                Fraldas, fórmulas e mais.
              </p>
              <p className="max-w-[340px] text-3xl font-extrabold leading-tight text-white xl:text-4xl">
                Menos tempo procurando. Mais tempo cuidando.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 xl:mt-8">
              {['Preços em tempo real', 'Alertas gratuitos', 'Centenas de lojas'].map((item) => (
                <div
                  key={item}
                  className="flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-2 backdrop-blur-md"
                >
                  <div className="h-2 w-2 rounded-full bg-white" />
                  <span className="text-sm font-medium text-white xl:text-base">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 flex justify-center xl:mt-10">
            <div className="relative h-[390px] w-[205px] overflow-hidden rounded-[38px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
              <div className="absolute left-1/2 top-0 z-20 h-[20px] w-[90px] -translate-x-1/2 rounded-b-3xl bg-black" />
              <div className="p-3 pt-8">
                <div className="rounded-2xl border border-white/10 bg-white/15 p-3">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-white/60">Menor preço hoje</p>
                  <h2 className="mt-1.5 whitespace-nowrap text-3xl font-black leading-none text-white">R$ 89,90</h2>
                  <p className="mt-1 text-[10px] font-semibold text-white">-18% vs semana passada</p>
                </div>

                <div className="mt-3 space-y-2">
                  {products.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-2.5 py-2 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                          <i className={`ti ${item.icon}`} />
                        </div>
                        <div>
                          <p className="text-[9px] leading-none text-white/70">{item.name}</p>
                          <p className="mt-1 whitespace-nowrap text-sm font-bold leading-none text-white">R$ {item.price}</p>
                        </div>
                      </div>
                      <div className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white">{item.change}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#F7F8FC] px-4 py-8 sm:px-6">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(#dfe4f6 1px, transparent 1px), linear-gradient(90deg, #dfe4f6 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 w-full max-w-[480px] rounded-[32px] bg-white px-6 py-8 shadow-[0_20px_60px_rgba(91,76,240,0.12)] ring-1 ring-[#E4E7F2] sm:px-10 sm:py-10 xl:px-12 xl:py-12">
          <p className="text-center text-xs font-bold tracking-[5px] text-[#5B4CF0]">RADAR DO BERÇO</p>
          <h1 className="mt-3 text-center text-4xl font-black text-[#090A3D] sm:text-5xl xl:text-6xl">Entrar</h1>
          <p className="mt-3 text-center text-base leading-7 text-[#5B607C] sm:text-lg xl:text-xl xl:leading-8">
            Acesse sua conta e monitore produtos infantis.
          </p>

          <div className="mt-8 xl:mt-10">
            <div>
              <label className="text-sm font-semibold text-[#111827] sm:text-base">Email</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2.5 h-[56px] w-full rounded-2xl border border-[#E4E7F2] bg-[#FAFBFF] px-5 text-base outline-none transition focus:border-[#5B4CF0] sm:h-[64px] sm:px-6"
              />
            </div>

            <div className="mt-5 sm:mt-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#111827] sm:text-base">Senha</label>
                <Link href="/recuperar-senha" className="text-xs font-semibold text-[#5B4CF0] sm:text-sm">
                  Esqueci minha senha
                </Link>
              </div>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2.5 h-[56px] w-full rounded-2xl border border-[#E4E7F2] bg-[#FAFBFF] px-5 text-base outline-none transition focus:border-[#5B4CF0] sm:h-[64px] sm:px-6"
              />
            </div>

            {loginError && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">{loginError}</p>
            )}

            <button
              onClick={handleEmailLogin}
              disabled={loginLoading}
              className="mt-7 h-[60px] w-full rounded-2xl bg-[#5B4CF0] text-lg font-bold text-white shadow-[0_10px_30px_rgba(91,76,240,0.35)] transition hover:scale-[1.01] disabled:opacity-60 sm:h-[68px] sm:text-xl"
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>

            <p className="mt-5 text-center text-sm text-[#5B607C] sm:text-base">
              Não tem conta?{' '}
              <Link href="/cadastro" className="font-bold text-[#5B4CF0] hover:underline">
                Criar conta com email
              </Link>
            </p>

            {googleEnabled && (
              <>
                <div className="my-7 flex items-center gap-4 sm:my-8">
                  <div className="h-[1px] flex-1 bg-[#E4E7F2]" />
                  <span className="text-xs text-[#8A8FB1] sm:text-sm">ou entre com Google</span>
                  <div className="h-[1px] flex-1 bg-[#E4E7F2]" />
                </div>

                <button
                  onClick={() => { track('login_attempted', { method: 'google' }); signIn('google', { callbackUrl: callbackUrl() }); }}
                  className="flex h-[56px] w-full items-center justify-center gap-3 rounded-2xl border border-[#E4E7F2] bg-white text-base font-semibold text-[#111827] transition hover:bg-[#FAFBFF] sm:h-[64px] sm:text-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 sm:h-6 sm:w-6">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z" />
                    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6.2 7.1l6.2 5.2C39.7 36.3 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z" />
                  </svg>
                  Continuar com Google
                </button>

                <p className="mt-7 text-center text-sm text-[#5B607C] sm:mt-8 sm:text-base">
                  Não tem conta?{' '}
                  <button
                    onClick={() => { track('login_attempted', { method: 'google' }); signIn('google', { callbackUrl: callbackUrl() }); }}
                    className="font-bold text-[#5B4CF0] hover:underline"
                  >
                    Criar conta grátis com Google
                  </button>
                </p>
              </>
            )}
          </div>
          <div className="mt-7 text-center">
            <Link href="/" className="text-sm font-semibold text-[#5B607C] hover:text-[#5B4CF0]">Voltar para a página inicial</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
