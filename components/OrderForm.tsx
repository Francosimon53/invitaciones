"use client";

import { useActionState, useState } from "react";
import { submitOrderAction, type OrderState } from "@/app/pedido/actions";
import { THEMES, THEME_GROUPS, themeAsset } from "@/lib/themes";
import { PHRASES, STATES, stateName } from "@/lib/places";
import { ORDER_TEXT } from "@/lib/order-i18n";
import type { Lang } from "@/lib/i18n";

/** Formulario que llena la compradora de Etsy después de pagar, en español o en inglés. Pide solo lo que la invitación necesita. */
export function OrderForm({ initialStyle, lang }: { initialStyle: string; lang: Lang }) {
  const [state, action, pending] = useActionState<OrderState, FormData>(submitOrderAction, { status: "idle" });
  const [phrase, setPhrase] = useState(PHRASES[0].id);
  const t = ORDER_TEXT[lang];
  const bad = (name: string) => (state.status === "error" && state.fields?.includes(name) ? " invalid" : "");

  if (state.status === "ok") {
    return (
      <div className="card order-done" role="status">
        <p className="kicker">{t.doneKicker}</p>
        <h2 className="h2">{t.doneTitle(state.name)}</h2>
        <p>
          {t.doneCode} <b className="code">{state.code}</b>.
        </p>
        <p className="muted">{t.doneNext}</p>
      </div>
    );
  }

  return (
    <form action={action} className="order" noValidate={false}>
      <input type="text" name="sitio_web" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <input type="hidden" name="idioma" value={lang} />

      <section className="card order-section">
        <h2 className="h3">{t.s1}</h2>
        <label className={`field${bad("etsy")}`}>
          <span>{t.etsy}</span>
          <input name="etsy" inputMode="numeric" autoComplete="off" placeholder={t.etsyPh} required />
          <small className="muted">{t.etsyHelp}</small>
        </label>
      </section>

      <section className="card order-section">
        <h2 className="h3">{t.s2}</h2>
        <p className="muted small">{t.s2Help}</p>
        {THEME_GROUPS.map((g) => (
          <div key={g.key} className="theme-group">
            <h3 className="theme-group-title">{g.label[lang]}</h3>
            <div className={`theme-cards${bad("estilo")}`}>
              {g.themes.map((k) => (
                <label key={k} className="theme-card">
                  <input type="radio" name="estilo" value={k} defaultChecked={k === initialStyle} required />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={themeAsset(k, "sobre.webp")} alt="" loading="lazy" />
                  <span className="theme-name">{lang === "en" ? THEMES[k].labelEn : THEMES[k].label}</span>
                  <span className="muted small">{lang === "en" ? THEMES[k].colorsEn : THEMES[k].colors}</span>
                  <a href={`/demo/${k}?idioma=${lang}`} target="_blank" rel="noopener noreferrer" className="small">
                    {t.sample}
                  </a>
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="card order-section">
        <h2 className="h3">{t.s3}</h2>
        <label className={`field${bad("quinceanera")}`}>
          <span>{t.honoree}</span>
          <input name="quinceanera" maxLength={40} placeholder={t.honoreePh} required />
        </label>
        <div className="grid3">
          <label className={`field${bad("fecha")}`}>
            <span>{t.date}</span>
            <input type="date" name="fecha" required />
          </label>
          <label className={`field${bad("hora_inicio")}`}>
            <span>{t.start}</span>
            <input type="time" name="hora_inicio" defaultValue="19:00" required />
          </label>
          <label className={`field${bad("hora_fin")}`}>
            <span>{t.end}</span>
            <input type="time" name="hora_fin" defaultValue="00:00" required />
          </label>
        </div>
        <label className={`field${bad("salon")}`}>
          <span>{t.venue}</span>
          <input name="salon" maxLength={80} placeholder={t.venuePh} required />
        </label>
        <label className={`field${bad("direccion")}`}>
          <span>{t.address}</span>
          <input name="direccion" maxLength={120} autoComplete="street-address" placeholder={t.addressPh} required />
        </label>
        <div className="grid3">
          <label className={`field${bad("ciudad")}`}>
            <span>{t.city}</span>
            <input name="ciudad" maxLength={60} autoComplete="address-level2" required />
          </label>
          <label className={`field${bad("estado")}`}>
            <span>{t.state}</span>
            <select name="estado" defaultValue="" required>
              <option value="" disabled>
                {t.choose}
              </option>
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {stateName(s, lang)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t.zip}</span>
            <input name="zip" inputMode="numeric" maxLength={10} autoComplete="postal-code" />
          </label>
        </div>
      </section>

      <section className="card order-section">
        <h2 className="h3">{t.s4}</h2>
        <div className="grid2">
          <label className="field">
            <span>{t.phone}</span>
            <input name="telefono_consultas" type="tel" maxLength={30} placeholder={t.phonePh} />
          </label>
          <label className={`field${bad("confirmar_antes")}`}>
            <span>{t.deadline}</span>
            <input type="date" name="confirmar_antes" />
            <small className="muted">{t.deadlineHelp}</small>
          </label>
        </div>
        <label className="field">
          <span>{t.attire}</span>
          <input name="vestimenta" maxLength={200} placeholder={t.attirePh} />
        </label>
        <fieldset className="field phrases">
          <span>{t.phrase}</span>
          {PHRASES.map((p) => (
            <label key={p.id} className="radio">
              <input type="radio" name="frase" value={p.id} checked={phrase === p.id} onChange={() => setPhrase(p.id)} />
              <span>{p[lang]}</span>
            </label>
          ))}
          <label className="radio">
            <input type="radio" name="frase" value="propia" checked={phrase === "propia"} onChange={() => setPhrase("propia")} />
            <span>{t.ownPhrase}</span>
          </label>
          {phrase === "propia" && <textarea name="frase_propia" rows={2} maxLength={160} placeholder={t.ownPhrasePh} />}
        </fieldset>
        <label className="field">
          <span>{t.story}</span>
          <textarea name="historia" rows={3} maxLength={600} placeholder={t.storyPh} />
        </label>
      </section>

      <section className="card order-section">
        <h2 className="h3">{t.s5}</h2>
        <label className={`field${bad("contacto_nombre")}`}>
          <span>{t.yourName}</span>
          <input name="contacto_nombre" maxLength={60} autoComplete="name" required />
        </label>
        <div className="grid2">
          <label className="field">
            <span>{t.whatsapp}</span>
            <input name="contacto_telefono" type="tel" maxLength={30} autoComplete="tel" />
          </label>
          <label className="field">
            <span>{t.email}</span>
            <input name="contacto_email" type="email" maxLength={90} autoComplete="email" />
          </label>
        </div>
        <label className="radio check">
          <input type="checkbox" name="firma" value="si" />
          <span>{t.credit}</span>
        </label>
        <label className="field">
          <span>{t.notes}</span>
          <textarea name="notas" rows={3} maxLength={800} />
        </label>
      </section>

      {state.status === "error" && (
        <p className="error order-error" role="alert">
          {state.message}
        </p>
      )}
      <button className="btn primary block" type="submit" disabled={pending}>
        {pending ? t.sending : t.submit}
      </button>
      <p className="muted small center">{t.privacy}</p>
    </form>
  );
}
