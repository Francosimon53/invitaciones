import type { Metadata } from "next";
import { checkAdminKey, listEvents, listOrders } from "@/lib/db";
import { KeyGate } from "@/components/PanelNav";
import { first, type SearchParams } from "@/lib/page-helpers";
import { THEMES, asTheme } from "@/lib/themes";
import { longDate } from "@/lib/event";
import { BRAND } from "@/lib/site";
import { panelChangeFor } from "@/lib/admin-links";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { CopyButton } from "@/components/CopyButton";
import { changeHostKeyAction, setOrderStatusAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Pedidos · ${BRAND}`, robots: { index: false, follow: false } };

const ORDER_STATUS: Record<string, string> = { nuevo: "Nuevo", en_proceso: "En proceso", entregado: "Entregado", cancelado: "Cancelado" };
const ORDER_PILL: Record<string, string> = { nuevo: "pending", en_proceso: "cover-wait", entregado: "yes", cancelado: "no" };

/** Panel de Simón: pedidos que llegan del formulario y las invitaciones creadas. /admin?key=<clave> */
export default async function AdminHome({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const key = first(sp.key);
  const ok = key ? await checkAdminKey(key) : false;
  if (!ok) return <KeyGate kicker={BRAND} title="Pedidos e invitaciones" wrong={Boolean(key)} />;

  const [orders, events] = await Promise.all([listOrders(key), listEvents(key)]);
  const k = encodeURIComponent(key);
  const fresh = orders.filter((o) => o.status === "nuevo").length;
  const fmt = (iso: string) => new Date(iso).toLocaleString("es-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" });
  // después de «Cambiar clave del panel»: el enlace nuevo y el aviso para la clienta
  const changedId = first(sp.clave_nueva);
  const changed = changedId ? (events.find((e) => e.id === changedId) ?? null) : null;
  const change = changed ? await panelChangeFor(changed) : null;
  const changeFailed = Boolean(first(sp.clave_error));

  return (
    <main className="admin">
      <p className="kicker">{BRAND}</p>
      <h1>Pedidos e invitaciones</h1>

      {changed && change && (
        <section className="card order-section saved" role="status">
          <p className="kicker">Clave del panel cambiada</p>
          <p>
            El enlace anterior del panel de {changed.honoree} ya no abre. Mándale a la clienta el nuevo por Etsy; sus invitados,
            enlaces y respuestas siguen igual.
          </p>
          <p className="guest-link">
            Panel nuevo:{" "}
            <a href={change.panel} target="_blank" rel="noopener noreferrer">
              {change.panel}
            </a>
          </p>
          <div className="actions">
            <CopyButton text={change.message} label="Copiar mensaje para Etsy" />
            <CopyButton text={change.messageEn} label="Mensaje en inglés" />
            <CopyButton text={change.panel} label="Copiar solo el enlace" />
          </div>
        </section>
      )}
      {changeFailed && (
        <p className="error" role="alert">
          No se pudo cambiar la clave del panel. Vuelve a intentarlo.
        </p>
      )}

      <div className="stats">
        <div className="stat">
          <b>{fresh}</b>
          <span>Pedidos nuevos</span>
        </div>
        <div className="stat">
          <b>{orders.length}</b>
          <span>Pedidos</span>
        </div>
        <div className="stat">
          <b>{events.filter((e) => e.status === "publicada").length}</b>
          <span>Publicadas</span>
        </div>
      </div>

      <div className="actions left">
        <a className="btn primary" href={`/admin/evento?key=${k}`}>
          Nueva invitación sin pedido
        </a>
        <a className="btn" href={`/admin?key=${k}`}>
          Actualizar
        </a>
        <a className="btn" href="/pedido" target="_blank" rel="noopener noreferrer">
          Ver formulario
        </a>
      </div>

      <section className="admin-section">
        <h2 className="h3">Pedidos</h2>
        {orders.length === 0 ? (
          <p className="muted">Todavía no hay pedidos. El formulario está en /pedido.</p>
        ) : (
          <div className="table-wrap card">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Quinceañera</th>
                  <th>Fiesta</th>
                  <th>Estilo</th>
                  <th>Estado</th>
                  <th>Invitación</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const theme = asTheme(o.data.estilo);
                  return (
                    <tr key={o.id} className="order-row">
                      <td className="nowrap">
                        <b>{o.code}</b>
                        <small className="muted">
                          Etsy #{o.etsy_order ?? "—"}
                          {o.data.idioma === "en" ? " · en inglés" : ""}
                        </small>
                        <small className="muted">{fmt(o.created_at)}</small>
                      </td>
                      <td>
                        {o.data.quinceanera}
                        <small className="muted">{o.data.contacto?.nombre}</small>
                      </td>
                      <td>
                        {o.data.fecha} · {o.data.hora_inicio}
                        <small className="muted">
                          {o.data.salon}, {o.data.ciudad} {o.data.estado}
                        </small>
                      </td>
                      <td>{theme ? THEMES[theme].label : o.data.estilo}</td>
                      <td>
                        <span className={`pill ${ORDER_PILL[o.status]}`}>{ORDER_STATUS[o.status]}</span>
                        <form action={setOrderStatusAction} className="inline-form">
                          <input type="hidden" name="key" value={key} />
                          <input type="hidden" name="id" value={o.id} />
                          <select name="status" defaultValue={o.status} aria-label="Cambiar estado">
                            {Object.entries(ORDER_STATUS).map(([v, label]) => (
                              <option key={v} value={v}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <button className="btn small" type="submit">
                            Cambiar
                          </button>
                        </form>
                      </td>
                      <td className="nowrap">
                        {o.event_id ? (
                          <a className="btn small" href={`/admin/evento?key=${k}&id=${o.event_id}`}>
                            Abrir
                          </a>
                        ) : (
                          <a className="btn small primary" href={`/admin/evento?key=${k}&order=${o.id}`}>
                            Crear invitación
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2 className="h3">Invitaciones</h2>
        {events.length === 0 ? (
          <p className="muted">Todavía no hay invitaciones.</p>
        ) : (
          <div className="table-wrap card">
            <table>
              <thead>
                <tr>
                  <th>Quinceañera</th>
                  <th>Fecha</th>
                  <th>Estilo</th>
                  <th>Estado</th>
                  <th>Invitados</th>
                  <th>Enlaces</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const theme = asTheme(e.theme) ?? "azul";
                  return (
                    <tr key={e.id}>
                      <td>{e.honoree}</td>
                      <td>{longDate({ startsAt: e.starts_at, timeZone: e.time_zone }, "es")}</td>
                      <td>{THEMES[theme].label}</td>
                      <td>
                        <span className={`pill ${e.status === "publicada" ? "yes" : "pending"}`}>{e.status}</span>
                      </td>
                      <td className="nowrap">
                        {e.guests} · {e.yes} sí de {e.responses}
                      </td>
                      <td className="links">
                        <a href={`/${e.slug}?vista=${encodeURIComponent(e.host_key)}`} target="_blank" rel="noopener noreferrer">
                          Invitación
                        </a>
                        <a href={`/${e.slug}/panel?key=${encodeURIComponent(e.host_key)}`} target="_blank" rel="noopener noreferrer">
                          Panel
                        </a>
                        <a href={`/admin/evento?key=${k}&id=${e.id}`}>Editar</a>
                        <form action={changeHostKeyAction} className="inline-form confirm-form">
                          <input type="hidden" name="key" value={key} />
                          <input type="hidden" name="id" value={e.id} />
                          <ConfirmSubmit
                            label="Cambiar clave del panel"
                            confirmLabel="Sí, cambiarla"
                            pendingLabel="Cambiando…"
                            warning="El enlace que tiene la clienta dejará de abrir."
                          />
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
