import "server-only";
import { headers } from "next/headers";
import { SITE_URL } from "./site";

/**
 * URL pública con la que entró la visita (o la configurada en NEXT_PUBLIC_SITE_URL, que manda).
 * Así los enlaces, las portadas y los mensajes salen con el dominio que se esté usando, sin configurar nada:
 * si se agrega un dominio nuevo al proyecto, todo lo nuevo sale con ese dominio.
 */
export async function siteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return SITE_URL;
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host && /^[a-z0-9.-]+(:\d{2,5})?$/i.test(host)) {
      const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
      const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
      return `${proto.split(",")[0].trim()}://${host}`;
    }
  } catch {
    // fuera de una petición (scripts): el valor configurado
  }
  return SITE_URL;
}
