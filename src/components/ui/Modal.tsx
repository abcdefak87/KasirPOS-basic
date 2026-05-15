"use client";
import { ReactNode, useEffect } from "react";
import { IconClose } from "./Icon";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-md",
}: Props) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-[2px] anim-fade"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-t-2xl sm:rounded-2xl shadow-pop anim-pop max-h-[95vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="px-5 pt-5 pb-3">
            {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
            {description && (
              <p className="text-sm text-text-muted mt-1">{description}</p>
            )}
          </div>
        )}
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text"
        >
          <IconClose size={18} />
        </button>
        <div className="px-5 pb-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-border bg-surface-muted rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "brand";
  loading?: boolean;
}

import { Button } from "./Button";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  tone = "danger",
  loading,
}: ConfirmProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} maxWidth="max-w-sm">
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
