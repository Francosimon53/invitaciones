import type { Metadata } from "next";
import { OrderForm } from "@/components/OrderForm";
import { first, type SearchParams } from "@/lib/page-helpers";
import { asTheme } from "@/lib/themes";
import { BRAND } from "@/lib/site";
import "../panel.css";
import "./pedido.css";

export const metadata: Metadata = { title: `Datos de tu invitación · ${BRAND}`, robots: { index: false, follow: false } };

/** Formulario de la compradora: /pedido (o /pedido?estilo=lila desde la ficha de ese estilo). */
export default async function OrderPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const style = asTheme(first(sp.estilo)) ?? "";
  return (
    <div className="admin-body">
      <main className="admin order-page">
        <p className="kicker">{BRAND} · XV años</p>
        <h1>Datos de tu invitación</h1>
        <p className="muted">
          Llena esto una sola vez y nosotros armamos la invitación. Te tomará unos 5 minutos. Todo lo que escribas en español lo traducimos al inglés
          para los invitados que tengan el teléfono en inglés.
        </p>
        <OrderForm initialStyle={style} />
      </main>
    </div>
  );
}
