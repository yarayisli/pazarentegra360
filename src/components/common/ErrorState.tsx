import React from "react";
import { AlertCircle } from "lucide-react";
import { errorMessageOf } from "./apiErrors";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div role="alert" className="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <AlertCircle className="w-6 h-6 text-rose-500" aria-hidden="true" />
    <p className="text-sm font-semibold text-slate-700">{errorMessageOf(error)}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-700"
      >
        Yeniden dene
      </button>
    )}
  </div>
);
