-- ============================================================
-- Limpieza de duplicados tras la actualización de la carta
-- (carta_actualizacion_2026-08-16.sql) — Palomita Bar
-- ============================================================
-- Contexto: la carta ya tenía datos previos (creados 2026-08-12, datos
-- de prueba) que el script de actualización no tocó (es aditivo). Este
-- script:
--   1. Actualiza precio/descripción de 3 platos de Ron que son el mismo
--      producto en la carta antigua y en las fotos nuevas (Mojito,
--      Daikiri, Piña Colada) — se conserva su id/orden original.
--   2. Borra los pedido_items de prueba que referencian productos
--      antiguos (para poder borrar esos productos sin violar la FK
--      pedido_items_producto_id_fkey).
--   3. Borra los productos antiguos duplicados por un equivalente nuevo
--      (Dark and Stormy → Dark'n Stormy, Sake to Cate → Sake a la
--      Llama, Niku Roll → Niku Roll 2.0, Tabla de jamón → Tabla de
--      Jamón Ibérico, Tabla de quesos → Selección de quesos) y todos
--      los productos de 7 categorías antiguas ya cubiertas por las
--      nuevas: Ensaladas, Especial Casa, Guiño al Japonés, Picoteo,
--      Postres, Tequila, Whisky.
--   4. Borra esas 7 categorías (ya sin productos).
--
-- cliente_id de Palomita Bar: e73669e4-7951-41f0-aa9a-16b391d0015c
-- ============================================================

begin;

-- 1. Actualizar los 3 platos de Ron con el mismo nombre en ambas cartas
update restaurant.productos
set precio_centimos = 850,
    descripcion = 'Ron Santísima 3, hierbabuena, azúcar moreno y soda. Cítrico.'
where id = '0af1a3f7-b166-45d0-9a79-77b801fe8c96'; -- Mojito

update restaurant.productos
set precio_centimos = 800,
    descripcion = 'Ron Santísima 3, limón y azúcar. Cítrico.'
where id = '0ad8f7ac-9a69-4a22-9978-c8f4b57e598d'; -- Daikiri

update restaurant.productos
set precio_centimos = 850,
    descripcion = 'Ron Santísima 3, limón, zumo de piña y coco. Dulce.'
where id = '2e445417-670d-4261-9dfd-6241e79be913'; -- Piña Colada

-- 2. Borrar pedido_items de prueba que referencian productos a eliminar
delete from restaurant.pedido_items
where producto_id in (
  'bb41b212-6429-4fa5-9cc7-1ba9c7770a29', -- Dark and Stormy (Ron)
  '0e0560b0-5c5f-47bc-85e8-e6ee7bd8696e', -- Sake to Cate (Rolls)
  '1b081e20-2371-45c5-811f-8daa02e89e75', -- Niku Roll (Rolls)
  '7724ba98-8953-492b-85f5-d1c69b50a477', -- Tabla de jamón (Tablas)
  '700a0101-200e-4c30-a11e-789cddd0678e'  -- Tabla de quesos (Tablas)
)
or producto_id in (
  select id from restaurant.productos
  where categoria_id in (
    select id from restaurant.categorias
    where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid
      and slug in ('ensaladas', 'especial-casa', 'guino-al-japones', 'picoteo', 'postres', 'tequila', 'whisky')
  )
);

-- 3. Borrar los productos antiguos superados
delete from restaurant.productos
where id in (
  'bb41b212-6429-4fa5-9cc7-1ba9c7770a29',
  '0e0560b0-5c5f-47bc-85e8-e6ee7bd8696e',
  '1b081e20-2371-45c5-811f-8daa02e89e75',
  '7724ba98-8953-492b-85f5-d1c69b50a477',
  '700a0101-200e-4c30-a11e-789cddd0678e'
)
or categoria_id in (
  select id from restaurant.categorias
  where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid
    and slug in ('ensaladas', 'especial-casa', 'guino-al-japones', 'picoteo', 'postres', 'tequila', 'whisky')
);

-- 4. Borrar las categorías antiguas ya vacías
delete from restaurant.categorias
where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid
  and slug in ('ensaladas', 'especial-casa', 'guino-al-japones', 'picoteo', 'postres', 'tequila', 'whisky');

-- ------------------------------------------------------------
-- Comprobación final: recuento por categoría tras la limpieza
-- ------------------------------------------------------------
select cat.tipo, cat.nombre as categoria, count(pr.id) as productos
from restaurant.categorias cat
left join restaurant.productos pr on pr.categoria_id = cat.id
where cat.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid
group by cat.tipo, cat.nombre, cat.orden
order by cat.tipo, cat.orden;

-- Revisa el resultado y, si todo cuadra:
commit;
-- Si algo falla o no cuadra (por ejemplo otra FK, como repartos o
-- pagos ligados a esos pedido_items), ejecuta ROLLBACK; en su lugar y
-- pásame el mensaje de error exacto.
