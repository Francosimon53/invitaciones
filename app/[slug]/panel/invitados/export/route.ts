import { checkHostKey, getEvent, listGuests } from "@/lib/db";
import { inviteMessage, personalLink } from "@/lib/invite";
import { csvResponse } from "@/lib/csv";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!key || !(await checkHostKey(slug, key))) return new Response("unauthorized", { status: 401 });
  const ev = await getEvent(slug, key);
  if (!ev) return new Response("not found", { status: 404 });
  const rows = await listGuests(slug, key);
  return csvResponse(
    ["Nombre", "Teléfono", "Idioma", "Enlace", "Mensaje", "Estado", "Respondió"],
    rows.map((r) => {
      const link = personalLink(SITE_URL, slug, r.token);
      const lang = r.lang === "en" ? "en" : "es";
      return [
        r.display_name,
        r.phone ?? "",
        lang,
        link,
        inviteMessage(ev, lang, r.display_name, link),
        !r.rsvp_id ? "Sin respuesta" : r.attending ? "Sí" : "No",
        r.responded_at ? new Date(r.responded_at).toLocaleString("es-US", { timeZone: ev.timeZone }) : "",
      ];
    }),
    `invitados-${slug}-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}
