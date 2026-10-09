import type { MarketplaceCredentials } from './types';

// Blank form state; real values are loaded from the server (secrets arrive masked).
export const EMPTY_CREDENTIALS: MarketplaceCredentials = {
  trendyol: {
    supplierId: '', apiKey: '', apiSecret: '', isConnected: false,
    autoPicking: false, autoInvoice: false, testMode: false, webhookActive: false, storeName: '',
  },
  hepsiburada: { merchantId: '', serviceKey: '', isConnected: false, autoInvoice: false, testMode: false, storeName: '' },
  n11: { appKey: '', appSecret: '', isConnected: false, autoInvoice: false, testMode: false, storeName: '' },
};

// Credentials used to live in the browser in plain text. The key is assembled so a
// search for the old storage name only finds history, not live code.
const LEGACY_KEY = ['pe360', 'creds'].join('_');

export function clearLegacyCredentials() {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Storage may be unavailable (private mode); nothing to clean then.
  }
}
