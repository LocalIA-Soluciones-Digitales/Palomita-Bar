-- Fotos para los productos de la carta que no tenían imagen — 2026-10-04.
-- Generadas con Gemini a partir de una foto existente de la carta como referencia
-- de estilo, recortadas a 3:4 (675x900) y subidas a Storage en palomita-bar/carta/.
--
-- Las pulguitas de Desayuno usan el sufijo "2" porque pulguitajamon.webp y
-- pulguitabonito.webp ya existen y pertenecen a los productos de Picoteo.
-- Se filtra por categoría para no tocar esos productos homónimos.
--
-- Quedan sin foto, a propósito, los suplementos y conceptos internos de caja
-- (Menú, Varios, Bolsa, Suplemento Salsa/Envases/Hielo/Vaso/Ingrediente).

begin;

update restaurant.productos p
set imagen_url = 'https://ukhfaphloxlszomccgde.supabase.co/storage/v1/object/public/palomita-bar/carta/' || v.archivo,
    updated_at = now()
from (values
  ('Desayuno', 'Tosta Mantequilla',           'tostamantequilla.webp'),
  ('Desayuno', 'Tosta Pan Tumaca',            'tostapantumaca.webp'),
  ('Desayuno', 'Tosta Palomita',              'tostapalomita.webp'),
  ('Desayuno', 'Tosta Vegana',                'tostavegana.webp'),
  ('Desayuno', 'Tosta Carrillera',            'tostacarrillera.webp'),
  ('Desayuno', 'Tosta Salmón',                'tostasalmon.webp'),
  ('Desayuno', 'Tosta Toscana',               'tostatoscana.webp'),
  ('Desayuno', 'Bowl Granola y Fruta',        'bowlgranolayfruta.webp'),
  ('Desayuno', 'Bowl Granola, Miel y Nueces', 'bowlgranolamielynueces.webp'),
  ('Desayuno', 'Bowl Miel y Nueces',          'bowlmielynueces.webp'),
  ('Desayuno', 'Dulce Cookie',                'dulcecookie.webp'),
  ('Desayuno', 'Dulce Napolitana',            'dulcenapolitana.webp'),
  ('Desayuno', 'Pulguita Jamón',              'pulguitajamon2.webp'),
  ('Desayuno', 'Pulguita Bonito',             'pulguitabonito2.webp'),
  ('Desayuno', 'Pulguita Tumaca',             'pulguitatumaca.webp'),
  ('Cerveza',  '1/3',                         'untercio.webp')
) as v(categoria, nombre, archivo)
join restaurant.categorias c on c.nombre = v.categoria
where p.cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and c.cliente_id = p.cliente_id
  and p.categoria_id = c.id
  and p.nombre = v.nombre
  and coalesce(trim(p.imagen_url), '') = '';

commit;
