-- Estilos nuevos (14 nov 2026): siete de noche con movimiento propio y ocho de día en primavera.
-- Solo amplía la lista de estilos permitidos de inv_events; no toca datos.
alter table public.inv_events drop constraint if exists inv_events_theme_check;
alter table public.inv_events add constraint inv_events_theme_check check (theme in (
  'azul', 'lila', 'rosa', 'esmeralda',
  'petalos', 'rosas', 'aurora', 'luciernagas', 'mariposas', 'linternas', 'oro',
  'rosapalo', 'cerezos', 'lavanda', 'azulcielo', 'salvia', 'atardecer', 'tulipanes', 'buganvilias'
));
