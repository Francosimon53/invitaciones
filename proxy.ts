import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * El panel de Simón se abre con /admin?key=<clave>. Para no escribirla cada vez en el teléfono, la clave con la que
 * se entra queda en una cookie del navegador (un año, no la lee ningún script) y /admin sin clave vuelve a entrar con ella.
 * La clave se sigue comprobando en cada página: una cookie con una clave vieja o mala solo lleva a la pantalla de acceso.
 */
const COOKIE = "sm_admin";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  if (request.method !== "GET") return NextResponse.next();

  const url = request.nextUrl;
  const key = url.searchParams.get("key");
  const saved = request.cookies.get(COOKIE)?.value;

  if (key) {
    const response = NextResponse.next();
    if (key.length <= 200 && key !== saved) {
      response.cookies.set(COOKIE, key, {
        httpOnly: true,
        secure: url.protocol === "https:",
        sameSite: "lax",
        path: "/admin",
        maxAge: ONE_YEAR,
      });
    }
    return response;
  }

  if (saved) {
    const target = url.clone();
    target.searchParams.set("key", saved);
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
