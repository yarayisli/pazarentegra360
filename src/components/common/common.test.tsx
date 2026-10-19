// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/client";
import { errorMessageOf } from "./apiErrors";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { ToastProvider, useToast } from "./Toast";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("state components", () => {
  it("renders loading with a status role", () => {
    render(<LoadingState message="Siparişler yükleniyor" />);
    expect(screen.getByRole("status")).toHaveTextContent("Siparişler yükleniyor");
  });

  it("renders empty state title and description", () => {
    render(<EmptyState title="Sipariş yok" description="Filtreyi değiştirin" />);
    expect(screen.getByText("Sipariş yok")).toBeInTheDocument();
    expect(screen.getByText("Filtreyi değiştirin")).toBeInTheDocument();
  });

  it("uses the default empty title", () => {
    render(<EmptyState />);
    expect(screen.getByText("Kayıt bulunamadı")).toBeInTheDocument();
  });

  it("calls onRetry when the retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorState error={new ApiError(0, "NETWORK_ERROR", "x")} onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Sunucuya ulaşılamadı");
    fireEvent.click(screen.getByText("Yeniden dene"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("hides the retry button without a handler", () => {
    render(<ErrorState error={new Error("x")} />);
    expect(screen.queryByText("Yeniden dene")).toBeNull();
  });
});

describe("errorMessageOf", () => {
  it("maps known codes to Turkish text", () => {
    expect(errorMessageOf(new ApiError(404, "NOT_FOUND", "nope"))).toBe("İstenen kayıt bulunamadı.");
    expect(errorMessageOf(new ApiError(429, "RATE_LIMITED", "slow"))).toMatch(/Çok fazla istek/);
  });

  it("maps any 401 to the session-expired message", () => {
    expect(errorMessageOf(new ApiError(401, "WHATEVER", "x"))).toMatch(/Oturumunuz sona erdi/);
  });

  it("hides raw 5xx messages for unknown codes", () => {
    expect(errorMessageOf(new ApiError(500, "UNKNOWN", "stack trace"))).toBe("Beklenmeyen bir sunucu hatası oluştu.");
  });

  it("falls back to the server message for unknown 4xx codes", () => {
    expect(errorMessageOf(new ApiError(409, "CONFLICT", "Zaten var"))).toBe("Zaten var");
  });

  it("returns a generic message for non-API errors", () => {
    expect(errorMessageOf("boom")).toBe("Bir hata oluştu. Lütfen tekrar deneyin.");
  });

  it("uses the generic message when an ApiError has no text", () => {
    expect(errorMessageOf(new ApiError(400, "ODD", ""))).toBe("Bir hata oluştu. Lütfen tekrar deneyin.");
  });
});

describe("Toast", () => {
  const Trigger = () => {
    const toast = useToast();
    return (
      <>
        <button onClick={() => toast.success("Kaydedildi")}>ok</button>
        <button onClick={() => toast.error("Hata oldu")}>fail</button>
      </>
    );
  };

  it("announces toasts in an aria-live region and auto-dismisses", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    fireEvent.click(screen.getByText("ok"));
    fireEvent.click(screen.getByText("fail"));
    expect(region).toHaveTextContent("Kaydedildi");
    expect(region).toHaveTextContent("Hata oldu");
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(region).toBeEmptyDOMElement();
  });

  it("throws when used outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Trigger />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});
