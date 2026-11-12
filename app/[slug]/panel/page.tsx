import type { Metadata } from "next";
import { checkHostKey, getEvent, listRsvps } from "@/lib/db";
import { PanelNav, KeyGate } from "@/components/PanelNav";
import { first, type SearchParams } from "@/lib/page-helpers";
import { THEMES } from "@/lib/themes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Confirmaciones · Panel", robots: { index: false, follow: false } };

type Params = Promise<{ slug: string }>;

/** Panel de la anfitriona (la mamá): quién confirmó. Se entra con /<evento>/panel?key=<clave>. */
export default async function HostRsvps({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const key = first(sp.key);
  const ok = key ? await checkHostKey(slug, key) : false;
  if (!ok) return <KeyGate kicker="XV · Panel" title="Panel de confirmaciones" wrong={Boolean(key)} />;

  const ev = await getEvent(slug, key);
  if (!ev) return <KeyGate kicker="XV · Panel" title="Panel de confirmaciones" wrong />;
  const rows = await listRsvps(slug, key);
  const yes = rows.filter((r) => r.attending).length;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("es-US", { timeZone: ev.timeZone, dateStyle: "medium", timeStyle: "short" });

  return (
    <main className="admin">
      <p className="kicker">
        Los XV de {ev.honoree} · {THEMES[ev.theme].label}
      </p>
      <h1>Confirmaciones</h1>
      <PanelNav slug={slug} hostKey={key} active="rsvps" />
      {ev.status !== "publicada" && <p className="error small">La invitación todavía no está publicada: los invitados aún no pueden verla.</p>}
      <p className="muted">Actualizado al abrir la página. Hora de {ev.cityLabel}.</p>

      <div className="stats">
        <div className="stat">
          <b>{yes}</b>
          <span>Invitados que sí</span>
        </div>
        <div className="stat">
          <b>{rows.length - yes}</b>
          <span>No podrán</span>
        </div>
        <div className="stat">
          <b>{rows.length}</b>
          <span>Respuestas</span>
        </div>
      </div>

      <div className="actions left">
        <a className="btn" href={`/${slug}/panel/export?key=${encodeURIComponent(key)}`}>
          Descargar CSV (Excel)
        </a>
        <a className="btn" href={`/${slug}/panel?key=${encodeURIComponent(key)}`}>
          Actualizar
        </a>
      </div>

      {rows.length === 0 ? (
        <p className="muted">Todavía no hay respuestas.</p>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Asiste</th>
                <th>Origen</th>
                <th>Última respuesta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.full_name}</td>
                  <td>
                    <span className={`pill ${r.attending ? "yes" : "no"}`}>{r.attending ? "Sí" : "No"}</span>
                  </td>
                  <td className="nowrap">
                    {r.guest_id ? "Enlace personal" : "Enlace general"} · {(r.lang ?? "").toUpperCase()}
                  </td>
                  <td className="nowrap">{fmt(r.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
