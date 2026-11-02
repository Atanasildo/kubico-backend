"use client";

import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Toast as ToastType } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-primary-50 border-primary-200 text-primary-800",
};

interface Props {
  toasts: ToastType[];
  dismiss: (id: string) => void;
}

export function ToastContainer({ toasts, dismiss }: Props) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.variant];
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-card text-sm font-medium max-w-xs",
              styles[t.variant]
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)}>
              <X className="h-4 w-4 opacity-60 hover:opacity-100" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
