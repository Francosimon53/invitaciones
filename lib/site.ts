/**
 * URL pública del sitio (enlaces, portadas y calendario). En Vercel sale sola del dominio de producción;
 * NEXT_PUBLIC_SITE_URL manda si existe (por ejemplo, al conectar un dominio propio).
 */
const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || fromVercel || "http://localhost:3000").replace(/\/$/, "");

/** Tienda de Etsy: «Pide la tuya» y la portada del sitio. Vacío = no se muestra. */
export const SHOP_URL = (process.env.NEXT_PUBLIC_SHOP_URL ?? "").trim();

/** Nombre de la marca en la portada del sitio y en los paneles. */
export const BRAND = process.env.NEXT_PUBLIC_BRAND?.trim() || "Sobre Mágico";

/** Palabras que no pueden ser el enlace de un evento (son rutas del sitio). */
export const RESERVED_SLUGS = new Set(["admin", "pedido", "demo", "api", "themes", "audio", "favicon.ico", "robots.txt", "_next"]);
