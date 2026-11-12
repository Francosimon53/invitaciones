import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Las etiquetas og:* van siempre dentro de <head> (sin streaming): WhatsApp, Telegram, Signal y Mensajes
  // leen solo el HTML inicial y algunos se detienen en </head>.
  htmlLimitedBots: /.*/,
  // las portadas leen del disco el sobre de cada estilo y las fuentes: hay que empaquetarlos con las funciones
  outputFileTracingIncludes: {
    "/**": ["./assets/fonts/**", "./public/themes/*/sobre-og.jpg"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // estilos e imágenes de los estilos y la música: cambian solo con un despliegue nuevo
        source: "/(themes|audio)/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
