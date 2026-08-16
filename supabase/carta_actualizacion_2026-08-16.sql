-- ============================================================
-- Actualización completa de la carta — Palomita Bar
-- Generado a partir de las fotos de la carta física (2026-08-16).
-- ============================================================
--
-- IMPORTANTE — leer antes de ejecutar:
--
-- 1. Este script asume el esquema `restaurant.categorias` /
--    `restaurant.productos` con columnas equivalentes a los tipos
--    TypeScript de src/lib/restaurant/types.ts (nombre, descripcion,
--    precio_centimos, categoria_id, disponible, destacado, orden,
--    alergenos, cliente_id). NO se ha ejecutado contra la base de datos
--    real: verifica antes de correrlo en producción, por ejemplo con
--      SELECT * FROM restaurant.categorias LIMIT 1;
--      SELECT * FROM restaurant.productos LIMIT 1;
--    y ajusta nombres de columna si difieren.
--
-- 2. El cliente_id de Palomita Bar (e73669e4-7951-41f0-aa9a-16b391d0015c,
--    obtenido de la tabla clientes por su site_key) ya está puesto abajo.
--
-- 3. Es idempotente: usa NOT EXISTS por nombre+categoría, así que se
--    puede volver a ejecutar sin duplicar filas. Sí duplicará si el
--    nombre de un producto se edita después a mano en el admin.
--
-- 4. Recomendado ejecutar dentro de una transacción y revisar el
--    resultado (SELECT de comprobación al final) antes de hacer COMMIT.
--
-- 5. No incluidos (son extras de precio, no productos independientes):
--    - "Coctail Premium con Le Bombay Cru" (+1,50€) en Ginebra
--    - "Coctail Premium con Grey Goose" (+1,50€) en Vodka
--    - "Coctail con Patrón" (+1,50€) en Especiales de la casa
--    - Suplemento terraza (0,10€) aplicable a toda la carta de bebidas
--    Precios con variante (medio/entero, media/ración, premium) se han
--    modelado como productos independientes.
-- ============================================================

begin;


-- ------------------------------------------------------------
-- Categorías
-- ------------------------------------------------------------

insert into restaurant.categorias (cliente_id, nombre, slug, tipo, orden)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, v.nombre, v.slug, v.tipo, v.orden
from (values
  ('Cócteles de la casa',    'cocteles-de-la-casa',    'bebida', 1),
  ('Combinados',             'combinados',             'bebida', 2),
  ('Ginebra',                'ginebra',                'bebida', 3),
  ('Vodka',                  'vodka',                  'bebida', 4),
  ('Ron',                    'ron',                    'bebida', 5),
  ('Whiskey',                'whiskey',                'bebida', 6),
  ('Pisco',                  'pisco',                  'bebida', 7),
  ('Especiales de la casa',  'especiales-de-la-casa',  'bebida', 8),
  ('Moctails',               'moctails',               'bebida', 9),
  ('Aperitivos',             'aperitivos',             'bebida', 10),
  ('Vinos tintos',           'vinos-tintos',           'bebida', 11),
  ('Vinos blancos',          'vinos-blancos',          'bebida', 12),
  ('Espumosos',              'espumosos',              'bebida', 13),
  ('Entrantes',              'entrantes',              'comida', 1),
  ('Tablas',                 'tablas',                 'comida', 2),
  ('Rollo japonés',          'rollo-japones',          'comida', 3),
  ('Rolls',                  'rolls',                  'comida', 4),
  ('Postres caseros',        'postres-caseros',        'comida', 5)
) as v(nombre, slug, tipo, orden)
where not exists (
  select 1 from restaurant.categorias c
  where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = v.slug
);

