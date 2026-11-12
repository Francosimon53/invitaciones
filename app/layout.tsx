import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { BRAND, SITE_URL } from "@/lib/site";
import { asLang, langFromAcceptLanguage, LANG_CHOICE_COOKIE } from "@/lib/i18n";
import "./fonts.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${BRAND} · Invitaciones digitales de XV años`,
  description: "Invitaciones digitales de XV años con sobre que se abre, música, confirmación de asistencia y un enlace con el nombre de cada invitado.",
  robots: { index: false, follow: false },
  icons: { icon: "/themes/azul/favicon.svg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // mismo orden que las invitaciones (la invitación corrige <html lang> en el navegador si al final usa otro idioma)
  const [jar, hdrs] = await Promise.all([cookies(), headers()]);
  const lang = asLang(jar.get(LANG_CHOICE_COOKIE)?.value) ?? langFromAcceptLanguage(hdrs.get("accept-language")) ?? "es";
  return (
    <html lang={lang} className={`${cormorant.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
