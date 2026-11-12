"use client";

import { useActionState, useState } from "react";
import { submitOrderAction, type OrderState } from "@/app/pedido/actions";
import { THEMES, THEME_KEYS, themeAsset } from "@/lib/themes";
import { PHRASES, STATES } from "@/lib/places";

/** Formulario que llena la compradora de Etsy después de pagar. Pide solo lo que la invitación necesita. */
export function OrderForm({ initialStyle }: { initialStyle: string }) {
  const [state, action, pending] = useActionState<OrderState, FormData>(submitOrderAction, { status: "idle" });
  const [phrase, setPhrase] = useState(PHRASES[0].id);
  const bad = (name: string) => (state.status === "error" && state.fields?.includes(name) ? " invalid" : "");

  if (state.status === "ok") {
    return (
      <div className="card order-done" role="status">
        <p className="kicker">¡Recibido!</p>
        <h2 className="h2">Gracias{state.name ? `, la invitación de ${state.name} ya está en camino` : ""}</h2>
        <p>
          Tu código de pedido es <b className="code">{state.code}</b>.
        </p>
        <p className="muted">
          Te escribiremos por los mensajes de Etsy cuando esté lista para que la revises, normalmente en 1 a 2 días. Si quieres cambiar algo,
          contéstanos por ahí mismo con tu código.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="order" noValidate={false}>
      <input type="text" name="sitio_web" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <section className="card order-section">
        <h2 className="h3">1 · Tu pedido de Etsy</h2>
        <label className={`field${bad("etsy")}`}>
          <span>Número de pedido</span>
          <input name="etsy" inputMode="numeric" autoComplete="off" placeholder="Ej. 3456789012" required />
          <small className="muted">Está en el correo de confirmación de Etsy o en «Compras y reseñas».</small>
        </label>
      </section>

      <section className="card order-section">
        <h2 className="h3">2 · Elige el estilo</h2>
        <p className="muted small">El color va con el vestido de la quinceañera. Toca «ver muestra» para abrirla como la verán tus invitados.</p>
        <div className={`theme-cards${bad("estilo")}`}>
          {THEME_KEYS.map((k) => (
            <label key={k} className="theme-card">
              <input type="radio" name="estilo" value={k} defaultChecked={k === initialStyle} required />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={themeAsset(k, "sobre.webp")} alt="" loading="lazy" />
              <span className="theme-name">{THEMES[k].label}</span>
              <span className="muted small">{THEMES[k].colors}</span>
              <a href={`/demo/${k}`} target="_blank" rel="noopener noreferrer" className="small">
                ver muestra
              </a>
            </label>
          ))}
        </div>
      </section>

      <section className="card order-section">
        <h2 className="h3">3 · La quinceañera y la fiesta</h2>
        <label className={`field${bad("quinceanera")}`}>
          <span>Nombre de la quinceañera</span>
          <input name="quinceanera" maxLength={40} placeholder="Como quieres que aparezca: Valentina" required />
        </label>
        <div className="grid3">
          <label className={`field${bad("fecha")}`}>
            <span>Fecha</span>
            <input type="date" name="fecha" required />
          </label>
          <label className={`field${bad("hora_inicio")}`}>
            <span>Empieza</span>
            <input type="time" name="hora_inicio" defaultValue="19:00" required />
          </label>
          <label className={`field${bad("hora_fin")}`}>
            <span>Termina</span>
            <input type="time" name="hora_fin" defaultValue="00:00" required />
          </label>
        </div>
        <label className={`field${bad("salon")}`}>
          <span>Salón o lugar</span>
          <input name="salon" maxLength={80} placeholder="Salón Gran Jardín" required />
        </label>
        <label className={`field${bad("direccion")}`}>
          <span>Dirección</span>
          <input name="direccion" maxLength={120} autoComplete="street-address" placeholder="2500 Avenida de las Flores" required />
        </label>
        <div className="grid3">
          <label className={`field${bad("ciudad")}`}>
            <span>Ciudad</span>
            <input name="ciudad" maxLength={60} autoComplete="address-level2" required />
          </label>
          <label className={`field${bad("estado")}`}>
            <span>Estado</span>
            <select name="estado" defaultValue="" required>
              <option value="" disabled>
                Elige…
              </option>
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Código postal</span>
            <input name="zip" inputMode="numeric" maxLength={10} autoComplete="postal-code" />
          </label>
        </div>
      </section>

      <section className="card order-section">
        <h2 className="h3">4 · Detalles</h2>
        <div className="grid2">
          <label className="field">
            <span>Teléfono para consultas (opcional)</span>
            <input name="telefono_consultas" type="tel" maxLength={30} placeholder="Sale en la invitación" />
          </label>
          <label className={`field${bad("confirmar_antes")}`}>
            <span>Confirmar antes del (opcional)</span>
            <input type="date" name="confirmar_antes" />
            <small className="muted">Si lo dejas vacío, dos semanas antes de la fiesta.</small>
          </label>
        </div>
        <label className="field">
          <span>Vestimenta y color reservado (opcional)</span>
          <input name="vestimenta" maxLength={200} placeholder="Formal. Por favor, reserva el lila para la quinceañera." />
        </label>
        <fieldset className="field phrases">
          <span>Frase de la portada</span>
          {PHRASES.map((p) => (
            <label key={p.id} className="radio">
              <input type="radio" name="frase" value={p.id} checked={phrase === p.id} onChange={() => setPhrase(p.id)} />
              <span>{p.es}</span>
            </label>
          ))}
          <label className="radio">
            <input type="radio" name="frase" value="propia" checked={phrase === "propia"} onChange={() => setPhrase("propia")} />
            <span>Quiero escribir la mía</span>
          </label>
          {phrase === "propia" && <textarea name="frase_propia" rows={2} maxLength={160} placeholder="Tu frase (la traducimos al inglés)" />}
        </fieldset>
        <label className="field">
          <span>Unas palabras de la quinceañera (opcional)</span>
          <textarea
            name="historia"
            rows={3}
            maxLength={600}
            placeholder="Si lo dejas vacío va: «Quince años de sueños y hermosos recuerdos han escrito mi historia…». La traducimos al inglés."
          />
        </label>
      </section>

      <section className="card order-section">
        <h2 className="h3">5 · Tus datos</h2>
        <label className={`field${bad("contacto_nombre")}`}>
          <span>Tu nombre</span>
          <input name="contacto_nombre" maxLength={60} autoComplete="name" required />
        </label>
        <div className="grid2">
          <label className="field">
            <span>WhatsApp (opcional)</span>
            <input name="contacto_telefono" type="tel" maxLength={30} autoComplete="tel" />
          </label>
          <label className="field">
            <span>Correo (opcional)</span>
            <input name="contacto_email" type="email" maxLength={90} autoComplete="email" />
          </label>
        </div>
        <label className="radio check">
          <input type="checkbox" name="firma" value="si" />
          <span>Acepto que al final de la invitación aparezca una línea discreta «¿Te gustó esta invitación? Pide la tuya».</span>
        </label>
        <label className="field">
          <span>¿Algo más que debamos saber? (opcional)</span>
          <textarea name="notas" rows={3} maxLength={800} />
        </label>
      </section>

      {state.status === "error" && (
        <p className="error order-error" role="alert">
          {state.message}
        </p>
      )}
      <button className="btn primary block" type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar mis datos"}
      </button>
      <p className="muted small center">Tus datos solo se usan para hacer tu invitación.</p>
    </form>
  );
}
