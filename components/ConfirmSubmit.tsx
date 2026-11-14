"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Botón de envío que pide un segundo toque. El primero lo arma unos segundos y explica qué va a pasar; el segundo envía.
 * No usa el cuadro de confirmación del navegador porque algunos navegadores dentro de apps (Telegram, WhatsApp) lo bloquean.
 */
export function ConfirmSubmit({
  label,
  confirmLabel,
  pendingLabel,
  warning,
}: {
  label: string;
  confirmLabel: string;
  pendingLabel: string;
  warning: string;
}) {
  const { pending } = useFormStatus();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 6000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <>
      <button
        type="submit"
        className={`btn small${armed ? " danger" : ""}`}
        disabled={pending}
        onClick={(e) => {
          if (!armed) {
            e.preventDefault();
            setArmed(true);
          }
        }}
      >
        {pending ? pendingLabel : armed ? confirmLabel : label}
      </button>
      <span className="error small confirm-hint" aria-live="polite">
        {armed && !pending ? warning : ""}
      </span>
    </>
  );
}
