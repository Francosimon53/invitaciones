"use client";

import { useActionState } from "react";
import { importGuestsAction, type ImportState } from "@/app/[slug]/panel/actions";

export function GuestImport({ slug, hostKey }: { slug: string; hostKey: string }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importGuestsAction, { status: "idle" });
  return (
    <form action={action} className="card import-form">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="key" value={hostKey} />
      <h2 className="h3">Agregar invitados</h2>
      <p className="muted small">
        Una línea por invitado: <code>Nombre; teléfono; idioma</code>. Solo el nombre es obligatorio. El idioma (<code>es</code> o{" "}
        <code>en</code>; si falta, <code>es</code>) es el del mensaje de WhatsApp y la portada: la invitación se abre sola en el idioma del
        teléfono de cada invitado. Si el nombre ya existe, cambia solo lo que escribas y conserva su enlace.
      </p>
      <label className="field">
        <span>Lista</span>
        <textarea
          name="list"
          rows={7}
          required
          placeholder={"Familia Pérez; 713 555 0101\nAna Martínez; +1 305 555 0102; en\nCarlos y María López"}
        />
      </label>
      {state.status === "ok" && (
        <p className="ok" role="status">
          Listo: {state.inserted} nuevos, {state.updated} actualizados, {state.skipped + state.ignored.length} ignorados.
          {state.linked > 0 && <> {state.linked} ya habían confirmado por el enlace general: su respuesta quedó en su nombre.</>}
          {state.ignored.length > 0 && <> Líneas sin nombre válido: {state.ignored.join(" · ")}</>}
        </p>
      )}
      {state.status === "error" && (
        <p className="error" role="alert">
          {state.message}
        </p>
      )}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Generar enlaces"}
      </button>
    </form>
  );
}
