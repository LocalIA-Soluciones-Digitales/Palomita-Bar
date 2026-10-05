-- % vol. de bebidas que no lo tenían — 2026-10-05.
-- Mismo criterio que la carta: combinados = graduación del destilado; cócteles =
-- estimación de la copa servida (en línea con los cócteles ya informados);
-- vinos por tipo de vino.
--   Kendal 42 % (ginventory.co). Flaming Pig Spiced Irish 33,3 % (The Whisky
--   Exchange); es un licor de whiskey irlandés especiado, no un ron.
--   Le Tribute 43 %, igual que "Gin Le Tribute".
-- Quedan sin % por no poder confirmarlo (preguntar al bar / mirar la botella):
--   Ron 311, Koi, Angelillo, Le Bombay, cervezas de barril (Zurito, Zurito
--   Bodega, Zurito Tostado, Jarra, Pinta Rubia, Pinta Tostada), 1/3, Estrella
--   Reposada y los vinos de marca (Anahi, Cueva Blanco/Tinto, Heras Cordón,
--   Heras Cordón Verdejo, Noc, Tras las Cepas).

begin;

update restaurant.productos p
set alcohol_pct = v.pct, updated_at = now()
from (values
  ('Combinados', 'Kendal',               42.0),
  ('Combinados', 'Flaming Pig',          33.3),
  ('Combinados', 'Cuba Libre',           37.5),
  ('Combinados', 'Destornillador',       37.5),
  ('Refrescos',  'Le Tribute',           43.0),
  ('Refrescos',  'Kalimotxo',             6.5),
  ('Cócteles',   'La Bolsita',           12.0),
  ('Cócteles',   'Gin Berry',            10.0),
  ('Cócteles',   'Palomita',             10.0),
  ('Cócteles',   'Palomita Mexicana',    10.0),
  ('Cócteles',   'Holy Basil',           15.0),
  ('Cócteles',   'Palomita Spritz',       8.5),
  ('Cócteles',   'Valenciano',           10.0),
  ('Cócteles',   'Elan Tropical',        10.0),
  ('Cócteles',   'Perla Roja',           15.0),
  ('Cócteles',   'Mula Botánica',        10.0),
  ('Cócteles',   'Apple Fizz',           10.0),
  ('Cócteles',   'La Bella y la Bestia', 18.0),
  ('Cócteles',   'Green Lander',         15.0),
  ('Vino',       'Albariño',             12.5),
  ('Vino',       'Godello',              13.0),
  ('Vino',       'Chardonnay',           13.0),
  ('Vino',       'Txakoli Vizcaíno',     11.0),
  ('Vino',       'Txakoli Gipuzkoa',     11.0),
  ('Vino',       'Cava',                 11.5),
  ('Vino',       'Moscatel',             15.0)
) as v(categoria, nombre, pct)
join restaurant.categorias c on c.nombre = v.categoria
where p.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and c.cliente_id = p.cliente_id
  and p.categoria_id = c.id
  and p.nombre = v.nombre
  and p.alcohol_pct is null;

update restaurant.productos
set ingredientes = array['Whiskey irlandés especiado Flaming Pig','Refresco de cola','Hielo','Lima'],
    updated_at = now()
where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and nombre = 'Flaming Pig';

commit;
