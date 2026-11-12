import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/InvitationPage";
import { first, loadEvent, ownRsvp, visitorLang, type SearchParams } from "@/lib/page-helpers";
import { invitationMetadata } from "@/lib/meta";
import { generalCoverUrl } from "@/lib/covers";
import { buildView } from "@/lib/view";
import { toReservation } from "@/lib/reservation";
import { asLang } from "@/lib/i18n";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

/** Vista previa del enlace general: en el idioma principal del evento. */
export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const ev = await loadEvent(slug, first(sp.vista) || null);
  if (!ev) return { title: "Invitación no encontrada" };
  const site = await siteUrl();
  return invitationMetadata(ev, ev.lang, { url: `${site}/${ev.slug}`, cover: generalCoverUrl(site, ev, ev.lang) });
}

/**
 * Enlace general de un evento. Admite ?familia= (nombre en el sobre) y ?idioma=.
 * Un borrador solo se ve con ?vista=<clave> (de Simón o de la anfitriona) y no guarda respuestas.
 */
export default async function EventInvitation({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const ev = await loadEvent(slug, first(sp.vista) || null);
  if (!ev) notFound();
  const lang = asLang(first(sp.idioma) || first(sp.lang)) ?? (await visitorLang()) ?? ev.lang;
  const family = (first(sp.familia) || first(sp.family)).slice(0, 90);
  const live = ev.status === "publicada";
  const existing = live ? await ownRsvp(ev.slug) : null;
  return (
    <InvitationPage
      view={buildView(ev, live ? "live" : "preview", ev.slug)}
      initialLang={lang}
      family={family}
      guest={null}
      initialReservation={toReservation(existing)}
    />
  );
}
