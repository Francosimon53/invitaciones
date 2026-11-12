/** Mensajes que Simón pega en Etsy (en español): revisión del borrador y entrega final. */
import { eventLink, panelLink } from "./invite";

interface Args {
  siteUrl: string;
  slug: string;
  hostKey: string;
  hostName: string | null;
  honoree: string;
}

export function reviewMessage(a: Args): string {
  const hi = a.hostName ? `¡Hola, ${a.hostName.split(" ")[0]}!` : "¡Hola!";
  return (
    `${hi} Ya está lista la invitación de ${a.honoree} para que la revises 💌\n\n` +
    `Ábrela aquí (es una vista previa, todavía nadie más la ve):\n${a.siteUrl}/${a.slug}?vista=${a.hostKey}\n\n` +
    `Revisa nombres, fecha, hora y dirección. Si quieres cambiar algo, dímelo por aquí; si todo está bien, contéstame «aprobada» y la publico.`
  );
}

export function deliveryMessage(a: Args): string {
  const hi = a.hostName ? `¡Hola, ${a.hostName.split(" ")[0]}!` : "¡Hola!";
  return (
    `${hi} La invitación de ${a.honoree} ya está publicada 🎉\n\n` +
    `Enlace para tus invitados:\n${eventLink(a.siteUrl, a.slug)}\n\n` +
    `Tu panel (solo para ti, no lo compartas):\n${panelLink(a.siteUrl, a.slug, a.hostKey)}\n\n` +
    `En el panel pegas tu lista de invitados y te da un enlace con el nombre de cada uno, listo para mandarlo por WhatsApp con un botón. ` +
    `También ves quién confirmó y puedes descargar la lista en Excel.\n\n` +
    `Si necesitas cambiar algo, escríbeme por aquí. ¡Gracias por tu compra y que sea una noche inolvidable!`
  );
}
