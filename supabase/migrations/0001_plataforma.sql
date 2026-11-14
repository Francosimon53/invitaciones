-- 0001 · Plataforma de invitaciones (varias quinceañeras en un mismo sitio).
-- Vive en el proyecto Supabase `stephanie-xv` junto a la invitación de Stephanie, sin tocar sus tablas ni funciones:
-- todo lo de aquí lleva el prefijo inv_. Las tablas no se leen directo: todo pasa por funciones RPC (security definer).
--
-- Claves:
--   · Simón (panel /admin):            private.settings, fila 'inv_admin_key'.
--   · Cada anfitriona (panel /<evento>/panel): private.inv_event_keys, una por evento (la genera el sitio al crear).

create extension if not exists unaccent with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.settings (key text primary key, value text not null);

-- ------------------------------------------------------------------ tablas

create table if not exists public.inv_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  etsy_order text,
  status text not null default 'nuevo' check (status in ('nuevo', 'en_proceso', 'entregado', 'cancelado')),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inv_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,58}[a-z0-9]$'),
  status text not null default 'borrador' check (status in ('borrador', 'publicada', 'archivada')),
  theme text not null default 'azul' check (theme in ('azul', 'lila', 'rosa', 'esmeralda')),
  lang text not null default 'es' check (lang in ('es', 'en')),
  honoree text not null check (char_length(honoree) between 2 and 40),
  monogram text not null check (char_length(monogram) between 1 and 2),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  time_zone text not null,
  venue text not null check (char_length(venue) between 2 and 80),
  address_line1 text not null check (char_length(address_line1) between 2 and 120),
  address_line2 text not null check (char_length(address_line2) between 2 and 120),
  city_label text not null check (char_length(city_label) between 2 and 60),
  phone text check (phone is null or char_length(phone) <= 30),
  rsvp_deadline timestamptz not null,
  texts jsonb not null default '{}'::jsonb,
  credit boolean not null default false,
  host_name text,
  host_email text,
  host_phone text,
  order_id uuid references public.inv_orders (id) on delete set null,
  cover_paths jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists private.inv_event_keys (
  event_id uuid primary key references public.inv_events (id) on delete cascade,
  host_key text not null unique
);

create table if not exists public.inv_guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.inv_events (id) on delete cascade,
  token text not null unique,
  name_key text not null,
  display_name text not null,
  phone text,
  lang text not null default 'es',
  notes text,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, name_key)
);

create table if not exists public.inv_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.inv_events (id) on delete cascade,
  -- borrar a un invitado del panel borra también su respuesta
  guest_id uuid references public.inv_guests (id) on delete cascade,
  name_key text not null,
  full_name text not null,
  attending boolean not null,
  lang text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists inv_rsvps_guest_idx on public.inv_rsvps (guest_id) where guest_id is not null;
create unique index if not exists inv_rsvps_name_idx on public.inv_rsvps (event_id, name_key) where guest_id is null;
create index if not exists inv_rsvps_event_idx on public.inv_rsvps (event_id);
create index if not exists inv_events_order_idx on public.inv_events (order_id);

alter table public.inv_orders enable row level security;
alter table public.inv_events enable row level security;
alter table public.inv_guests enable row level security;
alter table public.inv_rsvps enable row level security;
revoke all on table public.inv_orders, public.inv_events, public.inv_guests, public.inv_rsvps from anon, authenticated;

-- ------------------------------------------------------------------ ayudantes internos (sin permiso para anon)

