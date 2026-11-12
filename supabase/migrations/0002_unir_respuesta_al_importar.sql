-- 0002 · Si alguien confirmó por el enlace general y después la anfitriona lo agrega a la lista con el mismo nombre,
-- su respuesta pasa a ser la de ese invitado (el panel ya no lo muestra «sin respuesta» ni lo cuenta dos veces).

create or replace function public.inv_import_guests(p_slug text, p_key text, p_rows jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_event uuid := public.inv_host_event(p_slug, p_key);
  v_row jsonb;
  v_name text;
  v_key text;
  v_gid uuid;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_skipped integer := 0;
  v_linked integer := 0;
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
    v_key := public.inv_name_key(v_name);
    v_lang_given := coalesce((v_row->>'lang_given')::boolean, true);
    insert into public.inv_guests (event_id, token, name_key, display_name, phone, lang)
    values (
      v_event,
      v_row->>'token',
      v_key,
      v_name,
      nullif(left(btrim(coalesce(v_row->>'phone', '')), 30), ''),
      case when v_row->>'lang' = 'en' then 'en' else 'es' end
    )
    on conflict (event_id, name_key) do update set
      display_name = excluded.display_name,
      phone = coalesce(excluded.phone, public.inv_guests.phone),
      lang = case when v_lang_given then excluded.lang else public.inv_guests.lang end,
      updated_at = now()
    returning id, (xmax = 0) into v_gid, v_is_insert;
    if v_is_insert then v_inserted := v_inserted + 1; else v_updated := v_updated + 1; end if;

    update public.inv_rsvps set guest_id = v_gid
    where event_id = v_event and guest_id is null and name_key = v_key
      and not exists (select 1 from public.inv_rsvps r2 where r2.guest_id = v_gid);
    if found then v_linked := v_linked + 1; end if;
  end loop;
  return jsonb_build_object('inserted', v_inserted, 'updated', v_updated, 'skipped', v_skipped, 'linked', v_linked);
end
$$;
revoke all on function public.inv_import_guests(text, text, jsonb) from public;
grant execute on function public.inv_import_guests(text, text, jsonb) to anon, authenticated;

-- Las respuestas que ya existían por el enlace general con el nombre de un invitado de la lista, unidas a ese invitado.
update public.inv_rsvps r set guest_id = g.id
from public.inv_guests g
where r.guest_id is null and g.event_id = r.event_id and g.name_key = r.name_key
  and not exists (select 1 from public.inv_rsvps r2 where r2.guest_id = g.id);