-- ------------------------------------------------------------
-- Cócteles de la casa (recomendados)
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, true, p.orden, array[]::text[]
from restaurant.categorias c
cross join (values
  ('La Bolsita',            'Vodka, limón, zumo de arándanos, sirope de frambuesa y coco.', 950, 1),
  ('Palomita a la mexicana','Tequila reposado, limón, pomelo, mango, sirope de ágave, bitter de chocolate y humo.', 950, 2),
  ('Green Lander',          'Ron Santísima 3, limón, zumo de piña, sirope de agave y licor de melón.', 900, 3),
  ('La Bella y la Bestia',  'Ginebra rosa, limón, sirope de fresa, bitter de limón y berries.', 950, 4),
  ('Palomita',               'Tequila reposado, limón, zumo de pomelo, sirope de ágave y soda de pomelo.', 850, 5),
  ('Holy Bible',            'Dewars white label, limón, zumo de manzana, sirope y bitter de chocolate.', 950, 6)
) as p(nombre, descripcion, precio_centimos, orden)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'cocteles-de-la-casa'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Combinados
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, array[]::text[]
from restaurant.categorias c
cross join (values
  ('Gintonic de la casa',             'Mg paradiso con tónica. Bitter de pimienta negra y jengibre.', 850, 1),
  ('Gintonic Premium "Le Bombay Cru"','Ginebra Le Bombay Cru con tónica.', 900, 2),
  ('Destornillador',                  'Vodka, zumo de naranja y refresco de naranja.', 950, 3),
  ('Destornillador Premium',          'Vodka premium, zumo de naranja y refresco de naranja.', 1300, 4),
  ('Kraken',                          'Ron especiado Kraken con Coca Cola.', 850, 5),
  ('Santa Teresa 1796',               'Ron Santa Teresa 1796.', 950, 6)
) as p(nombre, descripcion, precio_centimos, orden)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'combinados'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Ginebra
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, p.alergenos
from restaurant.categorias c
cross join (values
  ('Clover Club', 'MG paradiso, limón, sirope de frambuesa y clara de huevo. Dulce.', 850, 1, array['huevo']),
  ('Gin Fizz',     'MG paradiso, limón, soda y clara de huevo. Cítrico.', 850, 2, array['huevo']),
  ('Ginberry',     'Ginebra rosa, limón, naranja, zumo de arándanos, sirope de frambuesa y licor de almendras. Dulce.', 900, 3, array['frutos secos']),
  ('Bramble',      'MG paradiso, limón, azúcar y licor de mora. Cítrico con toques dulces.', 850, 4, array[]::text[])
) as p(nombre, descripcion, precio_centimos, orden, alergenos)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'ginebra'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Vodka
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, array[]::text[]
from restaurant.categorias c
cross join (values
  ('Cosmopolitan',     'Vodka, limón, zumo de arándanos y Cointreau. Cítrico.', 800, 1),
  ('Mula de Moscú',    'Vodka, limón, angostura y ginger beer. Cítrico y especiado.', 900, 2),
  ('Espresso Martini', 'Vodka, café, azúcar y licor de café. Notas amargas.', 850, 3),
  ('Sex on the Beach', 'Vodka, licor de melocotón, zumo de naranja, arándanos y sirope de frambuesa. Dulce.', 900, 4)
) as p(nombre, descripcion, precio_centimos, orden)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'vodka'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Ron
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, array[]::text[]
from restaurant.categorias c
cross join (values
  ('Mojito',        'Ron Santísima 3, hierbabuena, azúcar moreno y soda. Cítrico.', 850, 1),
  ('Daikiri',        'Ron Santísima 3, limón y azúcar. Cítrico.', 800, 2),
  ('Piña Colada',    'Ron Santísima 3, limón, zumo de piña y coco. Dulce.', 850, 3),
  ('Dark''n Stormy', 'Ron Kraken, limón, angostura y ginger beer. Trago largo. Notas a jengibre.', 950, 4),
  ('Mai Tai',        'Ron Santísima 3, Kraken, limón, zumo de piña, almendras, Cointreau y bitter de chocolate. Dulce.', 900, 5)
) as p(nombre, descripcion, precio_centimos, orden)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'ron'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Whiskey
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, p.alergenos
from restaurant.categorias c
cross join (values
  ('Whiskey Sour',  'Whiskey, limón, azúcar y clara de huevo. Cítrico.', 900, 1, array['huevo']),
  ('Smoked Darkan', 'Whiskey, Deacon, limón, azúcar y ginger ale. Trago largo. Toque ligeramente ahumado.', 950, 2, array[]::text[])
) as p(nombre, descripcion, precio_centimos, orden, alergenos)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'whiskey'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Pisco
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, p.alergenos
from restaurant.categorias c
cross join (values
  ('Pisco Sour', 'Pisco, limón, azúcar y clara de huevo. Cítrico.', 900, 1, array['huevo']),
  ('Chilcano',   'Pisco, limón, azúcar y ginger ale. Trago largo, refrescante.', 950, 2, array[]::text[])
) as p(nombre, descripcion, precio_centimos, orden, alergenos)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'pisco'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Especiales de la casa
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, array[]::text[]
from restaurant.categorias c
cross join (values
  ('Mexican Mule', 'Tequila reposado, limón, habanero jalapeño ahumado y ginger beer. Toques ahumados, ligeramente picante.', 950, 1),
  ('Long Island Tea', 'Vodka, ginebra, ron blanco, Cointreau, zumo de limón y Coca-Cola. Trago largo. Refrescante.', 900, 2),
  ('Margarita', 'Tequila blanco, limón, azúcar y Cointreau. Cítrico.', 800, 3),
  ('Caipirinha', 'Cachaza Capucanna, lima y azúcar.', 900, 4)
) as p(nombre, descripcion, precio_centimos, orden)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'especiales-de-la-casa'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Moctails (sin alcohol)
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, array[]::text[]
from restaurant.categorias c
cross join (values
  ('Élan Tropical', 'Limón, piña, maracuyá y sirope de agave. Cítrico, refrescante.', 700, 1),
  ('Perla Roja',    'Naranja, arándanos, mango y sirope de frambuesa. Dulce, refrescante.', 700, 2),
  ('Mula Botánica', 'Ginebra 0.0, limón, azúcar y ginger beer. Refrescante.', 750, 3),
  ('Apple Fizz',    'Zumo de manzana, limón, agave y ginger ale. Ralladura de canela. Refrescante.', 750, 4),
  ('Virgin Mary',   'Limón, zumo de tomate y salsa de la casa.', 700, 5)
) as p(nombre, descripcion, precio_centimos, orden)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'moctails'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Aperitivos
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, array[]::text[]
from restaurant.categorias c
cross join (values
  ('Vermut preparado',      'Martini Rosso y receta casera.', 380, 1),
  ('Martini Spritz',        'Martini Fiero, soda y cava.', 690, 2),
  ('Martini Bianco Spritz', 'Martini Bianco, soda y cava.', 690, 3),
  ('Spritz sin alcohol',    'Martini Floreale, zumo de pomelo y soda de pomelo.', 600, 4),
  ('Palomita''s Spritz',    'Bonanto aperitivo y soda de pomelo.', 690, 5),
  ('St-Germain Spritz',     'St-Germain Elderflower, soda y cava.', 690, 6),
  ('Negroni',                'Martini Rosso, Martini Bitter y Bombay.', 700, 7),
  ('Bloody Mary (medio)',    'Vodka, limón, zumo de tomate y salsa de la casa.', 500, 8),
  ('Bloody Mary (entero)',   'Vodka, limón, zumo de tomate y salsa de la casa.', 850, 9)
) as p(nombre, descripcion, precio_centimos, orden)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'aperitivos'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Vinos tintos
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, array['sulfitos']
from restaurant.categorias c
cross join (values
  ('Cueva de Lobos 16',
   'D.O. Rioja | Bodegas Javier San Pedro Ortega | Tempranillo. Tinto equilibrado y expresivo, con aromas de fruta roja y negra madura y suaves notas especiadas. Boca redonda y persistente.',
   1600, 1),
  ('Viuda negra 18',
   'D.O. Rioja | Bodegas Javier San Pedro Ortega | Tempranillo. Intenso y moderno, con notas de frutos negros, regaliz y ligeros tostados. Estructurado y elegante.',
   1800, 2),
  ('Viuda negra "Nunca jamás" 25',
   'D.O. Rioja | Bodegas Javier San Pedro Ortega | Tempranillo. Más complejo y profundo, con crianza cuidada. Destacan la fruta madura, el cacao y la madera bien integrada.',
   2500, 3),
  ('Heras Cordón 23',
   'D.O. Rioja | Bodegas Heras Cordón | Tempranillo. Clásico riojano, suave y armónico, con notas de fruta roja, vainilla y especias dulces.',
   2300, 4),
  ('Traslascuestas 17',
   'D.O. Ribera del Duero | Bodegas de Piérola | Tempranillo. Elegante y con carácter, con fruta negra, notas balsámicas y fondo mineral. Final largo.',
   1700, 5),
  ('Hito 21',
   'D.O. Ribera del Duero | Bodegas Cepa 21 | Tempranillo. Joven, fresco y frutal, con excelente equilibrio y fácil disfrute.',
   2100, 6)
) as p(nombre, descripcion, precio_centimos, orden)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'vinos-tintos'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Vinos blancos
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, array['sulfitos']
from restaurant.categorias c
cross join (values
  ('Boyante 12',
   'D.O. Rueda | Bodega Valdecuevas | Verdejo. Aromático y refrescante, con notas tropicales y herbáceas. Buena acidez.',
   1200, 1),
  ('Cueva de Lobos Blanco 15',
   'D.O. Rioja | Bodegas Javier San Pedro Ortega | Viura. Fresco y equilibrado, con aromas de fruta blanca y flores. Ligero y muy agradable.',
   1500, 2),
  ('Anahí 16',
   'D.O. Rioja | Bodegas Javier San Pedro Ortega | Viura. Elegante y aromático, con notas cítricas y florales. Boca fresca y limpia.',
   1600, 3),
  ('Condes de Albarei 22',
   'D.O. Rías Baixas | Bodega Condes de Albarei | Albariño. Fresco y atlántico, con aromas de fruta de hueso y cítricos. Muy vivo y refrescante.',
   2200, 4),
  ('Can Do Sil 18',
   'D.O. Valdeorras | Adega Cando Sil | Godello. Blanco con carácter, elegante y mineral, con fruta madura y buena estructura.',
   1800, 5),
  ('NOC Viognier Lías 21',
   'V.T. Castilla y León | Bodega NOC | Viognier. Blanco untuoso y aromático, con notas florales, fruta madura y volumen en boca gracias a su crianza sobre lías.',
   2100, 6),
  ('Viñas del Vero 15',
   'D.O. Somontano | Bodega Viñas del Vero | Chardonnay. Elegante y aromático, con notas de fruta tropical, manzana y sutiles toques de vainilla. En boca es equilibrado, untuoso y con un final largo y agradable.',
   1500, 7),
  ('Lapazaran 13',
   'D.O. Txakoli Bizkaino | Bodega Lapazaran | Hondarrabi Zuri. Fresco y ligero, con aromas de manzana verde y cítricos. Muy refrescante.',
   1300, 8),
  ('Txomin Etxaniz 21',
   'D.O. Getariako Txakolina | Bodega Txomin Etxaniz | Hondarrabi Zuri. Txakoli fresco y vibrante, con marcada acidez, notas cítricas y ligero toque salino.',
   2100, 9)
) as p(nombre, descripcion, precio_centimos, orden)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'vinos-blancos'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Espumosos
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, array['sulfitos']
from restaurant.categorias c
cross join (values
  ('Marina Espumante 13',
   'D.O. Valencia | Bodegas Bocopa | Moscato. Espumante dulce y aromático, con notas florales y de fruta blanca. Ligero y muy fácil de beber.',
   1300, 1),
  ('Juvé & Camps Essential Púrpura 24',
   'D.O. Cava | Juvé & Camps | Trepat. Cava rosado elegante y fresco, con aromas de frutos rojos y burbuja fina. Seco y muy equilibrado.',
   2400, 2)
) as p(nombre, descripcion, precio_centimos, orden)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'espumosos'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Entrantes
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, p.alergenos
from restaurant.categorias c
cross join (values
  ('Ensalada de Burrata con Inyección de Pesto Rojo',
   'Burrata, brotes tiernos, tomate cherry, albahaca, tomate seco y brotes tiernos.',
   1500, 1, array['lácteos','frutos secos','sulfitos']),
  ('Ensalada de Ventresca con Emulsión de Piquillos',
   'Lascas de ventresca de bonito, cebolla encurtida de Zalla y una suave emulsión de pimientos de piquillo y tomate del país.',
   1400, 2, array['pescado','sulfitos']),
  ('Ensalada Palomita',
   'Queso de cabra caramelizado, nueces, cebolla pochada, tomate cherry y brotes tiernos. Aliñada con vinagreta casera.',
   1300, 3, array['lácteos','frutos secos','sulfitos']),
  ('Nachos',
   'Nachos caseros con guacamole, pico de gallo, jalapeños y queso de la casa.',
   1100, 4, array['cereales','gluten','lácteos']),
  ('Hummus Palomita',
   'Garbanzo cocido con verduras, crudités, chips de tubérculos, picos y regañas.',
   850, 5, array['soja','sésamo']),
  ('Edamame con sal de Añana',
   'Edamame cocido al punto con escamas de sal de Añana.',
   700, 6, array[]::text[]),
  ('Edamame salteado al wok con salsa kimchi',
   'Edamame salteado con kimchi, sichimi y aceite de sésamo.',
   800, 7, array['soja','sésamo','sulfitos']),
  ('Nachos Palomita',
   'Nachos caseros con carrillera mechada, guacamole, pico de gallo, jalapeños y queso cheddar.',
   1500, 8, array['cereales','gluten','lácteos']),
  ('Croquetas caseras de jamón (5 ud)',
   'Croquetas caseras de jamón.',
   950, 9, array['gluten','lácteos','huevo','sésamo']),
  ('Croquetas caseras de boletus (5 ud)',
   'Croquetas caseras de boletus.',
   950, 10, array['gluten','lácteos','huevo','sésamo']),
  ('Patatas gajo',
   'Patatas gajo con alioli y salsa brava.',
   850, 11, array['cereales','gluten','lácteos','huevo']),
  ('Crujientes de pollo',
   'Pollo marinado, barbacoa, miel y mostaza.',
   900, 12, array['gluten','soja','mostaza','sésamo'])
) as p(nombre, descripcion, precio_centimos, orden, alergenos)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'entrantes'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Tablas
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, p.alergenos
from restaurant.categorias c
cross join (values
  ('Picaña ahumada (6 ud)',
   'Picaña ahumada al roble sobre crema de queso azul con tostas de pan.',
   1300, 1, array['lactosa','gluten']),
  ('Tabla de Jamón Ibérico',
   'Jamón ibérico de bellota cortado a cuchillo y con tostas de pan.',
   2400, 2, array['gluten']),
  ('Cecina de Angus',
   'Cecina de angus con lascas de parmesano y AOVE.',
   1800, 3, array['lactosa','gluten']),
  ('Selección de quesos (media)',
   'Brie, parmigiano DOP y queso azul. Acompañado de membrillo y picos.',
   900, 4, array['lactosa','gluten']),
  ('Selección de quesos (ración)',
   'Brie, parmigiano DOP y queso azul. Acompañado de membrillo y picos.',
   1600, 5, array['lactosa','gluten'])
) as p(nombre, descripcion, precio_centimos, orden, alergenos)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'tablas'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Rollo japonés
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, p.alergenos
from restaurant.categorias c
cross join (values
  ('Tartar de Atún',
   'Tartar de atún rojo con guacamole, puerro, aceite de sésamo y alga wakame.',
   1900, 1, array['gluten','soja','pescado','sésamo']),
  ('Tartar de Salmón',
   'Salmón con aguacate, mayonesa japonesa y yema soasada sobre arroz de sushi.',
   1700, 2, array['gluten','soja','pescado','sésamo']),
  ('Gyozas caseras de pollo (6 ud)',
   'Gyozas de pollo con pimiento rojo y verde, cebolla y salsa chili dulce.',
   900, 3, array['gluten','sésamo','soja']),
  ('Rollitos crujientes de la huerta (8 ud)',
   'Verduras salteadas envueltas en masa crujiente.',
   900, 4, array['gluten']),
  ('Pan Bao (2 ud)',
   'Pan Bao de carrillera, cebolla morada y cebolla frita.',
   900, 5, array['gluten','sulfitos']),
  ('Brochetas de pollo teriyaki',
   'Contramuslo marinado en salsa teriyaki.',
   850, 6, array['soja','sésamo'])
) as p(nombre, descripcion, precio_centimos, orden, alergenos)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'rollo-japones'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Rolls
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, p.alergenos
from restaurant.categorias c
cross join (values
  ('Uramaki de Anguila',
   'Anguila crujiente, aguacate, queso brie y salsa teriyaki.',
   1500, 1, array['pescado','leche','gluten','soja','sésamo','sulfitos']),
  ('Sake a la Llama',
   'Uramaki de aguacate y queso crema con cobertura de salmón flambeado, teriyaki y tobiko.',
   1400, 2, array['pescado','leche','soja','sulfitos']),
  ('Niku Roll 2.0',
   'Futomaki de solomillo, queso de cabra, cebolla caramelizada, tempurizado con panko y emulsión de piquillos.',
   1500, 3, array['gluten','leche','huevo','sésamo','soja','sulfitos']),
  ('Furaidochiken',
   'Uramaki de pollo crujiente, aguacate, furikake de huevo y mayonesa japonesa.',
   1350, 4, array['gluten','huevo','soja','sulfitos']),
  ('Ura Veggie',
   'Uramaki de zanahoria, pepino, tofu y aguacate. Recubierto de cebolla crujiente.',
   1250, 5, array['soja','sulfitos'])
) as p(nombre, descripcion, precio_centimos, orden, alergenos)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'rolls'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);

