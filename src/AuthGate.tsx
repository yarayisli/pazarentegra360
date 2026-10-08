import React, { useCallback, useEffect, useState } from 'react';
import App from './App';
import { AuthMode, LoginView } from './components/LoginView';

type Session = 'loading' | 'anonymous' | 'authenticated';

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
}

// Shows the login screen until the server confirms a session; any 401 later sends the user back.
export const AuthGate: React.FC = () => {
  const [session, setSession] = useState<Session>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((res) => !cancelled && setSession(res.ok ? 'authenticated' : 'anonymous'))
      .catch(() => !cancelled && setSession('anonymous'));
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(
    async (mode: AuthMode, values: { email: string; password: string; tenantName: string }) => {
      try {
        const res = await postJson(`/api/auth/${mode}`, values);
        if (res.ok) {
          setSession('authenticated');
          return null;
        }
        const data = await res.json().catch(() => null);
        return data?.error?.message ?? 'İşlem başarısız oldu.';
      } catch {
        return 'Sunucuya ulaşılamadı.';
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await postJson('/api/auth/logout', {}).catch(() => undefined);
    setSession('anonymous');
  }, []);

  if (session === 'loading') return null;
  if (session === 'anonymous') return <LoginView onSubmit={submit} />;
  return <App onLogout={logout} />;
};
