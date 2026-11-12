import "server-only";
import { SITE_URL } from "./site";
import { eventLink, panelLink } from "./invite";
import { deliveryMessage, reviewMessage } from "./messages";
import type { AdminEventRow } from "./types";

export interface SavedLinks {
  invitation: string;
  preview: string;
  panel: string;
  review: string;
  delivery: string;
}

/** Enlaces y mensajes listos para pegar en Etsy. */
export function linksFor(ev: AdminEventRow): SavedLinks {
  const args = { siteUrl: SITE_URL, slug: ev.slug, hostKey: ev.host_key, hostName: ev.host_name, honoree: ev.honoree };
  return {
    invitation: eventLink(SITE_URL, ev.slug),
    preview: `${SITE_URL}/${ev.slug}?vista=${ev.host_key}`,
    panel: panelLink(SITE_URL, ev.slug, ev.host_key),
    review: reviewMessage(args),
    delivery: deliveryMessage(args),
  };
}
