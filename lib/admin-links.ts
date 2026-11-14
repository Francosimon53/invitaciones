import "server-only";
import { siteUrl } from "./site-url";
import { eventLink, panelLink } from "./invite";
import { deliveryMessage, reviewMessage } from "./messages";
import type { AdminEventRow } from "./types";

export interface SavedLinks {
  invitation: string;
  preview: string;
  panel: string;
  review: string;
  delivery: string;
  /** Los mismos mensajes en inglés, para las compradoras que escriben en inglés. */
  reviewEn: string;
  deliveryEn: string;
}

/** Enlaces y mensajes listos para pegar en Etsy. */
export async function linksFor(ev: AdminEventRow): Promise<SavedLinks> {
  const site = await siteUrl();
  const args = { siteUrl: site, slug: ev.slug, hostKey: ev.host_key, hostName: ev.host_name, honoree: ev.honoree };
  return {
    invitation: eventLink(site, ev.slug),
    preview: `${site}/${ev.slug}?vista=${ev.host_key}`,
    panel: panelLink(site, ev.slug, ev.host_key),
    review: reviewMessage(args),
    delivery: deliveryMessage(args),
    reviewEn: reviewMessage(args, "en"),
    deliveryEn: deliveryMessage(args, "en"),
  };
}
