"use client";

import { ReactNode, useEffect, useRef } from "react";
import "./modal.css";

type ModalProps = {
  children: ReactNode;
  className: string;
  onDismiss: () => void;
  label?: string;
  labelledBy?: string;
  alert?: boolean;
  notice?: string;
};

export default function Modal({ children, className, onDismiss, label, labelledBy, alert, notice }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const pointerStartedOutside = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  function outside(x: number, y: number) {
    const rect = ref.current?.getBoundingClientRect();
    return !!rect && (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom);
  }

  return (
    <dialog ref={ref} className={`academy-dialog ${className}`}
      aria-label={label} aria-labelledby={labelledBy} role={alert ? "alertdialog" : undefined}
      onCancel={event => { event.preventDefault(); onDismiss(); }}
      onPointerDown={event => { pointerStartedOutside.current = outside(event.clientX, event.clientY); }}
      onClick={event => {
        if (pointerStartedOutside.current && outside(event.clientX, event.clientY)) onDismiss();
        pointerStartedOutside.current = false;
      }}>
      {children}
      {notice && <p role="status" className="dialog-notice">{notice}</p>}
    </dialog>
  );
}
