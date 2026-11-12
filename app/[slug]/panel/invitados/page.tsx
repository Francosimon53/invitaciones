import type { Metadata } from "next";
import { checkHostKey, getEvent, listGuests } from "@/lib/db";
import { eventLink, formatPhone, inviteMessage, personalLink, whatsappUrl } from "@/lib/invite";
import { guestCoverReady } from "@/lib/covers";
import { first, type SearchParams } from "@/lib/page-helpers";
import { siteUrl } from "@/lib/site-url";
import { THEMES } from "@/lib/themes";
import { PanelNav, KeyGate } from "@/components/PanelNav";
import { CopyButton } from "@/components/CopyButton";
import { GuestImport } from "@/components/GuestImport";
import { CoverSync } from "@/components/CoverSync";
import { deleteGuestAction } from "../actions";

export const dynamic = "force-dynamic";
// la preparación de portadas (acción de servidor de esta página) puede tardar más que lo normal
export const maxDuration = 60;
export const metadata: Metadata = { title: "Invitados · Panel", robots: { index: false, follow: false } };

type Params = Promise<{ slug: string }>;

function status(r: { rsvp_id: string | null; attending: boolean | null }) {
  if (!r.rsvp_id) return { cls: "pending", text: "Sin respuesta" };
  if (r.attending) return { cls: "yes", text: "Asistirá" };
  return { cls: "no", text: "No podrá" };
}

export default async function HostGuests({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const key = first(sp.key);
  const ok = key ? await checkHostKey(slug, key) : false;
  if (!ok) return <KeyGate kicker="XV · Panel" title="Panel de invitados" wrong={Boolean(key)} />;
  const ev = await getEvent(slug, key);
  if (!ev) return <KeyGate kicker="XV · Panel" title="Panel de invitados" wrong />;

  const rows = await listGuests(slug, key);
  const responded = rows.filter((r) => r.rsvp_id).length;
  const attending = rows.filter((r) => r.attending).length;
  const missingCovers = rows.filter((r) => !guestCoverReady(ev, r)).length;
  const site = await siteUrl();
  const generic = eventLink(site, slug);
  const genericMsg = inviteMessage(ev, ev.lang, "", generic);

  return (
    <main className="admin">
      <p className="kicker">
        Los XV de {ev.honoree} · {THEMES[ev.theme].label}
      </p>
      <h1>Invitados y enlaces</h1>
      <PanelNav slug={slug} hostKey={key} active="guests" />
      {ev.status !== "publicada" && <p className="error small">La invitación todavía no está publicada: los enlaces funcionarán cuando se publique.</p>}

      <div className="stats">
        <div className="stat">
          <b>{rows.length}</b>
          <span>Invitaciones</span>
        </div>
        <div className="stat">
          <b>{responded}</b>
          <span>Respondieron</span>
        </div>
        <div className="stat">
          <b>{rows.length - responded}</b>
          <span>Pendientes</span>
        </div>
        <div className="stat">
          <b>{attending}</b>
          <span>Asistirán</span>
        </div>
      </div>

      <div className="actions left">
        <a className="btn" href={`/${slug}/panel/invitados/export?key=${encodeURIComponent(key)}`}>
          Descargar enlaces (CSV)
        </a>
        <CopyButton text={generic} label="Copiar enlace general" />
        <a className="btn" href={whatsappUrl(null, genericMsg)} target="_blank" rel="noopener noreferrer">
          WhatsApp general
        </a>
      </div>
      <p className="muted small">
        El enlace general sirve para quien no esté en la lista. Cada invitado de la lista tiene su propio enlace con su nombre en el sobre y su
        portada personalizada en la vista previa de WhatsApp.
      </p>

      <GuestImport slug={slug} hostKey={key} />

      {rows.length > 0 && (
        <div className="card cover-card">
          <div>
            <h2 className="h3">Portadas para WhatsApp</h2>
            <p className="muted small">
              Al importar se generan solas.{" "}
              {missingCovers === 0 ? "Todas están listas." : `Faltan ${missingCovers}: pulsa para generarlas antes de enviar los enlaces.`}
            </p>
          </div>
          <CoverSync slug={slug} hostKey={key} missing={missingCovers} />
        </div>
      )}

      {rows.length === 0 ? (
        <p className="muted">Todavía no hay invitados. Pega la lista arriba para generar los enlaces.</p>
      ) : (
        <ul className="guest-list">
          {rows.map((r) => {
            const link = personalLink(site, slug, r.token);
            const lang = r.lang === "en" ? "en" : "es";
            const msg = inviteMessage(ev, lang, r.display_name, link);
            const st = status(r);
            const ready = guestCoverReady(ev, r);
            return (
              <li key={r.id} className="card guest-card">
                <div className="guest-head">
                  <div>
                    <p className="guest-name">{r.display_name}</p>
                    <p className="muted small">
                      {formatPhone(r.phone) ?? "sin teléfono"} · {lang.toUpperCase()}
                    </p>
                  </div>
                  <div className="pills">
                    <span className={`pill ${ready ? "cover-ok" : "cover-wait"}`} title="Imagen de la vista previa en WhatsApp">
                      {ready ? "Portada lista" : "Portada pendiente"}
                    </span>
                    <span className={`pill ${st.cls}`}>{st.text}</span>
                  </div>
                </div>
                <p className="guest-link">
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    {link.replace(/^https?:\/\//, "")}
                  </a>
                </p>
                <div className="guest-actions">
                  <a className="btn primary" href={whatsappUrl(r.phone, msg)} target="_blank" rel="noopener noreferrer">
                    Enviar por WhatsApp
                  </a>
                  <CopyButton text={link} />
                  <CopyButton text={msg} label="Copiar mensaje" />
                  <form action={deleteGuestAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="key" value={key} />
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="btn danger" aria-label={`Eliminar a ${r.display_name} y su respuesta`}>
                      Eliminar
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
