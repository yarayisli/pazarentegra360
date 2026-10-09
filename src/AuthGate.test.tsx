// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The real App is huge and talks to the network; the gate only needs to know it rendered.
vi.mock('./App', () => ({
  default: ({ onLogout }: { onLogout: () => void }) => <button onClick={onLogout}>app-screen</button>,
}));

import { AuthGate } from './AuthGate';

const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AuthGate', () => {
  it('shows the app when the session is valid', async () => {
    fetchMock.mockReturnValueOnce(json(200, { success: true, user: { email: 'a@example.com' } }));
    render(<AuthGate />);
    expect(await screen.findByText('app-screen')).toBeInTheDocument();
  });

  it('redirects to the login screen without a session', async () => {
    fetchMock.mockReturnValueOnce(json(401, { success: false }));
    render(<AuthGate />);
    expect(await screen.findByRole('button', { name: 'Giriş yap' })).toBeInTheDocument();
  });

  it('shows the login screen when the server is unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    render(<AuthGate />);
    expect(await screen.findByRole('button', { name: 'Giriş yap' })).toBeInTheDocument();
  });

  it('logs in, shows the app, and returns to login on logout', async () => {
    fetchMock.mockReturnValueOnce(json(401, {}));
    render(<AuthGate />);
    await screen.findByRole('button', { name: 'Giriş yap' });

    fetchMock.mockReturnValueOnce(json(200, { success: true }));
    fireEvent.change(screen.getByLabelText('E-posta'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('Parola'), { target: { value: 'secret-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Giriş yap' }));
    const appButton = await screen.findByText('app-screen');
    expect(fetchMock).toHaveBeenLastCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST', credentials: 'same-origin' }));

    fetchMock.mockReturnValueOnce(json(200, { success: true }));
    fireEvent.click(appButton);
    expect(await screen.findByRole('button', { name: 'Giriş yap' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith('/api/auth/logout', expect.anything());
  });

  it('shows the server error on a failed login', async () => {
    fetchMock.mockReturnValueOnce(json(401, {}));
    render(<AuthGate />);
    await screen.findByRole('button', { name: 'Giriş yap' });

    fetchMock.mockReturnValueOnce(json(401, { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'E-posta veya parola hatalı.' } }));
    fireEvent.change(screen.getByLabelText('E-posta'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('Parola'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Giriş yap' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('E-posta veya parola hatalı.'));
  });

  it('reports an unreachable server on login', async () => {
    fetchMock.mockReturnValueOnce(json(401, {}));
    render(<AuthGate />);
    await screen.findByRole('button', { name: 'Giriş yap' });

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    fireEvent.change(screen.getByLabelText('E-posta'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('Parola'), { target: { value: 'secret-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Giriş yap' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sunucuya ulaşılamadı.');
  });
});
