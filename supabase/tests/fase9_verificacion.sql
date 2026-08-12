-- Fase 9 — verificación ejecutable contra el Supabase real de LocalIA.
-- No es un framework de test (no había Node.js disponible en el entorno
-- de desarrollo para ejecutar Vitest/Jest), así que se verifican las
-- reglas de negocio más críticas directamente en Postgres, con limpieza
-- de los datos de prueba al final. Pensado para ejecutarse a mano (SQL
-- editor de Supabase o `psql`) tras cualquier cambio en las funciones de
-- restaurant.*. Última ejecución: 2026-08-12, 8/8 PASS.
--
-- Cubre: recálculo de precio en servidor, transiciones de estado
-- válidas/inválidas, historial automático, aislamiento por site_key,
-- validación de mesa y de disponibilidad de producto.

create temporary table test_results (orden int, test text, resultado text, detalle text);

do $$
declare
  v_cliente_id uuid;
  v_site_key uuid;
  v_mesa_identificador text;
  v_producto_id uuid;
  v_producto_precio integer;
  v_pedido_id uuid;
  v_items_precio integer;
  v_fallo_detectado boolean;
  v_historial_count integer;
  v_carta_fantasma jsonb;
begin
  select id, site_key into v_cliente_id, v_site_key from public.clientes where slug = 'palomita-bar';
  select identificador into v_mesa_identificador from restaurant.mesas
    where cliente_id = v_cliente_id and numero = 1;
  select id, precio_centimos into v_producto_id, v_producto_precio
    from restaurant.productos where cliente_id = v_cliente_id
    order by precio_centimos desc limit 1;

  v_pedido_id := public.crear_pedido_restaurant(
    v_site_key, v_mesa_identificador,
    jsonb_build_array(jsonb_build_object('producto_id', v_producto_id, 'cantidad', 2)),
    'LOCAL', 'PEDIDO DE TEST - Fase 9, se borra al terminar'
  );
  select precio_unitario_centimos into v_items_precio
  from restaurant.pedido_items where pedido_id = v_pedido_id;

  insert into test_results values (1, 'precio recalculado en servidor',
    case when v_items_precio = v_producto_precio then 'PASS' else 'FAIL' end,
    format('guardado=%s vs producto.precio_centimos=%s', v_items_precio, v_producto_precio));

  v_fallo_detectado := false;
  begin
    update restaurant.pedidos set estado = 'READY' where id = v_pedido_id;
  exception when others then
    v_fallo_detectado := true;
  end;
  insert into test_results values (2, 'transicion invalida RECEIVED->READY bloqueada',
    case when v_fallo_detectado then 'PASS' else 'FAIL' end, '');

  update restaurant.pedidos set estado = 'ACCEPTED' where id = v_pedido_id;
  update restaurant.pedidos set estado = 'PREPARING' where id = v_pedido_id;
  update restaurant.pedidos set estado = 'READY' where id = v_pedido_id;
  update restaurant.pedidos set estado = 'DELIVERED' where id = v_pedido_id;
  select count(*) into v_historial_count from restaurant.pedido_estado_historial where pedido_id = v_pedido_id;
  insert into test_results values (3, 'secuencia valida + historial automatico',
    case when v_historial_count = 4 then 'PASS' else 'FAIL' end,
    format('%s transiciones registradas', v_historial_count));

  v_fallo_detectado := false;
  begin
    update restaurant.pedidos set estado = 'RECEIVED' where id = v_pedido_id;
  exception when others then
    v_fallo_detectado := true;
  end;
  insert into test_results values (4, 'DELIVERED->RECEIVED bloqueado (estado terminal)',
    case when v_fallo_detectado then 'PASS' else 'FAIL' end, '');

  insert into test_results values (5, 'get_pedido_publico refleja el estado',
    case when (public.get_pedido_publico(v_pedido_id)->>'estado') = 'DELIVERED' then 'PASS' else 'FAIL' end, '');

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_carta_fantasma
  from public.get_carta_publica(gen_random_uuid()) x;
  insert into test_results values (6, 'site_key aleatoria no devuelve datos de ningun tenant',
    case when v_carta_fantasma = '[]'::jsonb then 'PASS' else 'FAIL' end,
    format('%s filas devueltas', jsonb_array_length(v_carta_fantasma)));

  v_fallo_detectado := false;
  begin
    perform public.validar_mesa(v_site_key, 'identificador-que-no-existe-123');
  exception when others then
    v_fallo_detectado := true;
  end;
  insert into test_results values (7, 'validar_mesa rechaza identificador inexistente',
    case when v_fallo_detectado then 'PASS' else 'FAIL' end, '');

  update restaurant.productos set disponible = false where id = v_producto_id;
  v_fallo_detectado := false;
  begin
    perform public.crear_pedido_restaurant(
      v_site_key, v_mesa_identificador,
      jsonb_build_array(jsonb_build_object('producto_id', v_producto_id, 'cantidad', 1)),
      'LOCAL', null
    );
  exception when others then
    v_fallo_detectado := true;
  end;
  update restaurant.productos set disponible = true where id = v_producto_id;
  insert into test_results values (8, 'pedido rechazado si el producto no esta disponible',
    case when v_fallo_detectado then 'PASS' else 'FAIL' end, '');

  delete from restaurant.pedidos where id = v_pedido_id;
end $$;

select * from test_results order by orden;
