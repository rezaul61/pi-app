"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./primitives";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal>
      <button
        aria-label="Close"
        onClick={onClose}
        className="anim-fade absolute inset-0 cursor-default bg-[rgba(4,6,14,.6)] backdrop-blur-[4px]"
      />
      <div
        ref={ref}
        className={cn(
          "anim-scale-in glass-4 relative flex flex-col w-full max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden",
          wide ? "max-w-2xl" : "max-w-lg"
        )}
      >
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            {title ? <h2 className="track-heading text-[17px] font-semibold text-ink">{title}</h2> : <span />}
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="press flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-2 hover:bg-s2 hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return content;
  return createPortal(content, document.body);
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirm",
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed text-ink-2">{body}</p>
      <div className="mt-6 flex justify-end gap-2.5">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
