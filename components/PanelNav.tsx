export function PanelNav({ slug, hostKey, active }: { slug: string; hostKey: string; active: "rsvps" | "guests" }) {
  const k = encodeURIComponent(hostKey);
  return (
    <nav className="admin-nav" aria-label="Secciones del panel">
      <a className={active === "rsvps" ? "on" : ""} href={`/${slug}/panel?key=${k}`}>
        Confirmaciones
      </a>
      <a className={active === "guests" ? "on" : ""} href={`/${slug}/panel/invitados?key=${k}`}>
        Invitados y enlaces
      </a>
      <a href={`/${slug}?vista=${k}`} target="_blank" rel="noopener noreferrer">
        Ver invitación
      </a>
    </nav>
  );
}

export function KeyGate({ title, kicker, wrong }: { title: string; kicker: string; wrong: boolean }) {
  return (
    <main className="gate">
      <form className="card gate-card" method="get">
        <p className="kicker">{kicker}</p>
        <h1 className="h2">{title}</h1>
        <label className="field">
          <span>Clave de acceso</span>
          <input type="password" name="key" autoComplete="current-password" required />
        </label>
        {wrong && <p className="error">Clave incorrecta.</p>}
        <button className="btn primary block" type="submit">
          Entrar
        </button>
      </form>
    </main>
  );
}
