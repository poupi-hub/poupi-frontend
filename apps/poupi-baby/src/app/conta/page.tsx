'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Profile = {
  name: string;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  telegramChatId?: string | null;
};

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [telegramExpiresIn, setTelegramExpiresIn] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadProfile() {
    const res = await fetch('/api/account');
    if (!res.ok) return;
    const data = await res.json();
    setProfile(data);
    setName(data.name ?? '');
    setEmail(data.email ?? '');
    setPhone(data.phone ?? '');
  }

  useEffect(() => { loadProfile(); }, []);

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data?.message || 'Não foi possível salvar seus dados.');
      return;
    }
    setProfile(data);
    setMessage('Dados atualizados com sucesso.');
  }

  async function changePassword() {
    setError(null);
    setMessage(null);
    const res = await fetch('/api/account/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.message || 'Não foi possível alterar a senha.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setMessage('Senha alterada com sucesso.');
  }

  async function requestCode() {
    setError(null);
    setMessage(null);
    const res = await fetch('/api/account/email-confirmation', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.message || 'Não foi possível gerar o Código.');
      return;
    }
    setDevCode(data.devCode ?? null);
    setMessage('Código de confirmação gerado.');
  }

  async function confirmEmail() {
    setError(null);
    setMessage(null);
    const res = await fetch('/api/account/email-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.message || 'Código inválido.');
      return;
    }
    setCode('');
    setDevCode(null);
    setMessage('E-mail confirmado.');
    await loadProfile();
  }

  async function generateTelegramToken() {
    setError(null);
    setMessage(null);
    const res = await fetch('/api/account/telegram-link-token', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.message || 'Não foi possível gerar o token do Telegram.');
      return;
    }
    setTelegramToken(data.token);
    setTelegramExpiresIn(data.expiresInSeconds ?? null);
    setMessage('Token do Telegram gerado.');
  }

  async function disconnectTelegram() {
    setError(null);
    setMessage(null);
    const res = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramChatId: null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.message || 'Não foi possível desconectar o Telegram.');
      return;
    }
    setProfile(data);
    setTelegramToken(null);
    setTelegramExpiresIn(null);
    setMessage('Telegram desconectado.');
  }

  return (
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-8 text-[#090A3D]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-medium text-[#5B4CF0]">Voltar ao painel</Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Minha conta</h1>
            <p className="mt-1 text-sm text-[#5B607C]">Mantenha seus dados atualizados para receber alertas com segurança.</p>
          </div>
        </div>

        {message && <div className="mb-4 rounded-lg border border-[#87cfa2] bg-[#eefaf2] px-4 py-3 text-sm text-[#21633c]">{message}</div>}
        {error && <div className="mb-4 rounded-lg border border-[#f0a5a5] bg-[#fff1f1] px-4 py-3 text-sm text-[#9f2828]">{error}</div>}

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-lg border border-[#E4E7F2] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Dados básicos</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-1 text-sm font-medium">
                Nome
                <input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-lg border border-[#E4E7F2] px-3 outline-none focus:border-[#5B4CF0]" />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                E-mail
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-11 rounded-lg border border-[#E4E7F2] px-3 outline-none focus:border-[#5B4CF0]" />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Telefone
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-lg border border-[#E4E7F2] px-3 outline-none focus:border-[#5B4CF0]" placeholder="Opcional" />
              </label>
            </div>
            <button onClick={saveProfile} disabled={saving} className="mt-5 rounded-lg bg-[#5B4CF0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </section>

          <section className="rounded-lg border border-[#E4E7F2] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">confirmação de e-mail</h2>
                <p className="mt-1 text-sm text-[#5B607C]">Confirme seu e-mail para garantir o recebimento dos alertas de Preço.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${profile?.emailVerified ? 'bg-[#e8f8ee] text-[#2f8a51]' : 'bg-[#fff6de] text-[#9a6a00]'}`}>
                {profile?.emailVerified ? 'Confirmado' : 'Pendente'}
              </span>
            </div>
            {!profile?.emailVerified && (
              <div className="mt-5 grid gap-3">
                <button onClick={requestCode} className="rounded-lg border border-[#5B4CF0] px-4 py-2 text-sm font-semibold text-[#5B4CF0]">Gerar Código</button>
                {devCode && <div className="rounded-lg bg-[#EEF2FF] px-3 py-2 text-sm text-[#3a176e]">Código de teste: <strong>{devCode}</strong></div>}
                <input value={code} onChange={(e) => setCode(e.target.value)} className="h-11 rounded-lg border border-[#E4E7F2] px-3 outline-none focus:border-[#5B4CF0]" placeholder="Digite o Código" />
                <button onClick={confirmEmail} className="rounded-lg bg-[#58bd7a] px-4 py-2 text-sm font-semibold text-white">Confirmar e-mail</button>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[#E4E7F2] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Telegram</h2>
                <p className="mt-1 text-sm text-[#5B607C]">Conecte sua conta para receber alertas no Telegram.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${profile?.telegramChatId ? 'bg-[#e8f8ee] text-[#2f8a51]' : 'bg-[#fff6de] text-[#9a6a00]'}`}>
                {profile?.telegramChatId ? 'Conectado' : 'Pendente'}
              </span>
            </div>

            {profile?.telegramChatId ? (
              <div className="mt-5">
                <p className="text-sm text-[#5B607C]">Seu Telegram ja esta pronto para receber alertas de preço.</p>
                <button onClick={disconnectTelegram} className="mt-4 rounded-lg border border-[#f2dada] px-4 py-2 text-sm font-semibold text-[#b13a3a] hover:bg-[#fff1f1]">
                  Desconectar Telegram
                </button>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                <button onClick={generateTelegramToken} className="rounded-lg border border-[#5B4CF0] px-4 py-2 text-sm font-semibold text-[#5B4CF0]">
                  Gerar token de conexao
                </button>
                {telegramToken && (
                  <div className="rounded-lg bg-[#EEF2FF] p-3 text-sm text-[#3a176e]">
                    <p className="font-semibold">Envie este comando para o bot Radar do Berço:</p>
                    <code className="mt-2 block break-all rounded bg-white px-3 py-2 text-xs text-[#090A3D]">
                      /start {telegramToken}
                    </code>
                    {telegramExpiresIn && (
                      <p className="mt-2 text-xs text-[#5B607C]">Valido por {Math.round(telegramExpiresIn / 60)} minutos.</p>
                    )}
                    <button onClick={loadProfile} className="mt-3 text-xs font-semibold text-[#5B4CF0] hover:underline">
                      Ja enviei, verificar status
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[#E4E7F2] bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold">Alterar senha</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">
                Senha atual
                <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="h-11 rounded-lg border border-[#E4E7F2] px-3 outline-none focus:border-[#5B4CF0]" />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Nova senha
                <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="h-11 rounded-lg border border-[#E4E7F2] px-3 outline-none focus:border-[#5B4CF0]" />
              </label>
            </div>
            <button onClick={changePassword} className="mt-5 rounded-lg bg-[#090A3D] px-4 py-2.5 text-sm font-semibold text-white">Atualizar senha</button>
          </section>
        </div>
        <footer className="mt-8 flex flex-wrap gap-4 text-sm text-[#5B607C]">
          <Link href="/faq" className="hover:text-[#5B4CF0]">FAQ</Link>
          <Link href="/privacidade" className="hover:text-[#5B4CF0]">Política de Privacidade</Link>
          <Link href="/termos" className="hover:text-[#5B4CF0]">Termos de Uso</Link>
        </footer>
      </div>
    </main>
  );
}
