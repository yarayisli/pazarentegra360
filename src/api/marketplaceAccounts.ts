import type { MarketplaceCredentials } from '../types';

export type MarketplaceKey = 'trendyol' | 'hepsiburada' | 'n11' | 'ikas';

export interface AccountView {
  id: string;
  marketplace: MarketplaceKey;
  storeName: string;
  status: string;
  config: Record<string, string | boolean>;
}

const BASE = '/api/marketplace-accounts';

async function call<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.error?.message || 'İstek başarısız oldu.');
  }
  return data as T;
}

export const listAccounts = async () => (await call<{ accounts: AccountView[] }>('', 'GET')).accounts;

export async function saveAccount(existingId: string | undefined, marketplace: MarketplaceKey, config: Record<string, string | boolean>) {
  const res = existingId
    ? await call<{ account: AccountView }>(`/${existingId}`, 'PUT', { config })
    : await call<{ account: AccountView }>('', 'POST', { marketplace, config });
  return res.account;
}

export const testAccount = (id: string) => call<{ status: string; message: string }>(`/${id}/test`, 'POST');

// Server-side config (secrets masked) -> the shape the settings form edits.
export function applyAccounts(base: MarketplaceCredentials, accounts: AccountView[]): MarketplaceCredentials {
  const next: MarketplaceCredentials = { ...base };
  for (const a of accounts) {
    const current = (next as unknown as Record<string, object | undefined>)[a.marketplace] ?? {};
    (next as unknown as Record<string, object>)[a.marketplace] = { ...current, ...a.config, isConnected: a.status === 'CONNECTED' };
  }
  return next;
}

// Form values for one marketplace -> server config (connection state lives on the server).
export function configOf(creds: MarketplaceCredentials, marketplace: MarketplaceKey): Record<string, string | boolean> {
  const source = (creds as unknown as Record<string, Record<string, unknown> | undefined>)[marketplace] ?? {};
  const out: Record<string, string | boolean> = {};
  for (const [k, v] of Object.entries(source)) {
    if (k !== 'isConnected' && (typeof v === 'string' || typeof v === 'boolean')) out[k] = v;
  }
  return out;
}
