import { getBackendUrl } from '@/lib/backend-url';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

const BACKEND = getBackendUrl();
const ROLE_REFRESH_MS = 5 * 60_000;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const hasRealValue = (value?: string) => Boolean(value && !value.startsWith('<') && !value.endsWith('>'));
const googleProviderEnabled = Boolean(
  hasRealValue(googleClientId) &&
  googleClientId?.endsWith('.apps.googleusercontent.com') &&
  hasRealValue(googleClientSecret),
);

async function getTokenFromGoogle(idToken: string) {
  const res = await fetch(`${BACKEND}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ token: string; user: { id: string; role?: string } }>;
}

async function syncBackendToken(email: string, name: string) {
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) return null;
  try {
    const res = await fetch(`${BACKEND}/auth/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
      body: JSON.stringify({ email, name }),
    });
    if (!res.ok) return null;
    return res.json() as Promise<{ token: string; user: { id: string; role?: string } }>;
  } catch {
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const res = await fetch(`${BACKEND}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => null);
          const message = Array.isArray(error?.message) ? error.message[0] : error?.message;
          throw new Error(message || 'Email ou senha inválidos.');
        }
        const data = await res.json();
        return { id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role, backendToken: data.token };
      },
    }),
    ...(googleProviderEnabled
      ? [
          GoogleProvider({
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user && 'backendToken' in user) {
        token.backendToken = (user as any).backendToken;
        token.userId = user.id;
        token.userEmail = user.email ?? '';
        token.userName = user.name ?? '';
        token.role = (user as any).role ?? 'free';
        (token as any).roleCheckedAt = Date.now();
        return token;
      }

      if (account?.provider === 'google') {
        token.userEmail = token.email ?? '';
        token.userName = token.name ?? '';
        const idToken = account.id_token ?? account.access_token;
        if (idToken) {
          const data = await getTokenFromGoogle(idToken).catch(() => null);
          if (data) {
            token.backendToken = data.token;
            token.userId = data.user.id;
            token.role = data.user.role ?? 'free';
            (token as any).roleCheckedAt = Date.now();
            return token;
          }
        }
      }

      if (!token.backendToken && token.userEmail) {
        const data = await syncBackendToken(token.userEmail as string, token.userName as string).catch(() => null);
        if (data) {
          token.backendToken = data.token;
          token.userId = data.user.id;
          token.role = data.user.role ?? 'free';
          (token as any).roleCheckedAt = Date.now();
        }
      }

      const now = Date.now();
      const roleCheckedAt = Number((token as any).roleCheckedAt ?? 0);
      if (token.backendToken && token.userEmail && now - roleCheckedAt > ROLE_REFRESH_MS) {
        try {
          const meRes = await fetch(`${BACKEND}/auth/me`, {
            headers: { Authorization: `Bearer ${token.backendToken}` },
          });
          if (meRes.ok) {
            const me = await meRes.json();
            token.role = me.role ?? token.role;
          }
        } finally {
          (token as any).roleCheckedAt = now;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.backendToken = (token.backendToken as string) ?? null;
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role ?? 'free';
      }
      return session;
    },
  },

  pages: { signIn: '/login' },
};
