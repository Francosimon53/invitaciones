/** Enlace que no existe. Estilos en línea: así las invitaciones no cargan (ni precargan) la hoja de los paneles. */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "#050f22",
        color: "#d9e2ee",
        fontFamily: "var(--sans)",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <p style={{ letterSpacing: "0.34em", fontSize: 11, color: "#8fb8ff", margin: "0 0 14px" }}>XV</p>
        <h1 style={{ font: "500 34px/1.1 var(--serif)", color: "#f5f8fc", margin: "0 0 12px" }}>No encontramos esta invitación</h1>
        <p style={{ color: "#7f90ab", lineHeight: 1.6 }}>
          Revisa que el enlace esté completo, tal como te lo enviaron.
          <br />
          Please check that the link is complete.
        </p>
      </div>
    </main>
  );
}
