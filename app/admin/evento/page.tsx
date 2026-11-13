import type { Metadata } from "next";
import { checkAdminKey, getEventAdmin, listOrders } from "@/lib/db";
import { KeyGate } from "@/components/PanelNav";
import { EventForm, type EventFormValues } from "@/components/EventForm";
import { first, type SearchParams } from "@/lib/page-helpers";
import { utcToZoned } from "@/lib/event";
import { PHRASES, stateByCode } from "@/lib/places";
import { BRAND } from "@/lib/site";
import type { AdminEventRow, OrderRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata: Metadata = { title: `Invitación · ${BRAND}`, robots: { index: false, follow: false } };

const EMPTY: EventFormValues = {
  id: "",
  order_id: "",
  slug: "",
  status: "borrador",
  theme: "azul",
  lang: "es",
  honoree: "",
  monogram: "",
  date: "",
  start: "19:00",
  end: "00:00",
  time_zone: "America/New_York",
  venue: "",
  address_line1: "",
  address_line2: "",
  city_label: "",
  phone: "",
  deadline: "",
  attire_es: "",
  attire_en: "",
  poem_es: "",
  poem_en: "",
  story_es: "",
  story_en: "",
  credit: false,
  host_name: "",
  host_email: "",
  host_phone: "",
};

function fromEvent(e: AdminEventRow): EventFormValues {
  const start = utcToZoned(e.starts_at, e.time_zone);
  const texts = (e.texts ?? {}) as Record<string, Record<string, string>>;
  return {
    ...EMPTY,
    id: e.id,
    order_id: e.order_id ?? "",
    slug: e.slug,
    status: e.status,
    theme: e.theme,
    lang: e.lang,
    honoree: e.honoree,
    monogram: e.monogram,
    date: start.date,
    start: start.time,
    end: utcToZoned(e.ends_at, e.time_zone).time,
    time_zone: e.time_zone,
    venue: e.venue,
    address_line1: e.address_line1,
    address_line2: e.address_line2,
    city_label: e.city_label,
    phone: e.phone ?? "",
    deadline: utcToZoned(e.rsvp_deadline, e.time_zone).date,
    attire_es: texts.attire?.es ?? "",
    attire_en: texts.attire?.en ?? "",
    poem_es: texts.poem?.es ?? "",
    poem_en: texts.poem?.en ?? "",
    story_es: texts.story?.es ?? "",
    story_en: texts.story?.en ?? "",
    credit: e.credit,
    host_name: e.host_name ?? "",
    host_email: e.host_email ?? "",
    host_phone: e.host_phone ?? "",
  };
}

/** Lo que llenó la compradora, pasado a los campos de la invitación (Simón revisa y traduce lo propio). */
function fromOrder(o: OrderRow): EventFormValues {
  const d = o.data;
  const st = stateByCode(d.estado ?? "");
  const preset = PHRASES.find((p) => p.es === d.frase);
  const isDefaultPhrase = preset?.id === "sonar";
  // pedido llenado en inglés: sus textos propios van al lado en inglés y Simón traduce al español
  const en = d.idioma === "en";
  const own = (text: string) => (en ? { es: "", en: text } : { es: text, en: "" });
  const poem = isDefaultPhrase ? { es: "", en: "" } : preset ? { es: preset.es, en: preset.en } : own(d.frase);
  return {
    ...EMPTY,
    order_id: o.id,
    theme: d.estilo || "azul",
    honoree: d.quinceanera,
    monogram: d.quinceanera.charAt(0).toLocaleUpperCase("es"),
    date: d.fecha,
    start: d.hora_inicio || "19:00",
    end: d.hora_fin || "00:00",
    time_zone: st?.tz ?? "America/New_York",
    venue: d.salon,
    address_line1: d.direccion,
    address_line2: `${d.ciudad}, ${d.estado}${d.zip ? ` ${d.zip}` : ""}`,
    city_label: st ? `${d.ciudad}, ${st.name}` : d.ciudad,
    phone: d.telefono_consultas,
    deadline: d.confirmar_antes,
    attire_es: own(d.vestimenta).es,
    attire_en: own(d.vestimenta).en,
    poem_es: poem.es,
    poem_en: poem.en,
    story_es: own(d.historia).es,
    story_en: own(d.historia).en,
    credit: d.firma,
    host_name: d.contacto?.nombre ?? "",
    host_email: d.contacto?.email ?? "",
    host_phone: d.contacto?.telefono ?? "",
  };
}

export default async function AdminEvent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const key = first(sp.key);
  const ok = key ? await checkAdminKey(key) : false;
  if (!ok) return <KeyGate kicker={BRAND} title="Invitación" wrong={Boolean(key)} />;

  const id = first(sp.id);
  const orderId = first(sp.order);
  let values = EMPTY;
  let order: OrderRow | null = null;
  if (id) {
    const ev = await getEventAdmin(key, id);
    if (ev) values = fromEvent(ev);
  } else if (orderId) {
    order = (await listOrders(key)).find((o) => o.id === orderId) ?? null;
    if (order) values = fromOrder(order);
  }
  if (!order && values.order_id) order = (await listOrders(key)).find((o) => o.id === values.order_id) ?? null;

  return (
    <main className="admin order-page">
      <p className="kicker">
        <a href={`/admin?key=${encodeURIComponent(key)}`} style={{ color: "inherit" }}>
          ← Pedidos
        </a>
      </p>
      <h1>{values.id ? `Invitación de ${values.honoree}` : "Nueva invitación"}</h1>
      {order && (
        <details className="card order-section" open={!values.id}>
          <summary className="h3">
            Pedido {order.code} · Etsy #{order.etsy_order ?? "—"}
          </summary>
          {order.data.idioma === "en" && <p>Pedido llenado en inglés: sus textos propios ya están en los campos en inglés; tradúcelos al español.</p>}
          {order.data.notas && <p>Notas: {order.data.notas}</p>}
          <pre className="muted small" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {JSON.stringify(order.data, null, 2)}
          </pre>
        </details>
      )}
      <EventForm adminKey={key} v={values} />
    </main>
  );
}
