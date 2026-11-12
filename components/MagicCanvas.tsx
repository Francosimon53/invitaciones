"use client";

import { useEffect, useRef } from "react";

interface Props {
  active: boolean;
  snow: boolean;
  /** Marca de tiempo (cambia para disparar fuegos artificiales). 0 = sin celebración. */
  celebration: number;
  reducedMotion: boolean;
  /** Colores "r,g,b" del estilo. */
  palette: { stroke: string; fill: string; sparkA: string; sparkB: string };
}

interface Flake {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  alpha: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
}

/** Nieve y fuegos artificiales del diseño original, con los colores de cada estilo. */
export function MagicCanvas({ active, snow, celebration, reducedMotion, palette }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const celebrationStart = useRef(0);

  useEffect(() => {
    celebrationStart.current = celebration ? performance.now() : 0;
  }, [celebration]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !active || (reducedMotion && !snow)) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    const flakes: Flake[] = [];
    const sparks: Spark[] = [];
    const fired = new Set<number>();

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      flakes.length = 0;
      const n = reducedMotion ? 35 : w < 700 ? 100 : 160;
      for (let i = 0; i < n; i++) {
        flakes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1.8 + Math.random() * 4.2,
          speed: 0.75 + Math.random() * 1.65,
          drift: Math.random() * Math.PI * 2,
          alpha: 0.7 + Math.random() * 0.28,
        });
      }
    };

    const burst = (x: number, y: number, color: string) => {
      for (let i = 0; i < 85; i++) {
        const a = (Math.PI * 2 * i) / 85;
        const v = 1.4 + Math.random() * 3.5;
        const life = 65 + Math.random() * 35;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, color });
      }
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 16.667, 2);
      last = now;
      ctx.clearRect(0, 0, w, h);
      const since = now - celebrationStart.current;
      const celebrating = !reducedMotion && celebrationStart.current !== 0 && since < 7200;
      if (celebrating) {
        [500, 1300, 2200, 3400].forEach((t, i) => {
          if (since > t && !fired.has(t)) {
            fired.add(t);
            burst(w * [0.22, 0.77, 0.47, 0.82][i], h * [0.25, 0.19, 0.3, 0.35][i], i % 2 ? palette.sparkA : palette.sparkB);
          }
        });
      }
      if (snow) {
        for (const f of flakes) {
          f.y += f.speed * dt * (reducedMotion ? 0.3 : 1);
          f.x += Math.sin(now * 4e-4 + f.drift) * 0.34 * dt;
          if (f.y > h + 10) {
            f.y = -10;
            f.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${palette.stroke},${f.alpha * 0.7})`;
          if (f.r > 3.9) {
            for (let k = 0; k < 3; k++) {
              const a = (k * Math.PI) / 3;
              const dx = Math.cos(a) * f.r * 1.7;
              const dy = Math.sin(a) * f.r * 1.7;
              ctx.moveTo(f.x - dx, f.y - dy);
              ctx.lineTo(f.x + dx, f.y + dy);
            }
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.strokeStyle = `rgba(${palette.fill},${f.alpha})`;
            ctx.lineWidth = 1.4;
            ctx.stroke();
          } else {
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = `rgba(${palette.fill},${f.alpha})`;
            ctx.fill();
          }
        }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= 0.989;
        s.vy = s.vy * 0.989 + 0.023 * dt;
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.random() > 0.95 ? 2 : 1.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color},${s.life / s.max})`;
        ctx.fill();
      }
      if (snow || celebrating || sparks.length) raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, w, h);
    };
  }, [active, snow, celebration, reducedMotion, palette]);

  return <canvas className="magic-canvas" ref={ref} aria-hidden="true" />;
}
