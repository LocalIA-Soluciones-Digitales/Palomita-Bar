-- Ocultar suplementos de la carta pública + información nutricional de Desayuno
-- + recorte de la foto de Grey Goose — 2026-10-05.
--
-- 1. Nueva columna restaurant.productos.visible_carta. get_carta_publica sigue
--    devolviendo todos los productos disponibles porque el TPV de barra y el
--    pedido rápido del panel también la usan; las páginas de clientes (inicio,
--    carta, coctelería y pedir) filtran por visible_carta en el frontend.
--    Se ocultan los suplementos y los conceptos internos de caja (Bolsa, Varios).
--
-- 2. Ingredientes y valores nutricionales por ración de los productos de
--    Desayuno que no los tenían. Valores aproximados calculados a partir de
--    tablas de composición de cada ingrediente (pan de hogaza ~60 g, yogur
--    natural 150 g, etc.) y contrastados con fichas públicas (Fitia, FatSecret,
--    OpenFoodFacts). Las pulguitas copian los valores de sus equivalentes de
--    Picoteo. Los ingredientes de Tosta Palomita, Vegana, Carrillera, Salmón y
--    Toscana son supuestos razonables: revisar con el bar.

begin;

alter table restaurant.productos
  add column if not exists visible_carta boolean not null default true;

comment on column restaurant.productos.visible_carta is
  'false = solo TPV/panel (suplementos, conceptos de caja); no se muestra a clientes.';

update restaurant.productos
set visible_carta = false, updated_at = now()
where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and (nombre ilike 'Suplemento %' or nombre in ('Bolsa', 'Varios'));

update restaurant.productos p
set ingredientes       = v.ingredientes,
    calorias           = v.kcal,
    proteinas_g        = v.prot,
    carbohidratos_g    = v.carb,
    grasas_g           = v.grasa,
    grasas_saturadas_g = v.sat,
    azucares_g         = v.azuc,
    sal_g              = v.sal,
    updated_at         = now()
from (values
  ('Tosta Mantequilla',           array['Pan tostado','Mantequilla','Mermelada de fresa'],                         320,  6.0, 42.0, 14.0,  8.0, 13.0, 0.9),
  ('Tosta Pan Tumaca',            array['Pan tostado','Tomate rallado','Aceite de oliva virgen extra','Sal'],      260,  6.0, 32.0, 11.5,  1.8,  3.0, 1.1),
  ('Tosta Palomita',              array['Pan tostado','Queso crema','Palomitas caramelizadas','Miel'],             360,  8.5, 55.0, 11.5,  6.0, 21.0, 1.1),
  ('Tosta Vegana',                array['Pan tostado','Aguacate','Tomate cherry','Rúcula','Sésamo','Aceite de oliva'], 330, 7.5, 38.0, 17.0, 2.6, 3.5, 0.9),
  ('Tosta Carrillera',            array['Pan tostado','Carrillera de cerdo guisada','Cebolla caramelizada'],       360, 22.0, 41.0, 10.0,  3.5, 10.0, 1.6),
  ('Tosta Salmón',                array['Pan tostado','Queso crema','Salmón ahumado','Eneldo','Alcaparras'],       330, 18.0, 32.0, 13.5,  5.8,  3.0, 2.4),
  ('Tosta Toscana',               array['Pan tostado','Pesto','Mozzarella fresca','Tomate seco','Albahaca'],       360, 14.5, 36.0, 17.5,  7.0,  5.0, 1.5),
  ('Bowl Granola y Fruta',        array['Yogur natural','Granola','Fresas','Arándanos','Plátano'],                 330, 10.0, 46.0, 11.0,  4.4, 26.0, 0.2),
  ('Bowl Granola, Miel y Nueces', array['Yogur natural','Granola','Nueces','Miel'],                                450, 12.0, 46.0, 24.0,  5.5, 28.0, 0.2),
  ('Bowl Miel y Nueces',          array['Yogur natural','Nueces','Miel'],                                          315,  9.0, 25.0, 21.5,  4.7, 24.0, 0.2),
  ('Dulce Cookie',                array['Harina','Mantequilla','Azúcar','Chocolate','Huevo'],                      400,  5.0, 50.0, 20.0, 12.0, 30.0, 0.4),
  ('Dulce Napolitana',            array['Hojaldre','Mantequilla','Chocolate','Azúcar'],                            380,  5.5, 39.0, 22.0, 12.0, 14.0, 0.6),
  ('Pulguita Jamón',              array['Pan de pulguita','Jamón ibérico','Tomate'],                               270, 14.0, 27.0, 11.0,  4.0,  2.0, 1.5),
  ('Pulguita Bonito',             array['Pan de pulguita','Bonito del norte','Tomate','Mayonesa'],                 290, 15.0, 26.0, 14.0,  3.0,  2.0, 1.4),
  ('Pulguita Tumaca',             array['Pan de pulguita','Tomate rallado','Aceite de oliva virgen extra'],        230,  6.0, 31.0,  9.0,  1.4,  2.5, 1.0)
) as v(nombre, ingredientes, kcal, prot, carb, grasa, sat, azuc, sal)
join restaurant.categorias c on c.nombre = 'Desayuno'
where p.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and c.cliente_id = p.cliente_id
  and p.categoria_id = c.id
  and p.nombre = v.nombre;

-- 3. greygoose.webp traía una columna negra de 61 px a la izquierda; se recortó
--    y se volvió a subir. ?v=2 salta la caché de la CDN.
update restaurant.productos
set imagen_url = split_part(imagen_url, '?', 1) || '?v=2', updated_at = now()
where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and imagen_url like '%/carta/greygoose.webp%';

commit;
