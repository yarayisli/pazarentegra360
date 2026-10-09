// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_CREDENTIALS, clearLegacyCredentials } from '../credentials';
import { ApiSettingsAndSaasView } from './ApiSettingsAndSaasView';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('ApiSettingsAndSaasView', () => {
  it('saves credentials through the API and never writes them to localStorage', async () => {
    const calls: { url: string; method: string; body?: string }[] = [];
    vi.stubGlobal('fetch', vi.fn((url: string, init: RequestInit = {}) => {
      calls.push({ url, method: init.method ?? 'GET', body: init.body as string | undefined });
      if (init.method === 'POST') {
        const config = JSON.parse(init.body as string).config;
        return json({ success: true, account: { id: 'a1', marketplace: 'trendyol', storeName: 'x', status: 'DISCONNECTED', config: { ...config, apiSecret: '••••9876' } } }, 201);
      }
      return json({ success: true, accounts: [] });
    }));
    const onUpdate = vi.fn();
    const creds = { ...EMPTY_CREDENTIALS, trendyol: { ...EMPTY_CREDENTIALS.trendyol, supplierId: '149208', apiKey: 'key', apiSecret: 'sec9876' } };
    render(<ApiSettingsAndSaasView credentials={creds} onUpdateCredentials={onUpdate} />);

    fireEvent.click(screen.getByText('Tüm Bağlantıları Kaydet'));
    await screen.findByText(/şifreli olarak kaydedildi/);

    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(['GET /api/marketplace-accounts', 'POST /api/marketplace-accounts']);
    expect(onUpdate.mock.calls[0][0].trendyol.apiSecret).toBe('••••9876');
    expect(localStorage.length).toBe(0);
  });

  it('verifies the connection and marks Trendyol connected', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, init: RequestInit = {}) => {
      if (url.endsWith('/test')) return json({ success: true, status: 'CONNECTED', message: 'Bağlantı tamam' });
      if (init.method === 'PUT') return json({ success: true, account: { id: 'a1', marketplace: 'trendyol', storeName: 'x', status: 'DISCONNECTED', config: { supplierId: '1' } } });
      return json({ success: true, accounts: [{ id: 'a1', marketplace: 'trendyol', storeName: 'x', status: 'DISCONNECTED', config: {} }] });
    }));
    const onUpdate = vi.fn();
    const creds = { ...EMPTY_CREDENTIALS, trendyol: { ...EMPTY_CREDENTIALS.trendyol, supplierId: '1' } };
    render(<ApiSettingsAndSaasView credentials={creds} onUpdateCredentials={onUpdate} />);

    fireEvent.click(screen.getByText('API Bağlantısını Doğrula'));
    await screen.findByText('Bağlantı tamam');
    expect(onUpdate.mock.calls.at(-1)?.[0].trendyol.isConnected).toBe(true);
  });

  it('shows the server error when saving fails or nothing is filled in', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json({ success: false, error: { code: 'CONFIG_MISSING', message: 'Anahtar yok' } }, 503)));
    render(<ApiSettingsAndSaasView credentials={EMPTY_CREDENTIALS} onUpdateCredentials={vi.fn()} />);
    fireEvent.click(screen.getByText('Tüm Bağlantıları Kaydet'));
    await screen.findByText('Anahtar yok');

    vi.stubGlobal('fetch', vi.fn(() => json({ success: true, accounts: [] })));
    fireEvent.click(screen.getByText('API Bağlantısını Doğrula'));
    await waitFor(() => expect(screen.getByText(/Önce Satıcı ID/)).toBeTruthy());
  });
});

describe('clearLegacyCredentials', () => {
  it('removes the old plaintext credentials entry', () => {
    const legacy = ['pe360', 'creds'].join('_');
    localStorage.setItem(legacy, '{"trendyol":{"apiKey":"x"}}');
    clearLegacyCredentials();
    expect(localStorage.getItem(legacy)).toBeNull();
  });
});
