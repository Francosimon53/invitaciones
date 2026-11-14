# Sobre Mágico · Invitaciones digitales de XV años

El diseño de «Noche invernal» convertido en plataforma: una invitación por quinceañera, en 19 estilos (4 de invierno, 7 de noche y 8 de día), con
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
| Compradora de Etsy | Formulario de datos en español o inglés | `/pedido` (o `/pedido?estilo=lila&idioma=en`) |
| Simón | Pedidos e invitaciones | `/admin?key=<clave de Simón>`; después de entrar una vez, `/admin` solo: el navegador recuerda la clave un año (`proxy.ts`) |
| Etsy / fotos | Muestras (no guardan respuestas) | `/demo/<estilo>`: una por cada estilo de `lib/themes.ts` (`/demo/azul`, `/demo/aurora`, `/demo/cerezos`…) |
| WhatsApp | Portadas | estáticas en Storage (`inv-covers`); si faltan, `/api/cover` |

## Flujo de un pedido

1. Llega la venta en Etsy. El PDF que descarga la compradora la manda a `/pedido` con su estilo y su idioma (`?idioma=es` o `?idioma=en`; sin el parámetro toma el idioma del teléfono). Arriba del formulario puede cambiar de idioma. Si lo llenó en inglés, el pedido lo dice en `/admin` y sus textos propios llegan a los campos en inglés para traducirlos al español.
2. El pedido aparece en `/admin` y llega un aviso por Telegram. En producción el aviso sale del bot de Manon, con
   `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en Vercel.
3. «Crear invitación»: el formulario sale precargado. Revisar, traducir al otro idioma lo que la clienta escribió
   (frase, palabras, vestimenta) y «Publicar» directo: no hay vista previa para aprobar.
   Al publicar se generan las portadas del enlace general y el pedido pasa a «entregado».
4. Copiar el «mensaje de entrega» (hay versión en español y en inglés) y pegarlo en la conversación del pedido en Etsy. Si después la clienta pide un cambio,
   se corrige en el mismo formulario y el enlace no cambia. El «mensaje de revisión» queda para casos especiales.
5. La clienta pega su lista en su panel: cada invitado recibe su enlace con su nombre y su portada. Ella ve la
   invitación antes que nadie, porque los invitados solo la reciben cuando ella manda los enlaces.
6. Si la clienta comparte por error el enlace de su panel: en `/admin`, «Cambiar clave del panel» en la fila de su
   invitación (pide un segundo toque). El enlace anterior deja de abrir (también la vista previa `?vista=`) y arriba sale el
   nuevo con el aviso para Etsy en español y en inglés. Invitados, enlaces personales y respuestas no cambian.

## Idioma

La invitación se abre sola en el idioma del teléfono de quien la abre (si es español o inglés). Orden: `?idioma=` → lo que
eligió en el selector ES/EN → idioma del teléfono → idioma de la lista (enlace personal) o idioma principal del evento.

## Estilos

Hay 19 estilos en tres familias (`lib/themes.ts`). Por dentro todos son la misma invitación; solo cambia el aspecto.

| Familia | Estilos | Fondo | Movimiento |
| --- | --- | --- | --- |
| Invierno | `azul`, `lila`, `rosa`, `esmeralda` | el castillo nevado, recoloreado | nieve |
| De noche | `petalos`, `rosas`, `aurora`, `luciernagas`, `mariposas`, `linternas`, `oro` | el castillo nevado, recoloreado | pétalos, auroras, luciérnagas, mariposas, linternas, polvo de oro |
| De día | `rosapalo`, `cerezos`, `lavanda`, `azulcielo`, `salvia`, `atardecer`, `tulipanes`, `buganvilias` | un castillo de primavera propio (`scripts/themes/dia/<estilo>.webp`) | pétalos, mariposas, palomas, destellos y rayos de sol |

- `scripts/themes/recolor.py` genera `public/themes/<estilo>.css` y `public/themes/<estilo>/` (castillo, sobre, portada de
  WhatsApp e ícono) y actualiza `scripts/themes/palette.json`. `npm run themes` los rehace todos;
  `python3 scripts/themes/recolor.py rosas lavanda` rehace solo esos.
- Invierno y noche: se recolorea en OKLCH el diseño base. Solo se mueven los tonos fríos; las luces cálidas y la nieve se conservan.
- De día: el sobre pasa a papel claro con filigrana dorada o plateada, y el CSS sale del mismo original con la luminosidad
  invertida (fondo claro, textos oscuros) más un bloque corto de ajustes (`day_extra`). Las tintas de cada estilo están
  medidas contra su cielo: 4.5:1 como mínimo, 3:1 en los textos grandes.
- El movimiento de cada estilo está en `lib/effects.ts` y lo dibuja `components/magic-scene.ts` sobre el mismo lienzo de
  los fuegos artificiales. El botón del encabezado lo pausa y su etiqueta nombra lo que se mueve («Pausar pétalos»).
  Lo que vive en el cielo (estrellas, aurora, rayos, palomas) se apaga al bajar por la invitación.
- Los textos fijos que hablan de noche y de estrellas («Nos vemos bajo las estrellas», «La música de esta noche»…) cambian
  en los estilos de día por otros que sirven a cualquier hora (`lib/i18n.ts`). La frase de la portada es la que elige la clienta.

Para agregar un estilo: definir sus parámetros en `THEMES` o `DAY_THEMES` del script (y, si es de día, poner su castillo
en `scripts/themes/dia/`), correr el script, agregarlo a `lib/themes.ts` (grupo y textos), darle movimiento en
`lib/effects.ts` y sumarlo a la restricción `theme in (...)` de `inv_events` con una migración nueva.

## Música

`public/audio/musica.mp3`: canción de Simón hecha en Suno (plan con derechos comerciales). La canción comprada en Apple
Music de la invitación de Stephanie **no** se usa aquí.

## Variables de entorno (todas opcionales)

Ver `.env.example`.

## Base de datos

Migraciones en `supabase/migrations/`. Claves: la de Simón en `private.settings` (`inv_admin_key`); la de cada clienta en
`private.inv_event_keys`, generada al crear el evento y cambiable desde `/admin` (`inv_change_host_key`, migración `0005`). Una respuesta por persona, con las mismas reglas que la invitación de
Stephanie; si alguien confirmó por el enlace general y después se agrega a la lista con el mismo nombre, su respuesta pasa a
ser la de ese invitado.

Los buckets de portadas (`inv-covers` y `covers`) no tienen regla SELECT a propósito: las portadas se leen por su URL
directa y así nadie puede listar los archivos, cuyos nombres llevan el enlace del evento y el código de cada invitado
(migración `0004`). No volver a crearla.
