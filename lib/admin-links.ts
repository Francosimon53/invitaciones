import "server-only";
import { siteUrl } from "./site-url";
import { eventLink, panelLink } from "./invite";
import { deliveryMessage, newPanelMessage, reviewMessage } from "./messages";
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

export interface PanelChange {
  panel: string;
  message: string;
  messageEn: string;
}

/** Enlace nuevo del panel y el aviso para la clienta, después de cambiarle la clave. */
export async function panelChangeFor(ev: AdminEventRow): Promise<PanelChange> {
  const site = await siteUrl();
  const args = { siteUrl: site, slug: ev.slug, hostKey: ev.host_key, hostName: ev.host_name, honoree: ev.honoree };
  return {
    panel: panelLink(site, ev.slug, ev.host_key),
    message: newPanelMessage(args),
    messageEn: newPanelMessage(args, "en"),
  };
}
