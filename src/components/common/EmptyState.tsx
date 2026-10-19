import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title = "Kayıt bulunamadı", description }) => (
  <div className="flex flex-col items-center justify-center gap-1 py-12 text-center text-slate-400">
    <Inbox className="w-6 h-6" aria-hidden="true" />
    <p className="text-sm font-semibold text-slate-500">{title}</p>
    {description && <p className="text-xs">{description}</p>}
  </div>
);
