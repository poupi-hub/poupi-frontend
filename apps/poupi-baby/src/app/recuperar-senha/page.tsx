'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setMessage(null);
    if (!email.trim()) return setError('Informe seu email.');
    setLoading(true);
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data?.message || 'Nao foi possivel solicitar a redefinicao.');
    setMessage(data?.message || 'Se o email existir, enviaremos as instrucoes.');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC] px-4 py-8 text-[#090A3D]">
      <section className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(91,76,240,0.12)] ring-1 ring-[#E4E7F2] sm:p-9">
        <p className="text-center text-xs font-bold tracking-[5px] text-[#5B4CF0]">RADAR DO BERCO</p>
        <h1 className="mt-3 text-center text-3xl font-black">Recuperar senha</h1>
        <p className="mt-3 text-center text-sm leading-6 text-[#5B607C]">Informe seu email para receber um link de redefinicao.</p>
        <label className="mt-7 grid gap-2 text-sm font-semibold">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="h-12 rounded-2xl border border-[#E4E7F2] bg-[#FAFBFF] px-4 outline-none focus:border-[#5B4CF0]" />
        </label>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 rounded-xl bg-[#eefaf2] p-3 text-sm text-[#21633c]">{message}</p>}
        <button onClick={submit} disabled={loading} className="mt-6 h-12 w-full rounded-2xl bg-[#5B4CF0] font-bold text-white disabled:opacity-60">
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
        <p className="mt-6 text-center text-sm text-[#5B607C]"><Link href="/login" className="font-bold text-[#5B4CF0] hover:underline">Voltar para login</Link></p>
      </section>
    </main>
  );
}
