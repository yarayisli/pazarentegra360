import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import {
  approvePendingAction,
  listPendingActions,
  pendingActionsKey,
  rejectPendingAction,
  type PendingActionStatus,
  type PendingActionView,
} from "../api/pendingActions";
import { EmptyState } from "./common/EmptyState";
import { ErrorState } from "./common/ErrorState";
import { LoadingState } from "./common/LoadingState";
import { useToast } from "./common/Toast";
import { errorMessageOf } from "./common/apiErrors";

const ACTION_LABELS: Record<string, string> = {
  UPDATE_STOCK_PRICE: "Stok / fiyat güncelleme",
  UPDATE_ORDER_STATUS: "Sipariş durumu güncelleme",
  ANSWER_QUESTION: "Müşteri sorusu cevabı",
};

const STATUS_LABELS: Record<PendingActionStatus, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  EXPIRED: "Süresi doldu",
  EXECUTED: "Uygulandı",
  FAILED: "Başarısız",
};

const fmt = (ms: number) => new Date(ms).toLocaleString("tr-TR");

interface PriceStockItem {
  barcode?: string;
  stock?: number;
  price?: number;
  currentPrice?: number;
}

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

// Human-readable "target: old → new" lines for the payload of each action type.
export function summarize(action: PendingActionView): string[] {
  const p = obj(action.payload);
  switch (action.actionType) {
    case "UPDATE_STOCK_PRICE": {
      const updates = Array.isArray(p.updates) ? (p.updates as PriceStockItem[]) : [];
      return updates.map((u) => {
        const parts: string[] = [];
        if (u.price !== undefined) parts.push(`Fiyat: ${u.currentPrice ?? "?"} → ${u.price}`);
        if (u.stock !== undefined) parts.push(`Stok: → ${u.stock}`);
        return `${u.barcode ?? "?"} — ${parts.join(", ")}`;
      });
    }
    case "UPDATE_ORDER_STATUS":
      return [`Sipariş ${String(p.orderNumber ?? p.externalId ?? "?")} → ${String(p.status ?? "?")}`];
    case "ANSWER_QUESTION":
      return [`Soru ${String(p.externalId ?? "?")}: “${String(p.answer ?? "")}”`];
    default:
      return [];
  }
}

type Decision = { kind: "approve" | "reject"; action: PendingActionView };

export const PendingActionsView: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [decision, setDecision] = useState<Decision | null>(null);

  const query = useQuery({
    queryKey: [...pendingActionsKey, filter],
    queryFn: () => listPendingActions(filter === "PENDING" ? "PENDING" : undefined),
  });

  const mutation = useMutation({
    mutationFn: ({ kind, action }: Decision) =>
      kind === "approve" ? approvePendingAction(action.id) : rejectPendingAction(action.id),
    onSuccess: (_res, { kind }) => {
      toast.success(kind === "approve" ? "İşlem onaylandı." : "İşlem reddedildi.");
    },
    onError: (err, { kind }) => {
      toast.error(errorMessageOf(err) || (kind === "approve" ? "İşlem onaylanamadı." : "İşlem reddedilemedi."));
    },
    onSettled: () => {
      setDecision(null);
      return queryClient.invalidateQueries({ queryKey: pendingActionsKey });
    },
  });

  return (
    <section className="space-y-4" aria-label="Onay bekleyen işlemler">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900">Onay Bekleyen İşlemler</h2>
        </div>
        <select
          aria-label="Durum filtresi"
          value={filter}
          onChange={(e) => setFilter(e.target.value as "PENDING" | "ALL")}
          className="text-sm border border-slate-300 rounded-lg px-2 py-1"
        >
          <option value="PENDING">Bekleyenler</option>
          <option value="ALL">Hepsi</option>
        </select>
      </div>

      {query.isPending && <LoadingState />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      {query.isSuccess && query.data.length === 0 && (
        <EmptyState
          title={filter === "PENDING" ? "Onay bekleyen işlem yok" : "Kayıtlı işlem yok"}
          description="Riskli işlemler güvenlik freninden geçince burada görünür."
        />
      )}
      {query.isSuccess && query.data.length > 0 && (
        <ul className="space-y-3">
          {query.data.map((a) => (
            <li key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-slate-900">
                  {ACTION_LABELS[a.actionType] ?? a.actionType}{" "}
                  <span className="text-xs font-normal text-slate-500">({a.marketplace})</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
              </div>
              <p className="text-sm text-amber-700">Risk nedeni: {a.riskReason}</p>
              <ul className="text-sm text-slate-700 list-disc pl-5">
                {summarize(a).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <p className="text-xs text-slate-500">
                Oluşturulma: {fmt(a.createdAt)} · Son geçerlilik: {fmt(a.expiresAt)}
              </p>
              {a.error && <p className="text-xs text-rose-600">Hata: {a.error}</p>}
              {a.status === "PENDING" && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDecision({ kind: "approve", action: a })}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    Onayla
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision({ kind: "reject", action: a })}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-500"
                  >
                    Reddet
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {decision && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Karar onayı"
            className="bg-white rounded-xl p-5 max-w-md w-full space-y-3"
          >
            <p className="text-sm text-slate-800">
              {decision.kind === "approve"
                ? "Bu işlemi onaylarsanız pazaryerinde hemen uygulanır. Emin misiniz?"
                : "Bu işlemi reddetmek istediğinize emin misiniz?"}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => setDecision(null)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-700"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(decision)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white"
              >
                {decision.kind === "approve" ? "Evet, onayla" : "Evet, reddet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
