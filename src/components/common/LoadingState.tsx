import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = "Yükleniyor…" }) => (
  <div role="status" className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
    <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
    <span className="text-sm">{message}</span>
  </div>
);