create or replace function public.inv_name_key(p_name text)
returns text
language sql stable
set search_path = public, extensions
as $$ select lower(extensions.unaccent(regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g'))) $$;
revoke all on function public.inv_name_key(text) from public, anon, authenticated;

create or replace function public.inv_is_admin(p_key text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(p_key, '') <> '' and p_key = (select value from private.settings where key = 'inv_admin_key')
$$;
revoke all on function public.inv_is_admin(text) from public, anon, authenticated;

create or replace function public.inv_assert_admin(p_key text)
returns void
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.inv_is_admin(p_key) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
end
$$;
revoke all on function public.inv_assert_admin(text) from public, anon, authenticated;

-- id del evento si la clave es la de su anfitriona (o la de Simón); si no, 'unauthorized'
create or replace function public.inv_host_event(p_slug text, p_key text)
returns uuid
language plpgsql stable security definer
set search_path = public
as $$
declare
  v uuid;
begin
  select e.id into v
  from public.inv_events e
  join private.inv_event_keys k on k.event_id = e.id
  where e.slug = p_slug and coalesce(p_key, '') <> '' and (k.host_key = p_key or public.inv_is_admin(p_key));
  if v is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  return v;
end
$$;
revoke all on function public.inv_host_event(text, text) from public, anon, authenticated;

create or replace function public.inv_event_json(e public.inv_events)
returns jsonb
language sql stable
as $$
  select jsonb_build_object(
    'id', e.id, 'slug', e.slug, 'status', e.status, 'theme', e.theme, 'lang', e.lang,
    'honoree', e.honoree, 'monogram', e.monogram, 'starts_at', e.starts_at, 'ends_at', e.ends_at,
    'time_zone', e.time_zone, 'venue', e.venue, 'address_line1', e.address_line1, 'address_line2', e.address_line2,
    'city_label', e.city_label, 'phone', e.phone, 'rsvp_deadline', e.rsvp_deadline, 'texts', e.texts,
    'credit', e.credit, 'cover_paths', e.cover_paths)
$$;
revoke all on function public.inv_event_json(public.inv_events) from public, anon, authenticated;

-- ------------------------------------------------------------------ invitación (público)

-- Evento publicado; un borrador solo con la clave de la anfitriona o la de Simón (vista previa).
create or replace function public.inv_get_event(p_slug text, p_preview_key text default null)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select public.inv_event_json(e)
  from public.inv_events e
  left join private.inv_event_keys k on k.event_id = e.id
  where e.slug = p_slug
    and (e.status = 'publicada'
         or (coalesce(p_preview_key, '') <> '' and (p_preview_key = k.host_key or public.inv_is_admin(p_preview_key))))
$$;
revoke all on function public.inv_get_event(text, text) from public;
grant execute on function public.inv_get_event(text, text) to anon, authenticated;

-- Una sola respuesta por persona, con las mismas reglas que la invitación de Stephanie:
--   · enlace personal: una por invitado; volver a confirmar la actualiza;
--   · mismo teléfono (cookie → p_rsvp_id): se actualiza esa misma, aunque cambie el nombre;
--   · enlace general con el nombre de un invitado de la lista: cuenta como la de ese invitado;
--   · un nombre que ya respondió desde otro teléfono: 'already_confirmed' y no se toca nada.
create or replace function public.inv_save_rsvp(
  p_slug text,
  p_name text,
  p_attending boolean,
  p_lang text default 'es',
  p_user_agent text default null,
  p_guest_token text default null,
  p_rsvp_id uuid default null
) returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_event uuid;
  v_status text;
  v_deadline timestamptz;
  v_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_key text;
  v_lang text := case when p_lang = 'en' then 'en' else 'es' end;
  v_ua text := left(p_user_agent, 300);
  v_guest_id uuid;
  v_own_id uuid;
  v_own_guest uuid;
  v_id uuid;
  v_inserted boolean;
begin
  select id, status, rsvp_deadline into v_event, v_status, v_deadline from public.inv_events where slug = p_slug;
  if v_event is null or v_status <> 'publicada' then
    raise exception 'event_invalid' using errcode = '22023';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 90 then
    raise exception 'name_invalid' using errcode = '22023';
  end if;
  if p_attending is null then
    raise exception 'attending_required' using errcode = '22023';
  end if;
  if now() >= v_deadline then
    raise exception 'rsvp_closed' using errcode = 'P0001';
  end if;
  v_key := public.inv_name_key(v_name);

  if coalesce(p_guest_token, '') <> '' then
    select id into v_guest_id from public.inv_guests where token = p_guest_token and event_id = v_event;
    if v_guest_id is null then
      raise exception 'guest_invalid' using errcode = '22023';
    end if;
    insert into public.inv_rsvps (event_id, guest_id, name_key, full_name, attending, lang, user_agent)
    values (v_event, v_guest_id, v_key, v_name, p_attending, v_lang, v_ua)
    on conflict (guest_id) where guest_id is not null do update set
      name_key = excluded.name_key,
      full_name = excluded.full_name,
      attending = excluded.attending,
      lang = excluded.lang,
      user_agent = excluded.user_agent,
      updated_at = now()
    returning id, (xmax = 0) into v_id, v_inserted;
    return jsonb_build_object('id', v_id, 'full_name', v_name, 'attending', p_attending, 'updated', not v_inserted);
  end if;

  if p_rsvp_id is not null then
    select id, guest_id into v_own_id, v_own_guest from public.inv_rsvps where id = p_rsvp_id and event_id = v_event;
  end if;
  if v_own_id is not null then
    if v_own_guest is null and exists (
      select 1 from public.inv_rsvps
      where event_id = v_event and guest_id is null and name_key = v_key and id <> v_own_id
    ) then
      raise exception 'already_confirmed' using errcode = 'P0001';
    end if;
    update public.inv_rsvps set
      name_key = v_key, full_name = v_name, attending = p_attending, lang = v_lang, user_agent = v_ua, updated_at = now()
    where id = v_own_id;
    return jsonb_build_object('id', v_own_id, 'full_name', v_name, 'attending', p_attending, 'updated', true);
  end if;

  select id into v_guest_id from public.inv_guests where event_id = v_event and name_key = v_key;
  if v_guest_id is not null then
    insert into public.inv_rsvps (event_id, guest_id, name_key, full_name, attending, lang, user_agent)
    values (v_event, v_guest_id, v_key, v_name, p_attending, v_lang, v_ua)
    on conflict (guest_id) where guest_id is not null do nothing
    returning id into v_id;
    if v_id is null then
      raise exception 'already_confirmed' using errcode = 'P0001';
    end if;
    return jsonb_build_object('id', v_id, 'full_name', v_name, 'attending', p_attending, 'updated', false);
  end if;

  insert into public.inv_rsvps (event_id, name_key, full_name, attending, lang, user_agent)
  values (v_event, v_key, v_name, p_attending, v_lang, v_ua)
  on conflict (event_id, name_key) where guest_id is null do nothing
  returning id into v_id;
  if v_id is null then
    raise exception 'already_confirmed' using errcode = 'P0001';
  end if;
  return jsonb_build_object('id', v_id, 'full_name', v_name, 'attending', p_attending, 'updated', false);
end
$$;
revoke all on function public.inv_save_rsvp(text, text, boolean, text, text, text, uuid) from public;
grant execute on function public.inv_save_rsvp(text, text, boolean, text, text, text, uuid) to anon, authenticated;

create or replace function public.inv_get_rsvp(p_slug text, p_id uuid)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object('id', r.id, 'full_name', r.full_name, 'attending', r.attending, 'updated_at', r.updated_at)
  from public.inv_rsvps r
  join public.inv_events e on e.id = r.event_id
  where r.id = p_id and e.slug = p_slug
$$;
revoke all on function public.inv_get_rsvp(text, uuid) from public;
grant execute on function public.inv_get_rsvp(text, uuid) to anon, authenticated;

create or replace function public.inv_get_guest(p_slug text, p_token text)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', g.id, 'token', g.token, 'display_name', g.display_name, 'lang', g.lang, 'cover_path', g.cover_path,
    'rsvp', case when r.id is null then null else jsonb_build_object(
      'id', r.id, 'full_name', r.full_name, 'attending', r.attending, 'updated_at', r.updated_at) end)
  from public.inv_guests g
  join public.inv_events e on e.id = g.event_id
  left join public.inv_rsvps r on r.guest_id = g.id
  where g.token = p_token and e.slug = p_slug
$$;
revoke all on function public.inv_get_guest(text, text) from public;
grant execute on function public.inv_get_guest(text, text) to anon, authenticated;

-- ------------------------------------------------------------------ pedido (formulario de la compradora de Etsy)

create or replace function public.inv_submit_order(p_data jsonb, p_etsy_order text default null)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_code text;
  v_alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_etsy text := nullif(regexp_replace(coalesce(p_etsy_order, ''), '\D', '', 'g'), '');
  i integer;
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' or char_length(p_data::text) > 12000 then
    raise exception 'order_invalid' using errcode = '22023';
  end if;
  if v_etsy is not null and char_length(v_etsy) not between 5 and 15 then
    raise exception 'etsy_invalid' using errcode = '22023';
  end if;
  -- freno contra abuso: un sitio pequeño no recibe más de 30 pedidos por hora
  if (select count(*) from public.inv_orders where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'busy' using errcode = 'P0001';
  end if;
  loop
    v_bytes := extensions.gen_random_bytes(6);
    v_code := '';
    for i in 0..5 loop
      v_code := v_code || substr(v_alphabet, 1 + (get_byte(v_bytes, i) % 31), 1);
    end loop;
    exit when not exists (select 1 from public.inv_orders where code = v_code);
  end loop;
  insert into public.inv_orders (code, etsy_order, data) values (v_code, v_etsy, p_data);
  return jsonb_build_object('code', v_code);
end
$$;
revoke all on function public.inv_submit_order(jsonb, text) from public;
grant execute on function public.inv_submit_order(jsonb, text) to anon, authenticated;

-- ------------------------------------------------------------------ panel de la anfitriona

create or replace function public.inv_check_host_key(p_slug text, p_key text)
returns boolean
language plpgsql stable security definer
set search_path = public
as $$
begin
  perform public.inv_host_event(p_slug, p_key);
  return true;
exception when others then
  return false;
end
$$;
revoke all on function public.inv_check_host_key(text, text) from public;
grant execute on function public.inv_check_host_key(text, text) to anon, authenticated;

create or replace function public.inv_list_rsvps(p_slug text, p_key text)
returns table (
  id uuid, full_name text, attending boolean, lang text, guest_id uuid, created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_event uuid := public.inv_host_event(p_slug, p_key);
begin
  return query
    select r.id, r.full_name, r.attending, r.lang, r.guest_id, r.created_at, r.updated_at
    from public.inv_rsvps r where r.event_id = v_event
    order by r.updated_at desc;
end
$$;
revoke all on function public.inv_list_rsvps(text, text) from public;
grant execute on function public.inv_list_rsvps(text, text) to anon, authenticated;

create or replace function public.inv_list_guests(p_slug text, p_key text)
returns table (
  id uuid, token text, display_name text, phone text, lang text, notes text, created_at timestamptz, cover_path text,
  rsvp_id uuid, attending boolean, responded_at timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_event uuid := public.inv_host_event(p_slug, p_key);
begin
  return query
    select g.id, g.token, g.display_name, g.phone, g.lang, g.notes, g.created_at, g.cover_path,
           r.id, r.attending, r.updated_at
    from public.inv_guests g
    left join public.inv_rsvps r on r.guest_id = g.id
    where g.event_id = v_event
    order by g.display_name;
end
$$;
revoke all on function public.inv_list_guests(text, text) from public;
grant execute on function public.inv_list_guests(text, text) to anon, authenticated;

-- Crea o actualiza invitados por nombre; en uno que ya existe solo cambia lo que trae la línea.
create or replace function public.inv_import_guests(p_slug text, p_key text, p_rows jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_event uuid := public.inv_host_event(p_slug, p_key);
  v_row jsonb;
  v_name text;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_skipped integer := 0;
  v_is_insert boolean;
  v_lang_given boolean;
begin
  if jsonb_array_length(coalesce(p_rows, '[]'::jsonb)) > 600 then
    raise exception 'too_many' using errcode = '22023';
  end if;
  for v_row in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    v_name := regexp_replace(btrim(coalesce(v_row->>'display_name', '')), '\s+', ' ', 'g');
    if char_length(v_name) < 2 or char_length(v_name) > 80 or coalesce(v_row->>'token', '') !~ '^[a-z0-9]{6,32}$' then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    v_lang_given := coalesce((v_row->>'lang_given')::boolean, true);
    insert into public.inv_guests (event_id, token, name_key, display_name, phone, lang)
    values (
      v_event,
      v_row->>'token',
      public.inv_name_key(v_name),
      v_name,
      nullif(left(btrim(coalesce(v_row->>'phone', '')), 30), ''),
      case when v_row->>'lang' = 'en' then 'en' else 'es' end
    )
    on conflict (event_id, name_key) do update set
      display_name = excluded.display_name,
      phone = coalesce(excluded.phone, public.inv_guests.phone),
      lang = case when v_lang_given then excluded.lang else public.inv_guests.lang end,
      updated_at = now()
    returning (xmax = 0) into v_is_insert;
    if v_is_insert then v_inserted := v_inserted + 1; else v_updated := v_updated + 1; end if;
  end loop;
  return jsonb_build_object('inserted', v_inserted, 'updated', v_updated, 'skipped', v_skipped);
end
$$;
revoke all on function public.inv_import_guests(text, text, jsonb) from public;
grant execute on function public.inv_import_guests(text, text, jsonb) to anon, authenticated;

create or replace function public.inv_delete_guest(p_slug text, p_key text, p_id uuid)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_event uuid := public.inv_host_event(p_slug, p_key);
begin
  delete from public.inv_guests where id = p_id and event_id = v_event;
  return found;
end
$$;
revoke all on function public.inv_delete_guest(text, text, uuid) from public;
grant execute on function public.inv_delete_guest(text, text, uuid) to anon, authenticated;

create or replace function public.inv_set_guest_cover(p_slug text, p_key text, p_token text, p_path text)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_event uuid := public.inv_host_event(p_slug, p_key);
begin
  update public.inv_guests set cover_path = p_path where token = p_token and event_id = v_event;
  return found;
end
$$;
revoke all on function public.inv_set_guest_cover(text, text, text, text) from public;
grant execute on function public.inv_set_guest_cover(text, text, text, text) to anon, authenticated;

-- ------------------------------------------------------------------ panel de Simón

create or replace function public.inv_check_admin_key(p_key text)
returns boolean
language sql stable security definer
set search_path = public
as $$ select public.inv_is_admin(p_key) $$;
revoke all on function public.inv_check_admin_key(text) from public;
grant execute on function public.inv_check_admin_key(text) to anon, authenticated;

create or replace function public.inv_list_orders(p_key text)
returns setof jsonb
language plpgsql stable security definer
set search_path = public
as $$
begin
  perform public.inv_assert_admin(p_key);
  return query
    select jsonb_build_object(
      'id', o.id, 'code', o.code, 'etsy_order', o.etsy_order, 'status', o.status, 'data', o.data,
      'event_id', e.id, 'event_slug', e.slug, 'created_at', o.created_at, 'updated_at', o.updated_at)
    from public.inv_orders o
    left join lateral (select id, slug from public.inv_events where order_id = o.id order by created_at limit 1) e on true
    order by o.created_at desc
    limit 300;
end
$$;
revoke all on function public.inv_list_orders(text) from public;
grant execute on function public.inv_list_orders(text) to anon, authenticated;

create or replace function public.inv_set_order_status(p_key text, p_id uuid, p_status text)
returns boolean
language plpgsql security definer
set search_path = public
as $$
begin
  perform public.inv_assert_admin(p_key);
  update public.inv_orders set status = p_status, updated_at = now() where id = p_id;
  return found;
end
$$;
revoke all on function public.inv_set_order_status(text, uuid, text) from public;
grant execute on function public.inv_set_order_status(text, uuid, text) to anon, authenticated;

create or replace function public.inv_admin_event_json(e public.inv_events)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select public.inv_event_json(e) || jsonb_build_object(
    'host_key', k.host_key, 'host_name', e.host_name, 'host_email', e.host_email, 'host_phone', e.host_phone,
    'order_id', e.order_id, 'created_at', e.created_at, 'updated_at', e.updated_at,
    'guests', (select count(*) from public.inv_guests g where g.event_id = e.id),
    'responses', (select count(*) from public.inv_rsvps r where r.event_id = e.id),
    'yes', (select count(*) from public.inv_rsvps r where r.event_id = e.id and r.attending))
  from private.inv_event_keys k where k.event_id = e.id
$$;
revoke all on function public.inv_admin_event_json(public.inv_events) from public, anon, authenticated;

create or replace function public.inv_list_events(p_key text)
returns setof jsonb
language plpgsql stable security definer
set search_path = public
as $$
begin
  perform public.inv_assert_admin(p_key);
  return query select public.inv_admin_event_json(e) from public.inv_events e order by e.starts_at;
end
$$;
revoke all on function public.inv_list_events(text) from public;
grant execute on function public.inv_list_events(text) to anon, authenticated;

create or replace function public.inv_get_event_admin(p_key text, p_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  perform public.inv_assert_admin(p_key);
  select public.inv_admin_event_json(e) into v from public.inv_events e where e.id = p_id;
  return v;
end
$$;
revoke all on function public.inv_get_event_admin(text, uuid) from public;
grant execute on function public.inv_get_event_admin(text, uuid) to anon, authenticated;

-- Crea (sin id) o actualiza (con id) un evento. Al crear, guarda la clave de la anfitriona que manda el sitio.
-- Al publicar un evento que viene de un pedido, el pedido pasa a 'entregado'.
create or replace function public.inv_save_event(p_key text, p_event jsonb)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid := nullif(p_event->>'id', '')::uuid;
  v_order uuid := nullif(p_event->>'order_id', '')::uuid;
  v_status text := coalesce(p_event->>'status', 'borrador');
  v_row public.inv_events;
begin
  perform public.inv_assert_admin(p_key);
  if v_id is null then
    if coalesce(p_event->>'host_key', '') !~ '^[a-z0-9]{12,40}$' then
      raise exception 'host_key_invalid' using errcode = '22023';
    end if;
    insert into public.inv_events (
      slug, status, theme, lang, honoree, monogram, starts_at, ends_at, time_zone, venue, address_line1, address_line2,
      city_label, phone, rsvp_deadline, texts, credit, host_name, host_email, host_phone, order_id)
    values (
      p_event->>'slug', v_status, p_event->>'theme', p_event->>'lang', p_event->>'honoree', p_event->>'monogram',
      (p_event->>'starts_at')::timestamptz, (p_event->>'ends_at')::timestamptz, p_event->>'time_zone', p_event->>'venue',
      p_event->>'address_line1', p_event->>'address_line2', p_event->>'city_label', nullif(p_event->>'phone', ''),
      (p_event->>'rsvp_deadline')::timestamptz, coalesce(p_event->'texts', '{}'::jsonb), coalesce((p_event->>'credit')::boolean, false),
      nullif(p_event->>'host_name', ''), nullif(p_event->>'host_email', ''), nullif(p_event->>'host_phone', ''), v_order)
    returning * into v_row;
    insert into private.inv_event_keys (event_id, host_key) values (v_row.id, p_event->>'host_key');
  else
    update public.inv_events set
      slug = p_event->>'slug', status = v_status, theme = p_event->>'theme', lang = p_event->>'lang',
      honoree = p_event->>'honoree', monogram = p_event->>'monogram',
      starts_at = (p_event->>'starts_at')::timestamptz, ends_at = (p_event->>'ends_at')::timestamptz,
      time_zone = p_event->>'time_zone', venue = p_event->>'venue', address_line1 = p_event->>'address_line1',
      address_line2 = p_event->>'address_line2', city_label = p_event->>'city_label', phone = nullif(p_event->>'phone', ''),
      rsvp_deadline = (p_event->>'rsvp_deadline')::timestamptz, texts = coalesce(p_event->'texts', '{}'::jsonb),
      credit = coalesce((p_event->>'credit')::boolean, false), host_name = nullif(p_event->>'host_name', ''),
      host_email = nullif(p_event->>'host_email', ''), host_phone = nullif(p_event->>'host_phone', ''),
      order_id = coalesce(v_order, order_id), updated_at = now()
    where id = v_id
    returning * into v_row;
    if v_row.id is null then
      raise exception 'event_not_found' using errcode = '22023';
    end if;
  end if;
  if v_row.order_id is not null then
    update public.inv_orders
      set status = case when v_status = 'publicada' then 'entregado' else 'en_proceso' end, updated_at = now()
      where id = v_row.order_id and status <> 'cancelado';
  end if;
  return public.inv_admin_event_json(v_row);
end
$$;
revoke all on function public.inv_save_event(text, jsonb) from public;
grant execute on function public.inv_save_event(text, jsonb) to anon, authenticated;

create or replace function public.inv_set_event_covers(p_key text, p_id uuid, p_paths jsonb)
returns boolean
language plpgsql security definer
set search_path = public
as $$
begin
  perform public.inv_assert_admin(p_key);
  update public.inv_events set cover_paths = coalesce(p_paths, '{}'::jsonb) where id = p_id;
  return found;
end
$$;
revoke all on function public.inv_set_event_covers(text, uuid, jsonb) from public;
grant execute on function public.inv_set_event_covers(text, uuid, jsonb) to anon, authenticated;

-- ------------------------------------------------------------------ portadas (vista previa de WhatsApp)

-- Bucket público, solo JPEG, máximo 400 KB. Escritura solo de archivos <evento>/<nombre>-<versión>.jpg (sin update ni delete).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inv-covers', 'inv-covers', true, 409600, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 409600, allowed_mime_types = array['image/jpeg'];

-- Sin regla SELECT a propósito: al ser público, cada portada se lee por su URL directa; una regla SELECT solo
-- serviría para que cualquiera listara los archivos (ver 0004).
drop policy if exists "inv_covers_public_read" on storage.objects;

drop policy if exists "inv_covers_insert_named" on storage.objects;
create policy "inv_covers_insert_named" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'inv-covers' and name ~ '^[a-z0-9][a-z0-9-]{2,58}[a-z0-9]/[a-z0-9-]{4,40}-[0-9a-f]{8}\.jpg$');
