'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CadastroPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function register() {
    setError(null);
    setMessage(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim()) return setError('Informe seu nome.');
    if (!emailRegex.test(normalizedEmail)) return setError('Informe um email valido.');
    if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.');
    if (password !== confirmPassword) return setError('A confirmacao deve ser igual a senha.');

    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: normalizedEmail, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      return setError(data?.message || data?.error || 'Nao foi possivel criar sua conta.');
    }

    setMessage('Conta criada. Enviamos um codigo para confirmar seu email.');
    const result = await signIn('credentials', {
      email: normalizedEmail,
      password,
      redirect: false,
      callbackUrl: '/dashboard',
    });
    setLoading(false);
    if (result?.url) window.location.href = result.url;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC] px-4 py-8 text-[#090A3D]">
      <section className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(91,76,240,0.12)] ring-1 ring-[#E4E7F2] sm:p-9">
        <p className="text-center text-xs font-bold tracking-[5px] text-[#5B4CF0]">RADAR DO BERCO</p>
        <h1 className="mt-3 text-center text-3xl font-black">Criar conta</h1>
        <div className="mt-7 grid gap-4">
          <Input label="Nome" value={name} onChange={setName} autoComplete="name" />
          <Input label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
          <Input label="Senha" value={password} onChange={setPassword} type="password" autoComplete="new-password" />
          <Input label="Confirmar senha" value={confirmPassword} onChange={setConfirmPassword} type="password" autoComplete="new-password" />
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 rounded-xl bg-[#eefaf2] p-3 text-sm text-[#21633c]">{message}</p>}
        <button onClick={register} disabled={loading} className="mt-6 h-12 w-full rounded-2xl bg-[#5B4CF0] font-bold text-white shadow-[0_10px_30px_rgba(91,76,240,0.28)] disabled:opacity-60">
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
        <p className="mt-6 text-center text-sm text-[#5B607C]">
          Ja tem conta? <Link href="/login" className="font-bold text-[#5B4CF0] hover:underline">Entrar</Link>
        </p>
      </section>
    </main>
  );
}

function Input({ label, value, onChange, type = 'text', autoComplete }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        value={value}
        type={type}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border border-[#E4E7F2] bg-[#FAFBFF] px-4 outline-none transition focus:border-[#5B4CF0]"
      />
    </label>
  );
}
