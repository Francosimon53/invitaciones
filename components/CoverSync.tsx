"use client";

import { useActionState } from "react";
import { syncCoversAction, type CoversState } from "@/app/[slug]/panel/actions";

/** Genera y sube las portadas que falten (las que ve WhatsApp al compartir cada enlace personal). */
export function CoverSync({ slug, hostKey, missing }: { slug: string; hostKey: string; missing: number }) {
  const [state, action, pending] = useActionState<CoversState, FormData>(syncCoversAction, { status: "idle" });
  return (
    <form action={action} className="cover-sync">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="key" value={hostKey} />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Preparando portadas…" : missing > 0 ? `Preparar ${missing} ${missing === 1 ? "portada" : "portadas"}` : "Revisar portadas"}
      </button>
      {state.status === "ok" && (
        <span className="ok small" role="status">
          {state.uploaded} {state.uploaded === 1 ? "portada nueva" : "portadas nuevas"}, {state.ready + state.uploaded} listas
          {state.failed > 0 && <>, {state.failed} con error</>}
          {state.pending > 0 && <>, {state.pending} pendientes (vuelve a pulsar)</>}.
        </span>
      )}
      {state.status === "error" && (
        <span className="error small" role="alert">
          {state.message}
        </span>
      )}
    </form>
  );
}
