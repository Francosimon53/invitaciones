-- 0005 · Cambiar la clave del panel de una clienta (botón «Cambiar clave del panel» en /admin).
-- Si la clienta comparte por error el enlace de su panel, Simón le cambia la clave: el enlace anterior deja de abrir
-- (también la vista previa ?vista=) y el nuevo se le manda por Etsy. La clave nueva la genera el sitio igual que al crear
-- el evento (16 caracteres al azar); la base solo valida el formato. Invitados, enlaces personales y respuestas no cambian.
create or replace function public.inv_change_host_key(p_key text, p_id uuid, p_host_key text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_row public.inv_events;
begin
  perform public.inv_assert_admin(p_key);
  if coalesce(p_host_key, '') !~ '^[a-z0-9]{12,40}$' then
    raise exception 'host_key_invalid' using errcode = '22023';
  end if;
  select * into v_row from public.inv_events where id = p_id;
  if v_row.id is null then
    raise exception 'event_not_found' using errcode = '22023';
  end if;
  insert into private.inv_event_keys (event_id, host_key) values (v_row.id, p_host_key)
  on conflict (event_id) do update set host_key = excluded.host_key;
  return public.inv_admin_event_json(v_row);
end
$$;
revoke all on function public.inv_change_host_key(text, uuid, text) from public;
grant execute on function public.inv_change_host_key(text, uuid, text) to anon, authenticated;
