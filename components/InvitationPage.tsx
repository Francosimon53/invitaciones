import type { Lang } from "@/lib/i18n";
import type { Reservation } from "@/lib/reservation";
import { themeCss } from "@/lib/themes";
import type { InvitationView } from "@/lib/view";
import { InvitationApp, type GuestInfo } from "./InvitationApp";

/**
 * Página de invitación: carga la hoja de estilo del estilo elegido (solo en las invitaciones; los paneles no la ven)
 * y monta la invitación. React la sube a <head> y espera a que cargue antes de pintar, así no hay parpadeo sin estilo.
 */
export function InvitationPage(props: {
  view: InvitationView;
  initialLang: Lang;
  family: string;
  guest: GuestInfo | null;
  initialReservation: Reservation | null;
}) {
  return (
    <>
      <link rel="stylesheet" href={themeCss(props.view.theme)} precedence="theme" />
      <link rel="preload" as="image" href={props.view.images.envelope} />
      <InvitationApp {...props} />
    </>
  );
}
