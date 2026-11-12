import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/InvitationPage";
import { loadEvent, loadGuest, ownRsvp, visitorLang } from "@/lib/page-helpers";
import { invitationMetadata } from "@/lib/meta";
import { guestCoverUrl } from "@/lib/covers";
import { buildView } from "@/lib/view";
import { toReservation } from "@/lib/reservation";
import { personalLink } from "@/lib/invite";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string; token: string }>;

/** Vista previa del enlace personal: en el idioma de la lista, igual que el mensaje y la portada. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, token } = await params;
  const [ev, guest] = await Promise.all([loadEvent(slug, null), loadGuest(slug, token)]);
  if (!ev || !guest) return {};
  const site = await siteUrl();
  return invitationMetadata(ev, guest.lang, {
    url: personalLink(site, ev.slug, guest.token),
    cover: guestCoverUrl(site, ev, guest),
    forName: guest.display_name,
  });
}

/**
 * Enlace personal: nombre en el sobre y su respuesta previa.
 * Idioma: lo que el invitado eligió en el selector → el de su teléfono → el de la lista.
 */
export default async function PersonalInvitation({ params }: { params: Params }) {
  const { slug, token } = await params;
  const [ev, guest, lang] = await Promise.all([loadEvent(slug, null), loadGuest(slug, token), visitorLang()]);
  if (!ev) notFound();
  const view = buildView(ev, "live", ev.slug);
  if (!guest) {
    // enlace desconocido: se muestra la invitación general del evento
    const existing = await ownRsvp(ev.slug);
    return <InvitationPage view={view} initialLang={lang ?? ev.lang} family="" guest={null} initialReservation={toReservation(existing)} />;
  }
  return (
    <InvitationPage
      view={view}
      initialLang={lang ?? guest.lang}
      family={guest.display_name}
      guest={{ token: guest.token, name: guest.display_name }}
      initialReservation={toReservation(guest.rsvp)}
    />
  );
}
