import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { THEMES, type ThemeKey } from "./themes";
import { coverName, type CoverInput } from "./cover-version";
import { layoutName } from "./cover-layout";

export const OG_SIZE = { width: 1200, height: 630 };

/** Caja del sobre dentro de sobre-og.jpg (misma proporción 4:3 que .envelope-stage). */
const ENVELOPE = { x: 210, y: 22, w: 780, h: 585 };

type Font = { name: string; data: ArrayBuffer; weight: 500 | 600; style: "normal" | "italic" };

let fonts: Promise<Font[]> | null = null;
const bases = new Map<ThemeKey, Promise<string>>();

function loadFonts(): Promise<Font[]> {
  fonts ??= (async () => {
    const root = process.cwd();
    const [serif, serifItalic, sans] = await Promise.all([
      readFile(path.join(root, "assets", "fonts", "CormorantGaramond-Medium.ttf")),
      readFile(path.join(root, "assets", "fonts", "CormorantGaramond-MediumItalic.ttf")),
      readFile(path.join(root, "assets", "fonts", "Manrope-SemiBold.ttf")),
    ]);
    const buf = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
    return [
      { name: "Cormorant", data: buf(serif), weight: 500, style: "normal" },
      { name: "Cormorant", data: buf(serifItalic), weight: 500, style: "italic" },
      { name: "Manrope", data: buf(sans), weight: 600, style: "normal" },
    ];
  })();
  return fonts;
}

function loadBase(theme: ThemeKey): Promise<string> {
  let p = bases.get(theme);
  if (!p) {
    p = readFile(path.join(process.cwd(), "public", "themes", theme, "sobre-og.jpg")).then(
      (b) => `data:image/jpeg;base64,${b.toString("base64")}`,
    );
    bases.set(theme, p);
  }
  return p;
}

/**
 * Portada para la vista previa del enlace (WhatsApp, iMessage, Telegram): el sobre cerrado del estilo, con el
 * destinatario donde lo escribe la invitación y la nota «Con cariño, <quinceañera>».
 */
export async function renderCover(c: CoverInput): Promise<ImageResponse> {
  const t = THEMES[c.theme];
  const label = c.lang === "es" ? "UNA INVITACIÓN ESPECIAL PARA" : "A SPECIAL INVITATION FOR";
  const note = `${c.lang === "es" ? "CON CARIÑO" : "WITH LOVE"}, ${c.honoree.toLocaleUpperCase(c.lang)}`;
  const name = coverName(c.forName, c.lang);
  const [base, fontList] = await Promise.all([loadBase(c.theme), loadFonts()]);

  const addresseeWidth = ENVELOPE.w * 0.66;
  const addresseeLeft = ENVELOPE.x + ENVELOPE.w * 0.17;
  const layout = layoutName(name, addresseeWidth);
  const addresseeTop = ENVELOPE.y + ENVELOPE.h * (layout.raised ? 0.145 : 0.207);
  const noteBottom = ENVELOPE.h * 0.11 + (OG_SIZE.height - ENVELOPE.y - ENVELOPE.h);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: t.og.background }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={base} width={OG_SIZE.width} height={OG_SIZE.height} style={{ position: "absolute", top: 0, left: 0 }} alt="" />
        <div
          style={{
            position: "absolute",
            top: addresseeTop,
            left: addresseeLeft,
            width: addresseeWidth,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            color: t.og.name,
          }}
        >
          <div style={{ display: "flex", fontFamily: "Manrope", fontWeight: 600, fontSize: 17, letterSpacing: 3.2, color: t.og.label }}>{label}</div>
          {layout.lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                marginTop: i === 0 ? 8 : 0,
                fontFamily: "Cormorant",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: layout.fontSize,
                lineHeight: 1.08,
                letterSpacing: 0.5,
                whiteSpace: "nowrap",
                textShadow: t.og.shadow ?? "0 1px 8px rgba(0,0,0,0.47)",
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: noteBottom,
            left: ENVELOPE.x + ENVELOPE.w * 0.15,
            width: ENVELOPE.w * 0.7,
            display: "flex",
            justifyContent: "center",
            fontFamily: "Manrope",
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: 3.9,
            color: t.og.note,
          }}
        >
          {note}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fontList },
  );
}

/** La misma portada en JPEG liviano (< 300 KB), que es lo que aceptan todos los clientes de mensajería. */
export async function renderCoverJpeg(c: CoverInput): Promise<Buffer> {
  const png = Buffer.from(await (await renderCover(c)).arrayBuffer());
  return sharp(png).jpeg({ quality: 82, progressive: true, mozjpeg: true }).toBuffer();
}
