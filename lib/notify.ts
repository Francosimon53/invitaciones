import "server-only";
import type { OrderData } from "./types";
import { SITE_URL } from "./site";

/**
 * Aviso de pedido nuevo por Telegram (opcional). Sin TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID no hace nada:
 * los pedidos siempre quedan en /admin.
 */
export async function notifyNewOrder(code: string, etsy: string, d: OrderData): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const text =
    `🎀 Pedido nuevo ${code}\n` +
    `Etsy #${etsy}\n` +
    `${d.quinceanera} · ${d.fecha} · ${d.ciudad}, ${d.estado}\n` +
    `Estilo: ${d.estilo}\n` +
    `${SITE_URL}/admin`;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(8000),
  });
}
