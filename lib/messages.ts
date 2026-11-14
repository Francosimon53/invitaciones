/** Mensajes que Simón pega en Etsy, en español o en inglés: revisión del borrador y entrega final. */
import { eventLink, panelLink } from "./invite";

export type MessageLang = "es" | "en";

interface Args {
  siteUrl: string;
  slug: string;
  hostKey: string;
  hostName: string | null;
  honoree: string;
}

function greeting(hostName: string | null, lang: MessageLang): string {
  const first = hostName?.trim().split(/\s+/)[0];
  if (lang === "en") return first ? `Hi, ${first}!` : "Hi!";
  return first ? `¡Hola, ${first}!` : "¡Hola!";
}

/** "Valentina" → "Valentina’s" (mismo estilo que la invitación). */
function possessive(name: string): string {
  return `${name}’s`;
}

export function reviewMessage(a: Args, lang: MessageLang = "es"): string {
  const hi = greeting(a.hostName, lang);
  const link = `${a.siteUrl}/${a.slug}?vista=${a.hostKey}`;
  if (lang === "en") {
    return (
      `${hi} ${possessive(a.honoree)} invitation is ready for you to review 💌\n\n` +
      `Open it here (this is a preview, nobody else can see it yet):\n${link}\n\n` +
      `Please check the names, date, time and address. If you would like to change anything, tell me here; if everything looks right, reply “approved” and I will publish it.`
    );
  }
  return (
    `${hi} Ya está lista la invitación de ${a.honoree} para que la revises 💌\n\n` +
    `Ábrela aquí (es una vista previa, todavía nadie más la ve):\n${link}\n\n` +
    `Revisa nombres, fecha, hora y dirección. Si quieres cambiar algo, dímelo por aquí; si todo está bien, contéstame «aprobada» y la publico.`
  );
}

/** Aviso a la clienta cuando Simón le cambia la clave del panel: el enlace anterior ya no abre. */
export function newPanelMessage(a: Args, lang: MessageLang = "es"): string {
  const hi = greeting(a.hostName, lang);
  const panel = panelLink(a.siteUrl, a.slug, a.hostKey);
  if (lang === "en") {
    return (
      `${hi} For your security, I changed the link to your panel for ${possessive(a.honoree)} invitation 🔒\n\n` +
      `Your new panel (just for you, please do not share it):\n${panel}\n\n` +
      `The previous link no longer works. Your guest list, the links you already sent and the replies stay the same.`
    );
  }
  return (
    `${hi} Por seguridad cambié el enlace de tu panel de la invitación de ${a.honoree} 🔒\n\n` +
    `Tu panel nuevo (solo para ti, no lo compartas):\n${panel}\n\n` +
    `El enlace anterior ya no abre. Tu lista de invitados, los enlaces que ya mandaste y las respuestas siguen igual.`
  );
}

export function deliveryMessage(a: Args, lang: MessageLang = "es"): string {
  const hi = greeting(a.hostName, lang);
  const invitation = eventLink(a.siteUrl, a.slug);
  const panel = panelLink(a.siteUrl, a.slug, a.hostKey);
  if (lang === "en") {
    return (
      `${hi} ${possessive(a.honoree)} invitation is now live 🎉\n\n` +
      `Link for your guests:\n${invitation}\n\n` +
      `Your panel (just for you, please do not share it):\n${panel}\n\n` +
      `In the panel you paste your guest list and it gives you a link with each guest’s name, ready to send by WhatsApp with one button. ` +
      `You can also see who has replied and download the list for Excel. The panel is in Spanish; if you need help with it, just message me here.\n\n` +
      `If you need to change anything, message me here. Thank you for your purchase, and have an unforgettable celebration!`
    );
  }
  return (
    `${hi} La invitación de ${a.honoree} ya está publicada 🎉\n\n` +
    `Enlace para tus invitados:\n${invitation}\n\n` +
    `Tu panel (solo para ti, no lo compartas):\n${panel}\n\n` +
    `En el panel pegas tu lista de invitados y te da un enlace con el nombre de cada uno, listo para mandarlo por WhatsApp con un botón. ` +
    `También ves quién confirmó y puedes descargar la lista en Excel.\n\n` +
    `Si necesitas cambiar algo, escríbeme por aquí. ¡Gracias por tu compra y que sea una celebración inolvidable!`
  );
}