-- ------------------------------------------------------------
-- Postres caseros
-- ------------------------------------------------------------
insert into restaurant.productos
  (cliente_id, categoria_id, nombre, descripcion, precio_centimos, disponible, destacado, orden, alergenos)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid, c.id, p.nombre, p.descripcion, p.precio_centimos, true, false, p.orden, p.alergenos
from restaurant.categorias c
cross join (values
  ('Coulant de Chocolate',
   'Con helado de la Veneciana.',
   750, 1, array['gluten','huevo','frutos secos','lácteos']),
  ('Tarta de Queso Horneada',
   'Cremosa con helado de amarena de la Veneciana.',
   750, 2, array['huevo','lácteos']),
  ('Palomita',
   'Helado de vainilla con sirope de espéculos, chocolate y palomitas de caramelo.',
   800, 3, array['lácteos','huevo']),
  ('Cookie',
   'Cookie de chocolate con helado de Kinder.',
   850, 4, array['gluten','huevo','lácteos']),
  ('Torrija Palomita',
   'Con helado de vainilla de La Veneciana.',
   750, 5, array['lácteos'])
) as p(nombre, descripcion, precio_centimos, orden, alergenos)
where c.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and c.slug = 'postres-caseros'
and not exists (
  select 1 from restaurant.productos pr
  where pr.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid and pr.categoria_id = c.id and pr.nombre = p.nombre
);


-- ------------------------------------------------------------
-- Comprobación: revisa el recuento antes de hacer COMMIT
-- ------------------------------------------------------------
select cat.tipo, cat.nombre as categoria, count(pr.id) as productos
from restaurant.categorias cat
left join restaurant.productos pr on pr.categoria_id = cat.id
where cat.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'::uuid
group by cat.tipo, cat.nombre, cat.orden
order by cat.tipo, cat.orden;

-- Revisa el resultado del SELECT anterior y, si todo cuadra:
commit;
-- Si algo falla o no cuadra, ejecuta ROLLBACK; en su lugar.
