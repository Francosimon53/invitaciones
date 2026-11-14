import { THEMES, THEME_GROUPS, themeAsset } from "@/lib/themes";
import { BRAND, SHOP_URL } from "@/lib/site";
import "./panel.css";
import "./landing.css";

/** Portada del sitio: qué es, las muestras de cada estilo y dónde pedirla. Los invitados nunca pasan por aquí. */
export default function Home() {
  return (
    <div className="admin-body">
      <main className="landing">
        <p className="kicker">{BRAND}</p>
        <h1>Invitaciones digitales de XV años</h1>
        <p className="lead">
          Un sobre que se abre con música, la información completa de la fiesta y la confirmación de asistencia en el mismo enlace. Cada invitado
          recibe la suya con su nombre en el sobre, y se abre sola en español o en inglés según su teléfono.
        </p>
        <ul className="features">
          <li>Confirmación de asistencia con lista en tiempo real</li>
          <li>Un enlace con el nombre de cada invitado, listo para WhatsApp</li>
          <li>Bilingüe: español e inglés</li>
          <li>Cuenta regresiva, mapa y «añadir al calendario»</li>
        </ul>
        {THEME_GROUPS.map((g) => (
          <div key={g.key} className="landing-group">
            <h2 className="landing-group-title">{g.label.es}</h2>
            <div className="landing-cards">
              {g.themes.map((k) => (
                <a key={k} className="landing-card" href={`/demo/${k}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={themeAsset(k, "sobre.webp")} alt={THEMES[k].envelopeAlt.es} loading="lazy" />
                  <span className="theme-name">{THEMES[k].label}</span>
                  <span className="muted small">{THEMES[k].colors} · ver muestra</span>
                </a>
              ))}
            </div>
          </div>
        ))}
        {SHOP_URL && (
          <div className="actions center-actions">
            <a className="btn primary" href={SHOP_URL} target="_blank" rel="noopener noreferrer">
              Pídela en Etsy
            </a>
          </div>
        )}
        <p className="muted small foot">
          ¿Ya compraste? <a href="/pedido">Llena aquí los datos de tu invitación</a>.
        </p>
      </main>
    </div>
  );
}
