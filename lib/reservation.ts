import type { ExistingRsvp } from "./types";

export interface Reservation {
  id: string;
  family: string;
  attending: boolean;
  /** Código corto que ve el invitado (últimos 6 caracteres del id). */
  code: string;
}

/** Cookie con la respuesta propia de este teléfono, una por evento (vale para /<evento> y /<evento>/i/…). */
export const RSVP_COOKIE = "inv_rsvp";

export function reservationCode(id: string): string {
  return id.replace(/-/g, "").slice(-6).toUpperCase();
}

export function toReservation(r: ExistingRsvp | null): Reservation | null {
  if (!r) return null;
  return { id: r.id, family: r.full_name, attending: r.attending, code: reservationCode(r.id) };
}
