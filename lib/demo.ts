/**
 * Invitaciones de muestra (una por estilo): las que se enlazan desde Etsy y salen en las fotos de las fichas.
 * No tocan la base de datos; la confirmación se simula. Todos los datos son ficticios
 * (el 555-01xx está reservado para ficción en EE. UU.).
 */
import type { EventData } from "./event";
import type { ThemeKey } from "./themes";

export function demoEvent(theme: ThemeKey): EventData {
  return {
    id: `demo-${theme}`,
    slug: `demo/${theme}`,
    status: "publicada",
    theme,
    lang: "es",
    honoree: "Valentina",
    monogram: "V",
    // sábado 15 de mayo de 2027, 7:00 PM a 12:00 AM, hora del centro
    startsAt: "2027-05-15T19:00:00-05:00",
    endsAt: "2027-05-16T00:00:00-05:00",
    timeZone: "America/Chicago",
    venue: "Salón Gran Jardín",
    addressLine1: "2500 Avenida de las Flores",
    addressLine2: "Houston, TX 77002",
    cityLabel: "Houston, Texas",
    phone: "(555) 012-3456",
    rsvpDeadline: "2027-05-01T00:00:00-05:00",
    texts: {},
    credit: true,
    coverPaths: {},
  };
}
