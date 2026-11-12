# Sobre Mágico · Invitaciones digitales de XV años

El diseño de «Noche invernal» convertido en plataforma: una invitación por quinceañera, en cuatro estilos de color, con
sobre que se abre, música, confirmación de asistencia, enlace personal por invitado con portada para WhatsApp y panel para
la mamá. Se vende en Etsy: la compradora llena un formulario, Simón revisa y publica, y la clienta maneja su lista sola.

- Producción: Vercel (Next.js 16, App Router, TypeScript). Repo conectado: cada push a `main` despliega.
- Datos: Supabase, **proyecto `stephanie-xv`** (el mismo de la invitación de Stephanie, sin tocar sus tablas: aquí todo
  lleva el prefijo `inv_`). **No archivar ese proyecto** mientras haya invitaciones vivas.
- Sin variables obligatorias: la URL y la clave publicable de Supabase viven en `lib/supabase.ts` (la clave publicable está
  hecha para exponerse; los datos los protegen RLS y funciones RPC).

## Rutas

| Quién | Qué | Dónde |
| --- | --- | --- |
| Invitados | Enlace general del evento | `/<evento>` (admite `?familia=Nombre` e `?idioma=es`) |
| Invitados | Enlace personal (nombre en el sobre) | `/<evento>/i/<token>` |
| Clienta (mamá) | Confirmaciones | `/<evento>/panel?key=<clave>` |
| Clienta (mamá) | Invitados, enlaces y WhatsApp | `/<evento>/panel/invitados?key=<clave>` |
| Clienta (mamá) | Vista previa de un borrador | `/<evento>?vista=<clave>` |
| Compradora de Etsy | Formulario de datos | `/pedido` (o `/pedido?estilo=lila`) |
| Simón | Pedidos e invitaciones | `/admin?key=<clave de Simón>` |
| Etsy / fotos | Muestras (no guardan respuestas) | `/demo/azul`, `/demo/lila`, `/demo/rosa`, `/demo/esmeralda` |
| WhatsApp | Portadas | estáticas en Storage (`inv-covers`); si faltan, `/api/cover` |

## Flujo de un pedido

1. Llega la venta en Etsy. El PDF que descarga la compradora la manda a `/pedido`.
2. El pedido aparece en `/admin` (y por Telegram si están `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`).
3. «Crear invitación»: el formulario sale precargado. Revisar, traducir al inglés lo que la clienta escribió
   (frase, palabras, vestimenta) y «Guardar borrador».
4. Copiar el «mensaje de revisión» y pegarlo en Etsy. Cuando la clienta aprueba, «Publicar» y pegar el «mensaje de entrega».
   Al publicar se generan las portadas del enlace general y el pedido pasa a «entregado».
5. La clienta pega su lista en su panel: cada invitado recibe su enlace con su nombre y su portada.

## Idioma

La invitación se abre sola en el idioma del teléfono de quien la abre (si es español o inglés). Orden: `?idioma=` → lo que
eligió en el selector ES/EN → idioma del teléfono → idioma de la lista (enlace personal) o idioma principal del evento.

## Estilos

`scripts/themes/recolor.py` recolorea en OKLCH el diseño base (imágenes y CSS) y genera `public/themes/<estilo>.css` y
`public/themes/<estilo>/`. Solo mueve los tonos fríos del original; las luces cálidas y la nieve se conservan.
Para agregar un estilo: definir sus parámetros en `THEMES` del script, correr `npm run themes`, agregarlo a `lib/themes.ts`
(textos y colores de `scripts/themes/palette.json`) y a la restricción `theme in (...)` de `inv_events`.

## Música

`public/audio/musica.mp3`: canción de Simón hecha en Suno (plan con derechos comerciales). La canción comprada en Apple
Music de la invitación de Stephanie **no** se usa aquí.

## Variables de entorno (todas opcionales)

Ver `.env.example`.

## Base de datos

Migraciones en `supabase/migrations/`. Claves: la de Simón en `private.settings` (`inv_admin_key`); la de cada clienta en
`private.inv_event_keys`, generada al crear el evento. Una respuesta por persona, con las mismas reglas que la invitación de
Stephanie; si alguien confirmó por el enlace general y después se agrega a la lista con el mismo nombre, su respuesta pasa a
ser la de ese invitado.
