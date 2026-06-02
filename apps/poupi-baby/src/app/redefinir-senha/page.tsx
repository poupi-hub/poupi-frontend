'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { Suspense, useState } from 'react';

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<PasswordResetShell><p className="text-center text-sm text-[#5B607C]">Carregando...</p></PasswordResetShell>}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}

function RedefinirSenhaForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setMessage(null);
    if (!token) return setError('Link invalido ou incompleto.');
    if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.');
    if (password !== confirmPassword) return setError('A confirmacao deve ser igual a senha.');
    setLoading(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data?.message || 'Nao foi possivel redefinir a senha.');
    setMessage('Senha redefinida com sucesso.');
  }

  return (
    <PasswordResetShell>
        <div className="mt-7 grid gap-4">
          <Input label="Nova senha" value={password} onChange={setPassword} />
          <Input label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} />
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 rounded-xl bg-[#eefaf2] p-3 text-sm text-[#21633c]">{message}</p>}
        <button onClick={submit} disabled={loading} className="mt-6 h-12 w-full rounded-2xl bg-[#5B4CF0] font-bold text-white disabled:opacity-60">
          {loading ? 'Salvando...' : 'Redefinir senha'}
        </button>
        <p className="mt-6 text-center text-sm text-[#5B607C]"><Link href="/login" className="font-bold text-[#5B4CF0] hover:underline">Entrar</Link></p>
    </PasswordResetShell>
  );
}

function PasswordResetShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC] px-4 py-8 text-[#090A3D]">
      <section className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(91,76,240,0.12)] ring-1 ring-[#E4E7F2] sm:p-9">
        <p className="text-center text-xs font-bold tracking-[5px] text-[#5B4CF0]">RADAR DO BERCO</p>
        <h1 className="mt-3 text-center text-3xl font-black">Nova senha</h1>
        {children}
      </section>
    </main>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} type="password" className="h-12 rounded-2xl border border-[#E4E7F2] bg-[#FAFBFF] px-4 outline-none focus:border-[#5B4CF0]" />
    </label>
  );
}
