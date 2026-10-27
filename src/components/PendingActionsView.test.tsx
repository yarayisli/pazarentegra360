// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PendingActionsView } from "./PendingActionsView";
import { ToastProvider } from "./common/Toast";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

const action = (over: Record<string, unknown> = {}) => ({
  id: "11111111-1111-4111-8111-111111111111",
  accountId: null,
  marketplace: "trendyol",
  actionType: "UPDATE_STOCK_PRICE",
  payload: { type: "UPDATE_STOCK_PRICE", updates: [{ barcode: "B1", price: 50, currentPrice: 100 }] },
  riskReason: "B1: fiyat %50.0 düşüyor (eşik %30)",
  status: "PENDING",
  error: null,
  createdAt: Date.UTC(2026, 9, 26, 8, 0),
  expiresAt: Date.UTC(2026, 9, 27, 8, 0),
  decidedAt: null,
  executedAt: null,
  ...over,
});

function setup(handler: (url: string, init: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn((url: string, init: RequestInit = {}) => handler(url, init));
  vi.stubGlobal("fetch", fetchMock);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <PendingActionsView />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return fetchMock;
}

describe("PendingActionsView", () => {
  it("shows the loading state, then the action summary", async () => {
    setup(() => json({ success: true, actions: [action()] }));
    expect(screen.getByText("Yükleniyor…")).toBeInTheDocument();
    await screen.findByText("Stok / fiyat güncelleme", { exact: false });
    expect(screen.getByText(/Fiyat: 100 → 50/)).toBeInTheDocument();
    expect(screen.getByText(/Risk nedeni/)).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    setup(() => json({ success: true, actions: [] }));
    await screen.findByText("Onay bekleyen işlem yok");
  });

  it("shows the error state", async () => {
    setup(() => json({ success: false, error: { code: "FORBIDDEN", message: "x" } }, 403));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert")).toHaveTextContent("yetkiniz yok");
  });

  it("asks for confirmation, approves and refreshes the list", async () => {
    let listed = 0;
    const fetchMock = setup((url, init) => {
      if (init.method === "POST") return json({ success: true, action: action({ status: "EXECUTED" }) });
      listed++;
      return json({ success: true, actions: listed === 1 ? [action()] : [] });
    });
    await screen.findByText("Onayla");
    fireEvent.click(screen.getByText("Onayla"));
    expect(fetchMock).toHaveBeenCalledTimes(1); // nothing sent before confirming
    fireEvent.click(within(screen.getByRole("dialog")).getByText("Evet, onayla"));
    await screen.findByText("İşlem onaylandı ve uygulandı.");
    await screen.findByText("Onay bekleyen işlem yok");
    expect(fetchMock.mock.calls.map((c) => `${c[1]?.method ?? "GET"} ${c[0]}`)).toContain(
      "POST /api/pending-actions/11111111-1111-4111-8111-111111111111/approve",
    );
  });

  it("shows an error, not a success toast, when the approved action failed to apply", async () => {
    setup((_url, init) =>
      init.method === "POST"
        ? json({ success: true, action: action({ status: "FAILED", error: "adapter yok" }) })
        : json({ success: true, actions: [action()] }),
    );
    await screen.findByText("Onayla");
    fireEvent.click(screen.getByText("Onayla"));
    fireEvent.click(within(screen.getByRole("dialog")).getByText("Evet, onayla"));
    await screen.findByText("Onaylandı ama pazaryerinde uygulanamadı: adapter yok");
    expect(screen.queryByText(/İşlem onaylandı/)).not.toBeInTheDocument();
  });

  it("rejects after confirmation", async () => {
    const fetchMock = setup((_url, init) =>
      init.method === "POST"
        ? json({ success: true, action: action({ status: "REJECTED" }) })
        : json({ success: true, actions: [action()] }),
    );
    await screen.findByText("Reddet");
    fireEvent.click(screen.getByText("Reddet"));
    fireEvent.click(within(screen.getByRole("dialog")).getByText("Evet, reddet"));
    await screen.findByText("İşlem reddedildi.");
    expect(fetchMock.mock.calls.some((c) => String(c[0]).endsWith("/reject"))).toBe(true);
  });

  it("cancelling the dialog sends nothing", async () => {
    const fetchMock = setup(() => json({ success: true, actions: [action()] }));
    await screen.findByText("Onayla");
    fireEvent.click(screen.getByText("Onayla"));
    fireEvent.click(screen.getByText("Vazgeç"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("explains a 409 (already decided or expired) in Turkish", async () => {
    setup((_url, init) =>
      init.method === "POST"
        ? json({ success: false, error: { code: "NOT_PENDING", message: "en" } }, 409)
        : json({ success: true, actions: [action()] }),
    );
    await screen.findByText("Onayla");
    fireEvent.click(screen.getByText("Onayla"));
    fireEvent.click(within(screen.getByRole("dialog")).getByText("Evet, onayla"));
    await waitFor(() => expect(screen.getByText(/karar verilmiş veya süresi dolmuş/)).toBeInTheDocument());
  });

  it("filters by status and summarizes order and question actions", async () => {
    const fetchMock = setup(() =>
      json({
        success: true,
        actions: [
          action({
            id: "a",
            actionType: "UPDATE_ORDER_STATUS",
            payload: { orderNumber: "ORD-1", status: "Cancelled" },
            status: "EXECUTED",
          }),
          action({ id: "b", actionType: "ANSWER_QUESTION", payload: { externalId: "Q9", answer: "Merhaba" } }),
        ],
      }),
    );
    await screen.findByText(/Sipariş ORD-1 → Cancelled/);
    expect(screen.getByText(/Soru Q9/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Durum filtresi"), { target: { value: "ALL" } });
    await waitFor(() => expect(fetchMock.mock.calls.some((c) => c[0] === "/api/pending-actions")).toBe(true));
  });
});
