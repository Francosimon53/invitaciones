"use client";

import { useEffect, useState } from "react";
import type { Strings } from "@/lib/i18n";

export function Countdown({ startMs, s }: { startMs: number; s: Strings }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, startMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startMs]);
  const r = left ?? 0;
  const values = [Math.floor(r / 864e5), Math.floor(r / 36e5) % 24, Math.floor(r / 6e4) % 60, Math.floor(r / 1e3) % 60];
  return (
    <div className="countdown" aria-label={s.countdownAria}>
      {values.map((v, i) => (
        <div className="count-item" key={i}>
          <span>{left === null ? "—" : String(v).padStart(2, "0")}</span>
          <small>{s.units[i]}</small>
        </div>
      ))}
    </div>
  );
}
