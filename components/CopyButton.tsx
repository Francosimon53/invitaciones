"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copiar enlace", className = "btn" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setDone(true);
    window.setTimeout(() => setDone(false), 1800);
  };
  return (
    <button type="button" className={className} onClick={copy} aria-live="polite">
      {done ? "Copiado ✓" : label}
    </button>
  );
}
