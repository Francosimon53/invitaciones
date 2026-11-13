import type { Metadata } from "next";
import { OrderForm } from "@/components/OrderForm";
import { first, visitorLang, type SearchParams } from "@/lib/page-helpers";
import { asLang, type Lang } from "@/lib/i18n";
import { asTheme } from "@/lib/themes";
import { BRAND } from "@/lib/site";
import { ORDER_TEXT } from "@/lib/order-i18n";
import "../panel.css";
import "./pedido.css";

/** Idioma del formulario: el que viene en el enlace (?idioma=en desde el PDF), si no el del teléfono, y si no español. */
async function orderLang(sp: Awaited<SearchParams>): Promise<Lang> {
  return asLang(first(sp.idioma) || first(sp.lang)) ?? (await visitorLang()) ?? "es";
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const lang = await orderLang(await searchParams);
  return { title: `${ORDER_TEXT[lang].metaTitle} · ${BRAND}`, robots: { index: false, follow: false } };
}

/** Formulario de la compradora: /pedido (o /pedido?estilo=lila&idioma=en desde el PDF de esa ficha). */
export default async function OrderPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const style = asTheme(first(sp.estilo)) ?? "";
  const lang = await orderLang(sp);
  const t = ORDER_TEXT[lang];
  const href = (l: Lang) => `/pedido?${new URLSearchParams({ ...(style ? { estilo: style } : {}), idioma: l }).toString()}`;
  return (
    <div className="admin-body">
      <main className="admin order-page" lang={lang}>
        <nav className="order-lang" aria-label={t.langLabel}>
          <a href={href("es")} hrefLang="es" lang="es" aria-current={lang === "es" ? "page" : undefined}>
            Español
          </a>
          <a href={href("en")} hrefLang="en" lang="en" aria-current={lang === "en" ? "page" : undefined}>
            English
          </a>
        </nav>
        <p className="kicker">
          {BRAND} · {t.kicker}
        </p>
        <h1>{t.title}</h1>
        <p className="muted">{t.intro}</p>
        {/* key: al cambiar de idioma el formulario arranca limpio con sus textos */}
        <OrderForm key={lang} initialStyle={style} lang={lang} />
      </main>
    </div>
  );
}
