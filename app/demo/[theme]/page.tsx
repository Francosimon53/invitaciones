import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/InvitationPage";
import { first, visitorLang, type SearchParams } from "@/lib/page-helpers";
import { invitationMetadata } from "@/lib/meta";
import { demoEvent } from "@/lib/demo";
import { buildView } from "@/lib/view";
import { asTheme } from "@/lib/themes";
import { asLang } from "@/lib/i18n";
import { coverVersion } from "@/lib/cover-version";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

type Params = Promise<{ theme: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const theme = asTheme((await params).theme);
  if (!theme) return {};
  const ev = demoEvent(theme);
  const v = coverVersion({ theme, honoree: ev.honoree, forName: null, lang: "es" });
  return invitationMetadata(ev, "es", { url: `${SITE_URL}/demo/${theme}`, cover: `${SITE_URL}/api/cover?demo=${theme}&lang=es&v=${v}` });
}

/** Invitación de muestra de cada estilo (la del enlace de Etsy). La confirmación se simula. */
export default async function DemoInvitation({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ theme: raw }, sp] = await Promise.all([params, searchParams]);
  const theme = asTheme(raw);
  if (!theme) notFound();
  const ev = demoEvent(theme);
  const lang = asLang(first(sp.idioma) || first(sp.lang)) ?? (await visitorLang()) ?? "es";
  const family = (first(sp.familia) || first(sp.family)).slice(0, 90) || (lang === "es" ? "Familia García" : "The Garcia Family");
  return <InvitationPage view={buildView(ev, "demo", `demo/${theme}`)} initialLang={lang} family={family} guest={null} initialReservation={null} />;
}
