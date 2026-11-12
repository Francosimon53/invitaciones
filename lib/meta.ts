import type { Metadata } from "next";
import type { EventData } from "./event";
import { dateLabel, eventTitle } from "./event";
import type { Lang } from "./i18n";
import { THEMES } from "./themes";

/**
 * Vista previa del enlace (WhatsApp, iMessage, Telegram): título, descripción y la portada del sobre.
 * Las etiquetas og:* van siempre en el HTML inicial (ver htmlLimitedBots en next.config.ts).
 */
export function invitationMetadata(ev: EventData, lang: Lang, opts: { url: string; cover: string; forName?: string }): Metadata {
  const t = THEMES[ev.theme];
  const base = eventTitle(ev, t.title[lang], lang);
  const title = opts.forName ? (lang === "es" ? `Invitación para ${opts.forName} · Los 15 de ${ev.honoree}` : `Invitation for ${opts.forName} · ${ev.honoree}’s 15th Birthday`) : base;
  const description = `${dateLabel(ev, lang)} · ${t.title[lang]} · ${ev.venue}`;
  const ogTitle = opts.forName ? title : lang === "es" ? `Estás invitado · Los 15 de ${ev.honoree}` : `You’re invited · ${ev.honoree}’s 15th Birthday`;
  return {
    title,
    description,
    icons: { icon: `/themes/${ev.theme}/favicon.svg` },
    openGraph: {
      title: ogTitle,
      description,
      type: "website",
      url: opts.url,
      images: [{ url: opts.cover, width: 1200, height: 630, type: "image/jpeg", alt: base }],
    },
    twitter: { card: "summary_large_image", title: ogTitle, description, images: [opts.cover] },
    other: { "theme-color": t.themeColor },
  };
}
