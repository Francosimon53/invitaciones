/** Formas que devuelven las funciones RPC de Supabase (migración 0001_plataforma.sql). */

export interface ExistingRsvp {
  id: string;
  full_name: string;
  attending: boolean;
  updated_at: string;
}

export interface RsvpRow extends ExistingRsvp {
  lang: string | null;
  guest_id: string | null;
  created_at: string;
}

/** Invitado con enlace personal (lo que ve la invitación). */
export interface Guest {
  id: string;
  token: string;
  display_name: string;
  lang: "es" | "en";
  cover_path: string | null;
  rsvp: ExistingRsvp | null;
}

/** Fila del panel de invitados. */
export interface GuestRow {
  id: string;
  token: string;
  display_name: string;
  phone: string | null;
  lang: string;
  notes: string | null;
  created_at: string;
  cover_path: string | null;
  rsvp_id: string | null;
  attending: boolean | null;
  responded_at: string | null;
}

export interface GuestImportRow {
  token: string;
  display_name: string;
  phone: string | null;
  lang: "es" | "en";
  /** La línea traía idioma: si el invitado ya existe, se actualiza; si no, se conserva el suyo. */
  lang_given: boolean;
}

/** Fila cruda de inv_events tal como la devuelve la base. */
export interface EventRow {
  id: string;
  slug: string;
  status: "borrador" | "publicada" | "archivada";
  theme: string;
  lang: string;
  honoree: string;
  monogram: string;
  starts_at: string;
  ends_at: string;
  time_zone: string;
  venue: string;
  address_line1: string;
  address_line2: string;
  city_label: string;
  phone: string | null;
  rsvp_deadline: string;
  texts: Record<string, Record<string, string>> | null;
  credit: boolean;
  cover_paths: Record<string, string> | null;
}

/** Evento visto desde el panel de Simón: con la clave de la anfitriona, el pedido y los contadores. */
export interface AdminEventRow extends EventRow {
  host_key: string;
  host_name: string | null;
  host_email: string | null;
  host_phone: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
  guests: number;
  responses: number;
  yes: number;
}

export interface OrderData {
  contacto: { nombre: string; telefono: string; email: string };
  estilo: string;
  quinceanera: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  salon: string;
  direccion: string;
  ciudad: string;
  estado: string;
  zip: string;
  telefono_consultas: string;
  confirmar_antes: string;
  vestimenta: string;
  frase: string;
  historia: string;
  firma: boolean;
  notas: string;
  /** Idioma en que la compradora llenó el pedido (los pedidos viejos no lo traen: español). */
  idioma?: "es" | "en";
}

export interface OrderRow {
  id: string;
  code: string;
  etsy_order: string | null;
  status: "nuevo" | "en_proceso" | "entregado" | "cancelado";
  data: OrderData;
  event_id: string | null;
  event_slug: string | null;
  created_at: string;
  updated_at: string;
}
