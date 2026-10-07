"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Info, TriangleAlert } from "lucide-react";

type Toast = { id: number; message: string; kind: "success" | "info" | "error" };
type ToastFn = (message: string, kind?: Toast["kind"]) => void;

const ToastCtx = createContext<ToastFn>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback<ToastFn>((message, kind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, message, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[90] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="anim-toast glass-4 pointer-events-auto flex w-auto max-w-full items-center gap-2.5 rounded-xl px-4 py-2.5"
            role="status"
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full",
                t.kind === "success" && "bg-[color-mix(in_oklab,var(--c-signal)_22%,transparent)] text-signal",
                t.kind === "info" && "bg-[color-mix(in_oklab,var(--c-acc)_22%,transparent)] text-acc",
                t.kind === "error" && "bg-[color-mix(in_oklab,var(--c-danger)_20%,transparent)] text-danger"
              )}
            >
              {t.kind === "success" ? <Check size={12} strokeWidth={3} /> : null}
              {t.kind === "info" ? <Info size={12} strokeWidth={2.5} /> : null}
              {t.kind === "error" ? <TriangleAlert size={12} strokeWidth={2.5} /> : null}
            </span>
            <span className="truncate text-[13px] font-medium text-ink">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
