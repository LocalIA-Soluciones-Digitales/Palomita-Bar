-- Precios que faltaban, % vol. restantes y Menú fuera de la carta — 2026-10-05.
--
-- 1. Precios ESTIMADOS (no había fuente con el precio actual): se toma el
--    producto más parecido de la carta y la carta de 2023 publicada en la web
--    antigua (Carta-palomita-final.pdf). Regla de tarifas de la carta:
--    barra = salón = precio base; terraza = salón + 0,10 €. Revisar con el bar.
--      Ebi in Blanket 13,50 (en 2023 costaba lo mismo que Sake to Cate; los
--        rolls equivalentes hoy están en 13,50–14,00)
--      Tosta Jamón 6,90 / Tosta Queso 5,90 (en línea con las tostas de Desayuno)
--      Mocca 2,80 (como Café Frappé) · Mahou Pequeña 2,50 (Mahou 2,90)
--      Valenciano 8,50 (como Palomita)
--      Cointreau 8,50 (Licor 43) · Deacon 9,00 (Black Label) · Flaming Pig 8,50
--      Glenfiddich 12 9,50 (Glenfiddich 15 está a 10,00) · Laphroaig 10,00
--
-- 2. % vol. ESTIMADOS para las bebidas que quedaban sin él. Cerveza de barril:
--    se asume Estrella Galicia (la carta tiene 1906, 1906 Red y "Zurito
--    Bodega") → 5,5 %; tostadas 6 %. Vinos de marca por tipo/D.O. habitual.
--    Ron 311 y Le Bombay 40 %, Koi 40 %, Angelillo (anís dulce) 35 %.
--
-- 3. "Menú" (23,50 €, sin contenido definido) pasa a solo TPV, como los
--    suplementos, hasta que exista una sección de menú en la web.

begin;

update restaurant.productos p
set precio_centimos         = v.precio,
    precio_barra_centimos   = v.precio,
    precio_salon_centimos   = v.precio,
    precio_terraza_centimos = v.precio + 10,
    updated_at              = now()
from (values
  ('Varios',     'Ebi in Blanket', 1350),
  ('Varios',     'Tosta Jamón',     690),
  ('Varios',     'Tosta Queso',     590),
  ('Cafés',      'Mocca',           280),
  ('Cerveza',    'Mahou Pequeña',   250),
  ('Cócteles',   'Valenciano',      850),
  ('Combinados', 'Cointreau',       850),
  ('Combinados', 'Deacon',          900),
  ('Combinados', 'Flaming Pig',     850),
  ('Combinados', 'Glenfiddich 12',  950),
  ('Combinados', 'Laphroaig',      1000)
) as v(categoria, nombre, precio)
join restaurant.categorias c on c.nombre = v.categoria
where p.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and c.cliente_id = p.cliente_id
  and p.categoria_id = c.id
  and p.nombre = v.nombre
  and coalesce(p.precio_centimos, 0) = 0;

update restaurant.productos p
set alcohol_pct = v.pct, updated_at = now()
from (values
  ('Cerveza',    'Zurito',               5.5),
  ('Cerveza',    'Zurito Bodega',        5.5),
  ('Cerveza',    'Jarra',                5.5),
  ('Cerveza',    'Pinta Rubia',          5.5),
  ('Cerveza',    '1/3',                  5.5),
  ('Cerveza',    'Estrella Reposada',    5.5),
  ('Cerveza',    'Pinta Tostada',        6.0),
  ('Cerveza',    'Zurito Tostado',       6.0),
  ('Combinados', 'Ron 311',             40.0),
  ('Combinados', 'Le Bombay',           40.0),
  ('Combinados', 'Koi',                 40.0),
  ('Combinados', 'Angelillo',           35.0),
  ('Vino',       'Anahi',               11.0),
  ('Vino',       'Cueva Blanco',        12.0),
  ('Vino',       'Cueva Tinto',         13.0),
  ('Vino',       'Heras Cordón',        14.0),
  ('Vino',       'Heras Cordón Verdejo',13.0),
  ('Vino',       'Noc',                 12.5),
  ('Vino',       'Tras las Cepas',      14.0)
) as v(categoria, nombre, pct)
join restaurant.categorias c on c.nombre = v.categoria
where p.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and c.cliente_id = p.cliente_id
  and p.categoria_id = c.id
  and p.nombre = v.nombre
  and p.alcohol_pct is null;

update restaurant.productos
set visible_carta = false, updated_at = now()
where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and nombre = 'Menú';

commit;
