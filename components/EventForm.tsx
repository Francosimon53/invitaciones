"use client";

import { useActionState } from "react";
import { saveEventAction, type SaveEventState } from "@/app/admin/actions";
import { THEMES, THEME_GROUPS } from "@/lib/themes";
import { TIME_ZONES } from "@/lib/event";
import { CopyButton } from "./CopyButton";

export interface EventFormValues {
  id: string;
  order_id: string;
  slug: string;
  status: string;
  theme: string;
  lang: string;
  honoree: string;
  monogram: string;
  date: string;
  start: string;
  end: string;
  time_zone: string;
  venue: string;
  address_line1: string;
  address_line2: string;
  city_label: string;
  phone: string;
  deadline: string;
  attire_es: string;
  attire_en: string;
  poem_es: string;
  poem_en: string;
  story_es: string;
  story_en: string;
  credit: boolean;
  host_name: string;
  host_email: string;
  host_phone: string;
}

function Field(props: { name: keyof EventFormValues; label: string; v: EventFormValues; type?: string; hint?: string; required?: boolean; max?: number }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input name={props.name} type={props.type ?? "text"} defaultValue={String(props.v[props.name] ?? "")} required={props.required} maxLength={props.max} />
      {props.hint && <small className="muted">{props.hint}</small>}
    </label>
  );
}

function Pair(props: { name: "attire" | "poem" | "story"; label: string; v: EventFormValues; hint: string }) {
  const es = `${props.name}_es` as const;
  const en = `${props.name}_en` as const;
  return (
    <div className="grid2">
      <label className="field">
        <span>{props.label} · español</span>
        <textarea name={es} rows={2} defaultValue={props.v[es]} placeholder={props.hint} />
      </label>
      <label className="field">
        <span>{props.label} · inglés</span>
        <textarea name={en} rows={2} defaultValue={props.v[en]} placeholder="Traducción (pídesela a Claude)" />
      </label>
    </div>
  );
}

/** Crear o editar la invitación de una clienta. Borrador = solo se ve con la clave; Publicar = la ven los invitados. */
export function EventForm({ adminKey, v }: { adminKey: string; v: EventFormValues }) {
  const [state, action, pending] = useActionState<SaveEventState, FormData>(saveEventAction, { status: "idle" });
  const saved = state.status === "ok" ? state.event : null;
  // después de crear, los siguientes guardados editan el mismo evento
  const id = saved?.id ?? v.id;
  const slug = saved?.slug ?? v.slug;

  return (
    <form action={action} className="order event-form">
      <input type="hidden" name="key" value={adminKey} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="order_id" value={v.order_id} />
      <input type="hidden" name="slug" value={slug} />

      <section className="card order-section">
        <h2 className="h3">Estilo e idioma</h2>
        <div className="grid2">
          <label className="field">
            <span>Estilo</span>
            <select name="theme" defaultValue={v.theme || "azul"}>
              {THEME_GROUPS.map((g) => (
                <optgroup key={g.key} label={g.label.es}>
                  {g.themes.map((k) => (
                    <option key={k} value={k}>
                      {THEMES[k].label} · {THEMES[k].colors}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Idioma principal de los invitados</span>
            <select name="lang" defaultValue={v.lang || "es"}>
              <option value="es">Español</option>
              <option value="en">Inglés</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card order-section">
        <h2 className="h3">Quinceañera y fiesta</h2>
        <div className="grid2">
          <Field name="honoree" label="Nombre" v={v} required max={40} />
          <Field name="monogram" label="Inicial del monograma" v={v} max={2} hint="Si la dejas vacía, la primera letra del nombre." />
        </div>
        <div className="grid3">
          <Field name="date" label="Fecha" type="date" v={v} required />
          <Field name="start" label="Empieza" type="time" v={v} required />
          <Field name="end" label="Termina" type="time" v={v} required hint="Si es antes que el inicio, se entiende el día siguiente." />
        </div>
        <label className="field">
          <span>Zona horaria del salón</span>
          <select name="time_zone" defaultValue={v.time_zone || "America/New_York"}>
            {TIME_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
        </label>
        <Field name="venue" label="Salón" v={v} required max={80} />
        <Field name="address_line1" label="Dirección" v={v} required max={120} />
        <div className="grid2">
          <Field name="address_line2" label="Ciudad, estado y ZIP" v={v} required max={120} />
          <Field name="city_label" label="Ciudad para «hora local de…»" v={v} required max={60} />
        </div>
        <div className="grid2">
          <Field name="phone" label="Teléfono para consultas (opcional)" v={v} max={30} />
          <Field name="deadline" label="Confirmar antes del" type="date" v={v} hint="Vacío = dos semanas antes de la fiesta." />
        </div>
      </section>

      <section className="card order-section">
        <h2 className="h3">Textos (vacío = los del diseño)</h2>
        <Pair name="attire" label="Vestimenta" v={v} hint="Por favor, reserva el lila para la quinceañera." />
        <Pair name="poem" label="Frase de la portada" v={v} hint="Una noche para soñar. Un recuerdo para siempre." />
        <Pair name="story" label="Palabras de la quinceañera" v={v} hint="Quince años de sueños y hermosos recuerdos…" />
        <label className="radio check">
          <input type="checkbox" name="credit" defaultChecked={v.credit} />
          <span>Mostrar «¿Te gustó esta invitación? Pide la tuya» (solo si la clienta aceptó).</span>
        </label>
      </section>

      <section className="card order-section">
        <h2 className="h3">Clienta</h2>
        <div className="grid3">
          <Field name="host_name" label="Nombre" v={v} max={80} />
          <Field name="host_phone" label="WhatsApp" v={v} max={30} />
          <Field name="host_email" label="Correo" v={v} max={120} />
        </div>
      </section>

      {state.status === "error" && (
        <p className="error order-error" role="alert">
          {state.message}
        </p>
      )}

      <div className="actions">
        <button className="btn" type="submit" name="status" value="borrador" disabled={pending}>
          {pending ? "Guardando…" : "Guardar borrador"}
        </button>
        <button className="btn primary" type="submit" name="status" value="publicada" disabled={pending}>
          {pending ? "Guardando…" : "Publicar"}
        </button>
      </div>

      {state.status === "ok" && (
        <section className="card order-section saved" role="status">
          <p className="kicker">{state.event.status === "publicada" ? "Publicada" : "Borrador guardado"}</p>
          {state.warnings.map((w) => (
            <p key={w} className="error small">
              {w}
            </p>
          ))}
          <p className="guest-link">
            Invitación:{" "}
            <a href={state.links.invitation} target="_blank" rel="noopener noreferrer">
              {state.links.invitation}
            </a>
          </p>
          <p className="guest-link">
            Vista previa (también para borradores):{" "}
            <a href={state.links.preview} target="_blank" rel="noopener noreferrer">
              abrir
            </a>
          </p>
          <p className="guest-link">
            Panel de la clienta:{" "}
            <a href={state.links.panel} target="_blank" rel="noopener noreferrer">
              abrir
            </a>
          </p>
          <div className="actions">
            <CopyButton text={state.links.review} label="Copiar mensaje de revisión" />
            <CopyButton text={state.links.delivery} label="Copiar mensaje de entrega" />
          </div>
          <div className="actions">
            <CopyButton text={state.links.reviewEn} label="Mensaje de revisión en inglés" />
            <CopyButton text={state.links.deliveryEn} label="Mensaje de entrega en inglés" />
          </div>
          <p className="muted small">Pega el mensaje en la conversación del pedido en Etsy, en el idioma en que te escribe la clienta.</p>
        </section>
      )}
    </form>
  );
}
