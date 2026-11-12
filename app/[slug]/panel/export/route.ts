import { checkHostKey, getEvent, listRsvps } from "@/lib/db";
import { csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!key || !(await checkHostKey(slug, key))) return new Response("unauthorized", { status: 401 });
  const ev = await getEvent(slug, key);
  const tz = ev?.timeZone ?? "America/New_York";
  const fmt = (iso: string) => new Date(iso).toLocaleString("es-US", { timeZone: tz });
  const rows = await listRsvps(slug, key);
  return csvResponse(
    ["Nombre", "Asiste", "Idioma", "Origen", "Primera respuesta", "Última respuesta"],
    rows.map((r) => [r.full_name, r.attending ? "Sí" : "No", r.lang ?? "", r.guest_id ? "Enlace personal" : "Enlace general", fmt(r.created_at), fmt(r.updated_at)]),
    `confirmaciones-${slug}-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}
