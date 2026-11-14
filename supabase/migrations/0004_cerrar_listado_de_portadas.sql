-- 0004 · Cerrar el listado público de portadas.
-- Los buckets `covers` (invitación de Stephanie) e `inv-covers` son públicos: cada portada se lee por su URL directa
-- sin necesidad de una regla SELECT. Esa regla solo permitía que cualquiera, con la clave publicable, listara los
-- archivos, cuyos nombres llevan el enlace del evento y el código personal de cada invitado.
-- Subir portadas (INSERT) no cambia. Aplicada en producción el 14 nov 2026.
drop policy if exists "inv_covers_public_read" on storage.objects;
drop policy if exists "covers_public_read" on storage.objects;
