import type { EffectConfig, Layer } from "@/lib/effects";

/**
 * Motor del movimiento de cada estilo: pétalos, destellos, motas de oro, luces, luciérnagas, mariposas,
 * linternas, palomas, estrellas, aurora y rayos de sol. Dibuja sobre el mismo lienzo que los fuegos artificiales.
 * Las medidas de lib/effects.ts son de un teléfono de 390×844 y aquí se llevan a la pantalla real.
 */

const TAU = Math.PI * 2;
const BASE_W = 390;
const BASE_H = 844;

interface Particle {
  L: Layer;
  z: number;
  ph: number;
  ph2: number;
  f: number;
  size: number;
  x: number;
  y: number;
  v: number;
  rot: number;
  vr: number;
  c: number;
  sd: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  ph: number;
  f: number;
  b: boolean;
}

export interface Scene {
  resize(w: number, h: number): void;
  frame(now: number): void;
}

export function startScene(ctx: CanvasRenderingContext2D, cfg: EffectConfig, reducedMotion: boolean): Scene {
  let W = 0;
  let H = 0;
  let sx = 1;
  let sy = 1;
  let k = 1; // escala de tamaños
  let last = 0;
  let clock = 0;
  let parts: Particle[] = [];
  let stars: Star[] = [];
  let shoot: { x: number; y: number; life: number; dur: number; vx: number; vy: number } | null = null;
  let nextShoot = 2.5;
  const slow = reducedMotion ? 0.3 : 1;
  const sprites = new Map<string, HTMLCanvasElement>();

  const sprite = (key: string, make: () => HTMLCanvasElement) => {
    let c = sprites.get(key);
    if (!c) {
      c = make();
      sprites.set(key, c);
    }
    return c;
  };

  const make = (L: Layer, initial: boolean): Particle => {
    const r = Math.random;
    const zMin = L.zMin ?? 0;
    const zMax = L.zMax ?? 1;
    const z = zMin + r() * (zMax - zMin);
    const p: Particle = {
      L,
      z,
      ph: r() * TAU,
      ph2: r() * TAU,
      f: 0.6 + r() * 0.9,
      size: (L.size[0] + (L.size[1] - L.size[0]) * z) * k,
      x: r() * W,
      y: 0,
      v: (L.speed[0] + (L.speed[1] - L.speed[0]) * z) * (0.8 + r() * 0.4) * k,
      rot: r() * TAU,
      vr: (r() - 0.5) * (L.spin ?? 0),
      c: Math.floor(r() * L.colors.length),
      sd: 1,
    };
    if (L.dir === "up") {
      p.y = initial ? r() * (H + 60) : H + 30 + r() * 70;
    } else if (L.dir === "float") {
      p.y = H * ((L.yMin ?? 0) + r() * ((L.yMax ?? 1) - (L.yMin ?? 0)));
    } else if (L.dir === "side") {
      p.sd = r() < 0.5 ? 1 : -1;
      p.x = initial ? r() * W : p.sd > 0 ? -50 - r() * 160 : W + 50 + r() * 160;
      p.y = H * ((L.yMin ?? 0) + r() * ((L.yMax ?? 0.3) - (L.yMin ?? 0)));
    } else {
      p.y = initial ? r() * (H + 40) - 40 : -30 - r() * 90;
    }
    return p;
  };

  const update = (p: Particle, dt: number, t: number) => {
    const L = p.L;
    if (L.type === "dove") {
      p.x += p.sd * p.v * dt;
      p.y += Math.sin(t * 0.7 * p.f + p.ph) * 7 * dt;
      if (p.x < -240 || p.x > W + 240) Object.assign(p, make(L, false));
      return;
    }
    if (L.type === "firefly") {
      p.x += (Math.sin(t * 0.6 * p.f + p.ph) * 14 + Math.sin(t * 0.23 + p.ph2) * 7) * dt * k;
      p.y += (Math.cos(t * 0.5 * p.f + p.ph2) * 11 - 4) * dt * k;
      if (p.y < H * 0.16) p.y = H * 0.98;
      if (p.x < -24) p.x = W + 20;
      if (p.x > W + 24) p.x = -20;
      return;
    }
    if (L.type === "bokeh") {
      p.y += p.v * dt;
      p.x += Math.sin(t * 0.2 + p.ph) * 6 * dt;
      if (p.y > H + 70 * k) {
        p.y = -70 * k;
        p.x = Math.random() * W;
      }
      return;
    }
    if (L.dir === "up") {
      p.y -= p.v * dt;
      p.x += (Math.sin(t * 0.7 * p.f + p.ph) * (L.sway ?? 10) + (L.drift ?? 0) * (0.6 + p.z)) * dt * k;
      if (p.y < -80 * k || p.x < -90 || p.x > W + 90) Object.assign(p, make(L, false));
      return;
    }
    p.y += p.v * dt;
    p.x += (Math.sin(t * 0.9 * p.f + p.ph) * (L.sway ?? 0) + (L.wind ?? 0)) * dt * k;
    p.rot += p.vr * dt;
    if (p.y > H + 50 || p.x > W + 70 || p.x < -70) Object.assign(p, make(L, false));
  };

  // ------------------------------------------------------------ sprites

  const tile = (w: number, h: number, paint: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    if (g) paint(g);
    return c;
  };

  const petalSprite = (col: string[]) =>
    tile(64, 64, (g) => {
      g.translate(32, 32);
      const grd = g.createLinearGradient(0, -28, 0, 28);
      grd.addColorStop(0, col[1]);
      grd.addColorStop(1, col[0]);
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(0, 28);
      g.bezierCurveTo(-27, 12, -23, -22, -6, -27);
      g.quadraticCurveTo(0, -20, 6, -27);
      g.bezierCurveTo(23, -22, 27, 12, 0, 28);
      g.closePath();
      g.fill();
      if (col[2]) {
        g.strokeStyle = col[2];
        g.lineWidth = 1.8;
        g.stroke();
      }
      g.strokeStyle = "rgba(255,255,255,0.35)";
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(0, 24);
      g.quadraticCurveTo(-3, 0, 0, -20);
      g.stroke();
    });

  const glowSprite = (rgb: string, hard: boolean) =>
    tile(64, 64, (g) => {
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, `rgba(${rgb},1)`);
      grd.addColorStop(hard ? 0.22 : 0.16, `rgba(${rgb},0.5)`);
      grd.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 64);
    });

  const starSprite = (rgb: string) =>
    tile(64, 64, (g) => {
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 12);
      grd.addColorStop(0, `rgba(${rgb},1)`);
      grd.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = `rgba(${rgb},0.9)`;
      g.beginPath();
      g.moveTo(32, 2);
      g.quadraticCurveTo(34, 30, 62, 32);
      g.quadraticCurveTo(34, 34, 32, 62);
      g.quadraticCurveTo(30, 34, 2, 32);
      g.quadraticCurveTo(30, 30, 32, 2);
      g.fill();
    });

  const wingSprite = (cols: string[]) =>
    tile(64, 64, (g) => {
      const grd = g.createRadialGradient(4, 30, 2, 12, 30, 54);
      grd.addColorStop(0, cols[0]);
      grd.addColorStop(1, cols[1]);
      g.fillStyle = grd;
      g.strokeStyle = cols[2];
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(2, 30);
      g.bezierCurveTo(14, 2, 54, 0, 58, 14);
      g.bezierCurveTo(60, 26, 36, 34, 2, 32);
      g.closePath();
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(2, 33);
      g.bezierCurveTo(30, 34, 46, 44, 40, 56);
      g.bezierCurveTo(32, 64, 12, 52, 2, 36);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = "rgba(255,255,255,0.6)";
      g.beginPath();
      g.arc(44, 14, 3.2, 0, TAU);
      g.fill();
      g.beginPath();
      g.arc(30, 48, 2.4, 0, TAU);
      g.fill();
    });

  const lanternSprite = () =>
    tile(48, 64, (g) => {
      const grd = g.createLinearGradient(0, 0, 0, 64);
      grd.addColorStop(0, "#ffe9b0");
      grd.addColorStop(0.55, "#ffbe62");
      grd.addColorStop(1, "#ff8a3a");
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(6, 6);
      g.quadraticCurveTo(24, -2, 42, 6);
      g.lineTo(37, 58);
      g.quadraticCurveTo(24, 64, 11, 58);
      g.closePath();
      g.fill();
      g.fillStyle = "rgba(255,250,225,0.85)";
      g.beginPath();
      g.ellipse(24, 52, 7, 4, 0, 0, TAU);
      g.fill();
      g.strokeStyle = "rgba(160,70,20,0.35)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(24, 4);
      g.lineTo(24, 58);
      g.stroke();
    });

  // ------------------------------------------------------------ dibujo

  const draw = (p: Particle, t: number, sky: number) => {
    const L = p.L;
    const a = L.alpha ? L.alpha[0] + (L.alpha[1] - L.alpha[0]) * p.z : 1;
    const s = p.size;
    const col = L.colors[p.c];
    switch (L.type) {
      case "dove": {
        if (sky <= 0.01) return;
        const burst = Math.sin(t * 0.5 * p.f + p.ph2) > -0.35 ? 1 : 0.18;
        const w = Math.sin(t * 8 * p.f + p.ph) * burst;
        const tx = -7 + 2 * w;
        const ty = -15 * w - 1;
        const q = s / 40;
        const body = typeof col === "string" ? col : "#ffffff";
        ctx.save();
        ctx.globalAlpha = a * sky;
        ctx.translate(p.x, p.y);
        ctx.scale(p.sd * q, q);
        ctx.lineJoin = "round";
        ctx.lineWidth = 1.1 / q;
        ctx.strokeStyle = "rgba(70,90,125,0.42)";
        ctx.fillStyle = "#e6ecf4";
        ctx.beginPath();
        ctx.moveTo(1, -2);
        ctx.quadraticCurveTo(-1 + tx * 0.2, ty * 0.55 - 3, tx - 2, ty - 1.5);
        ctx.quadraticCurveTo(-5 + tx * 0.1, ty * 0.35 - 1, -6, -1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(-9, -0.5);
        ctx.lineTo(-18, -4.5);
        ctx.lineTo(-17, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, 10.5, 3.8, -0.06, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(9.6, -2.2, 3, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#d9a06c";
        ctx.beginPath();
        ctx.moveTo(12.3, -2.9);
        ctx.lineTo(15.2, -2);
        ctx.lineTo(12.3, -1.3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(3, -2);
        ctx.quadraticCurveTo(1 + tx * 0.2, ty * 0.55 - 2, tx, ty);
        ctx.quadraticCurveTo(-4 + tx * 0.1, ty * 0.35, -5, -0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        return;
      }
      case "petal": {
        const spr = sprite(`petal${String(col)}`, () => petalSprite(col as string[]));
        const flip = Math.cos(t * 1.6 * p.f + p.ph2);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + Math.sin(t * 0.8 + p.ph) * 0.4);
        ctx.scale(0.22 + 0.78 * Math.abs(flip), 1);
        ctx.drawImage(spr, -s / 2, -s / 2, s, s);
        ctx.restore();
        return;
      }
      case "glint":
      case "ice": {
        const spr = sprite(`star${String(col)}`, () => starSprite(col as string));
        const w = (Math.sin(t * 2.2 * p.f + p.ph) + 1) / 2;
        const tw = 0.3 + 0.7 * w * w;
        const q = s * (0.7 + 0.3 * tw);
        ctx.save();
        ctx.globalAlpha = a * tw;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.drawImage(spr, -q / 2, -q / 2, q, q);
        ctx.restore();
        return;
      }
      case "speck": {
        const sh = Math.cos(t * 3 * p.f + p.ph);
        ctx.save();
        ctx.globalAlpha = a * (0.4 + 0.6 * Math.abs(sh));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(Math.max(0.15, Math.abs(sh)), 1);
        ctx.fillStyle = col as string;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
        return;
      }
      case "bokeh":
      case "firefly": {
        const fire = L.type === "firefly";
        const spr = sprite(`${fire ? "fly" : "bok"}${String(col)}`, () => glowSprite(col as string, fire));
        let q = 1;
        if (fire) {
          const b = (Math.sin(t * 1.3 * p.f + p.ph) + 1) / 2;
          q = 0.06 + 0.94 * b * b * b;
        }
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = a * q;
        ctx.drawImage(spr, p.x - s / 2, p.y - s / 2, s, s);
        if (fire) {
          ctx.globalAlpha = Math.min(1, a * q * 1.3);
          ctx.fillStyle = L.core ?? "#fbffd8";
          ctx.beginPath();
          ctx.arc(p.x, p.y, (1.1 + p.z * 1.2) * k, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
        return;
      }
      case "butterfly": {
        const spr = sprite(`wing${String(col)}`, () => wingSprite(col as string[]));
        const flap = 0.16 + 0.84 * Math.abs(Math.sin(t * 6.5 * p.f + p.ph));
        const vx = Math.sin(t * 0.7 * p.f + p.ph) * (L.sway ?? 10) + (L.drift ?? 0) * (0.6 + p.z);
        const tilt = Math.atan2(vx, (p.v / k) * 2.2);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        ctx.rotate(tilt);
        ctx.save();
        ctx.scale(flap, 1);
        ctx.drawImage(spr, 0, -s / 2, s, s);
        ctx.restore();
        ctx.save();
        ctx.scale(-flap, 1);
        ctx.drawImage(spr, 0, -s / 2, s, s);
        ctx.restore();
        ctx.fillStyle = L.body ?? "#3a4560";
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(1, s * 0.045), s * 0.26, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
        return;
      }
      case "lantern": {
        const glow = sprite("lglow", () => glowSprite("255,168,80", false));
        const spr = sprite("lantern", lanternSprite);
        const fl = 0.86 + 0.14 * Math.sin(t * 11 * p.f + p.ph) * Math.sin(t * 6.3 + p.ph2);
        const sw = Math.sin(t * 0.9 * p.f + p.ph) * 0.06;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = a * 0.5 * fl;
        ctx.drawImage(glow, p.x - s * 1.6, p.y - s * 1.5, s * 3.2, s * 3.2);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = a * fl;
        ctx.translate(p.x, p.y);
        ctx.rotate(sw);
        ctx.drawImage(spr, -s * 0.375, -s * 0.5, s * 0.75, s);
        ctx.restore();
        return;
      }
    }
  };

  const drawRays = (t: number, sky: number) => {
    const R = cfg.rays;
    if (!R || sky <= 0.01) return;
    const x = R.x * sx;
    const y = R.y * sy;
    const len = R.len * Math.max(sx, sy);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < R.count; i++) {
      const base = R.a0 + ((R.a1 - R.a0) * (i + 0.5)) / R.count;
      const ang = base + Math.sin(t * 0.11 + i * 1.7) * 0.05;
      const hw = R.w * (0.55 + 0.45 * Math.sin(t * 0.27 + i * 2.3));
      const al = R.alpha * sky * (0.45 + (0.55 * (Math.sin(t * 0.35 + i * 1.13) + 1)) / 2);
      const g = ctx.createRadialGradient(x, y, 0, x, y, len);
      g.addColorStop(0, `rgba(${R.color},${al.toFixed(3)})`);
      g.addColorStop(0.55, `rgba(${R.color},${(al * 0.4).toFixed(3)})`);
      g.addColorStop(1, `rgba(${R.color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang - hw) * len, y + Math.sin(ang - hw) * len);
      ctx.lineTo(x + Math.cos(ang + hw) * len, y + Math.sin(ang + hw) * len);
      ctx.closePath();
      ctx.fill();
    }
    if (R.glow) {
      const rad = R.glow * k;
      const pulse = 0.85 + 0.15 * Math.sin(t * 0.6);
      const gg = ctx.createRadialGradient(x, y, 0, x, y, rad);
      gg.addColorStop(0, `rgba(${R.color},${(0.34 * pulse * sky).toFixed(3)})`);
      gg.addColorStop(1, `rgba(${R.color},0)`);
      ctx.fillStyle = gg;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    ctx.restore();
  };

  const drawStars = (t: number, sky: number) => {
    const S = cfg.stars;
    if (!S || sky <= 0.01) return;
    const glint = sprite("starw", () => starSprite("255,255,255"));
    ctx.save();
    ctx.fillStyle = S.color;
    for (const s of stars) {
      const tw = 0.45 + (0.55 * (Math.sin(t * s.f + s.ph) + 1)) / 2;
      ctx.globalAlpha = tw * (s.b ? 1 : 0.75) * sky;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (s.b ? 1.4 : 1), 0, TAU);
      ctx.fill();
      if (s.b) {
        ctx.globalAlpha = tw * 0.6 * sky;
        ctx.drawImage(glint, s.x - 7, s.y - 7, 14, 14);
      }
    }
    ctx.restore();
  };

  const drawAurora = (t: number, sky: number) => {
    if (!cfg.aurora || sky <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    const step = 5 * Math.max(1, sx * 0.6);
    for (const C of cfg.aurora) {
      const base = C.base * sy;
      const height = C.height * sy;
      const g = ctx.createLinearGradient(0, base + 40, 0, base - height - 40);
      g.addColorStop(0, `rgba(${C.c0},0)`);
      g.addColorStop(0.12, `rgba(${C.c0},0.9)`);
      g.addColorStop(0.45, `rgba(${C.c1},0.45)`);
      g.addColorStop(1, `rgba(${C.c1},0)`);
      for (let pass = 0; pass < 2; pass++) {
        ctx.strokeStyle = g;
        ctx.lineWidth = (pass ? 3 : 9) * Math.max(1, sx * 0.6);
        ctx.globalAlpha = (pass ? 0.5 : 0.15) * C.alpha * sky;
        ctx.beginPath();
        for (let x = -10; x <= W + 10; x += step) {
          const u = x / sx; // la onda se calcula en medidas de teléfono
          const y0 = base + (Math.sin(u * C.k1 + t * C.s1 + C.ph) * C.a1 + Math.sin(u * C.k2 - t * C.s2) * C.a2) * sy;
          const hh = height * (0.55 + 0.45 * Math.sin(u * C.k3 + t * C.s3 + C.ph));
          ctx.moveTo(x, y0);
          ctx.lineTo(x + Math.sin(t * 0.3 + u * 0.01) * 6, y0 - hh);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const drawShooting = (dt: number, sky: number) => {
    if (!cfg.shooting) return;
    nextShoot -= dt;
    if (!shoot && nextShoot <= 0) {
      shoot = { x: W * (0.1 + Math.random() * 0.55), y: H * (0.04 + Math.random() * 0.18), life: 0, dur: 0.9, vx: (300 + Math.random() * 120) * k, vy: (110 + Math.random() * 60) * k };
      nextShoot = 4 + Math.random() * 5;
    }
    const s = shoot;
    if (!s) return;
    s.life += dt;
    const q = s.life / s.dur;
    if (q >= 1) {
      shoot = null;
      return;
    }
    if (sky <= 0.01) return;
    const x = s.x + s.vx * s.life;
    const y = s.y + s.vy * s.life;
    const tx = x - s.vx * 0.25;
    const ty = y - s.vy * 0.25;
    const g = ctx.createLinearGradient(x, y, tx, ty);
    g.addColorStop(0, `rgba(255,255,255,${((1 - q) * sky).toFixed(3)})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.restore();
  };

  return {
    resize(w, h) {
      W = w;
      H = h;
      sx = w / BASE_W;
      sy = h / BASE_H;
      k = Math.min(1.5, Math.max(1, Math.min(sx, sy * 1.2)));
      // en pantallas grandes hay más partículas, sin pasarse; con «menos movimiento», muchas menos
      const density = Math.min(2.4, Math.max(1, (w * h) / (BASE_W * BASE_H) / (k * k))) * (reducedMotion ? 0.35 : 1);
      parts = [];
      for (const L of cfg.layers) {
        const n = Math.max(1, Math.round(L.count * (L.type === "dove" ? 1 : density)));
        for (let j = 0; j < n; j++) parts.push(make(L, true));
      }
      parts.sort((a, b) => a.z - b.z);
      stars = [];
      if (cfg.stars) {
        const n = Math.round(cfg.stars.count * Math.min(2.4, Math.max(1, sx)));
        for (let i = 0; i < n; i++) {
          stars.push({ x: Math.random() * w, y: Math.random() * h * cfg.stars.yMax, r: 0.3 + Math.random() * 1.1, ph: Math.random() * TAU, f: 0.5 + Math.random() * 1.5, b: Math.random() < 0.08 });
        }
      }
    },
    frame(now) {
      const dt = (last ? Math.min(0.05, (now - last) / 1000) : 0.016) * slow;
      last = now;
      clock += dt;
      // lo que pertenece al cielo se desvanece al bajar por la invitación, para no cruzarse con el formulario
      const sky = Math.max(0, Math.min(1, 1 - window.scrollY / (H * 0.7)));
      drawRays(clock, sky);
      drawStars(clock, sky);
      drawAurora(clock, sky);
      drawShooting(dt, sky);
      for (const p of parts) {
        update(p, dt, clock);
        draw(p, clock, sky);
      }
    },
  };
}
