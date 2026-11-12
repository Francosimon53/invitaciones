"use server";

import { after } from "next/server";
import { submitOrder } from "@/lib/db";
import { asTheme } from "@/lib/themes";
import { PHRASES, stateByCode } from "@/lib/places";
import type { OrderData } from "@/lib/types";
import { notifyNewOrder } from "@/lib/notify";
import { siteUrl } from "@/lib/site-url";

export type OrderState =
  | { status: "idle" }
  | { status: "ok"; code: string; name: string }
  | { status: "error"; message: string; fields?: string[] };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function text(fd: FormData, name: string, max: number): string {
  return String(fd.get(name) ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function longText(fd: FormData, name: string, max: number): string {
  return String(fd.get(name) ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}

export async function submitOrderAction(_prev: OrderState, fd: FormData): Promise<OrderState> {
  // trampa para bots: un campo oculto que una persona nunca llena
  if (text(fd, "sitio_web", 50)) return { status: "ok", code: "------", name: "" };

  const etsy = text(fd, "etsy", 30).replace(/\D/g, "");
  const estilo = asTheme(text(fd, "estilo", 20));
  const frase = text(fd, "frase", 20);
  const phrase = PHRASES.find((p) => p.id === frase);
  const data: OrderData = {
    contacto: { nombre: text(fd, "contacto_nombre", 60), telefono: text(fd, "contacto_telefono", 30), email: text(fd, "contacto_email", 90) },
    estilo: estilo ?? "",
    quinceanera: text(fd, "quinceanera", 40),
    fecha: text(fd, "fecha", 10),
    hora_inicio: text(fd, "hora_inicio", 5),
    hora_fin: text(fd, "hora_fin", 5),
    salon: text(fd, "salon", 80),
    direccion: text(fd, "direccion", 120),
    ciudad: text(fd, "ciudad", 60),
    estado: text(fd, "estado", 2).toUpperCase(),
    zip: text(fd, "zip", 10),
    telefono_consultas: text(fd, "telefono_consultas", 30),
    confirmar_antes: text(fd, "confirmar_antes", 10),
    vestimenta: longText(fd, "vestimenta", 200),
    frase: phrase ? phrase.es : longText(fd, "frase_propia", 160),
    historia: longText(fd, "historia", 600),
    firma: fd.get("firma") === "si",
    notas: longText(fd, "notas", 800),
  };

  const missing: string[] = [];
  if (etsy.length < 5 || etsy.length > 15) missing.push("etsy");
  if (!estilo) missing.push("estilo");
  if (data.quinceanera.length < 2) missing.push("quinceanera");
  if (!DATE.test(data.fecha)) missing.push("fecha");
  if (!TIME.test(data.hora_inicio)) missing.push("hora_inicio");
  if (!TIME.test(data.hora_fin)) missing.push("hora_fin");
  if (data.salon.length < 2) missing.push("salon");
  if (data.direccion.length < 4) missing.push("direccion");
  if (data.ciudad.length < 2) missing.push("ciudad");
  if (!stateByCode(data.estado)) missing.push("estado");
  if (data.confirmar_antes && !DATE.test(data.confirmar_antes)) missing.push("confirmar_antes");
  if (!data.contacto.nombre) missing.push("contacto_nombre");
  if (missing.length) {
    return { status: "error", message: "Revisa los campos marcados: faltan datos o no tienen el formato correcto.", fields: missing };
  }
  if (DATE.test(data.fecha) && Date.parse(`${data.fecha}T23:59:59Z`) < Date.now()) {
    return { status: "error", message: "La fecha de la fiesta ya pasó. Revísala, por favor.", fields: ["fecha"] };
  }

  try {
    const { code } = await submitOrder(data, etsy);
    const site = await siteUrl();
    after(() => notifyNewOrder(code, etsy, data, site).catch(() => undefined));
    return { status: "ok", code, name: data.quinceanera };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("busy")) return { status: "error", message: "Estamos recibiendo muchos pedidos. Inténtalo de nuevo en unos minutos." };
    console.error("inv_submit_order", msg);
    return { status: "error", message: "No se pudo enviar. Revisa tu conexión e inténtalo de nuevo." };
  }
}
