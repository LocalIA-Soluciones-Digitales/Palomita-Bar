-- Reconstrucción completa de la carta de Palomita Bar a partir de las
-- categorías reales del TPV (RhynuX): Varios, Cócteles, Combinados,
-- Refrescos, Vino, Vermouth, Cerveza, Cafés, Orujos, Picoteo, Desayuno.
--
-- Ejecutado en producción (proyecto Supabase ukhfaphloxlszomccgde):
--   1. Backup de la carta anterior en restaurant.categorias_backup_20260816
--      y restaurant.productos_backup_20260816.
--   2. Los 3 productos referenciados por pedidos históricos (pedido_items)
--      se retiraron (categoria_id = null, disponible = false) en vez de
--      borrarse, para no romper la integridad referencial del historial.
--   3. Resto de productos/categorías antiguas eliminados.
--   4. Insertadas 11 categorías nuevas y 242 productos con precio_centimos = 0
--      (pendiente de fijar precio real) y disponible = true para que se vean
--      ya en carta mientras se completan los precios desde el panel de gestión.

-- Backup de la carta actual de Palomita Bar antes de sustituirla
create table if not exists restaurant.categorias_backup_20260816 as
  select * from restaurant.categorias where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c';
create table if not exists restaurant.productos_backup_20260816 as
  select * from restaurant.productos where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c';

-- Retirar (no borrar) los productos referenciados por pedidos históricos
update restaurant.productos
set categoria_id = null, disponible = false
where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and id in (select distinct producto_id from restaurant.pedido_items);

-- Borrar el resto de productos antiguos (no referenciados por pedidos)
delete from restaurant.productos
where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and id not in (select distinct producto_id from restaurant.pedido_items);

-- Borrar categorias antiguas (ya sin productos que las referencien)
delete from restaurant.categorias where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c';

-- Nuevas categorias basadas en las pestañas del TPV
insert into restaurant.categorias (cliente_id, nombre, slug, tipo, orden) values
  ('e73669e4-7951-41f0-aa9a-16b391d0015c','Varios','varios','comida',1),
  ('e73669e4-7951-41f0-aa9a-16b391d0015c','Cócteles','cocteles','bebida',2),
  ('e73669e4-7951-41f0-aa9a-16b391d0015c','Combinados','combinados','bebida',3),
  ('e73669e4-7951-41f0-aa9a-16b391d0015c','Refrescos','refrescos','bebida',4),
  ('e73669e4-7951-41f0-aa9a-16b391d0015c','Vino','vino','bebida',5),
  ('e73669e4-7951-41f0-aa9a-16b391d0015c','Vermouth','vermouth','bebida',6),
  ('e73669e4-7951-41f0-aa9a-16b391d0015c','Cerveza','cerveza','bebida',7),
  ('e73669e4-7951-41f0-aa9a-16b391d0015c','Cafés','cafes','bebida',8),
  ('e73669e4-7951-41f0-aa9a-16b391d0015c','Orujos','orujos','bebida',9),
  ('e73669e4-7951-41f0-aa9a-16b391d0015c','Picoteo','picoteo','comida',10),
  ('e73669e4-7951-41f0-aa9a-16b391d0015c','Desayuno','desayuno','comida',11);

-- Productos: precio_centimos=0 hasta fijar precio real
with cat as (
  select id, slug from restaurant.categorias where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
),
items(slug, orden, nombre) as (
  values
  -- VARIOS
  ('varios',1,'Niku Roll'),('varios',2,'Sake a la Brasa'),('varios',3,'Ebi in Blanket'),('varios',4,'Ura Chicken Roll'),
  ('varios',5,'Veggie Roll'),('varios',6,'C.Jamón (roll)'),('varios',7,'Hummus'),('varios',8,'Nuggets'),
  ('varios',9,'Patatas Gajo'),('varios',10,'Nachos Palomita'),('varios',11,'Nachos'),('varios',12,'Ensalada Palomita'),
  ('varios',13,'Ensalada Ventresca'),('varios',14,'Ensalada Burrata'),('varios',15,'Tartar de Atún'),('varios',16,'Gyoza Pollo'),
  ('varios',17,'Gyoza Vegetal'),('varios',18,'Pan Bao'),('varios',19,'Cookie'),('varios',20,'Coulant'),
  ('varios',21,'Tarta de Queso'),('varios',22,'Palomita (especial casa)'),('varios',23,'Tosta Jamón'),('varios',24,'Tosta Queso'),
  ('varios',25,'Menú'),('varios',26,'Pan'),('varios',27,'Sushi Pote'),('varios',28,'Suplemento Salsa'),
  ('varios',29,'Suplemento Envases'),('varios',30,'Helado'),('varios',31,'Varios'),('varios',32,'Langostino'),
  ('varios',33,'Bolsa'),('varios',34,'Edamame'),('varios',35,'Brochetas Pollo'),('varios',36,'Torrija'),('varios',37,'Rollitos'),
  -- COCTELES
  ('cocteles',1,'Mojito'),('cocteles',2,'Piña Colada'),('cocteles',3,'Dark and Stormy'),('cocteles',4,'Daiquiri'),
  ('cocteles',5,'La Bolsita'),('cocteles',6,'Sex on the Beach'),('cocteles',7,'Expreso Martini'),('cocteles',8,'Mula de Moscú'),
  ('cocteles',9,'Cosmopolitan'),('cocteles',10,'Clover Club'),('cocteles',11,'Gin Fizz'),('cocteles',12,'Gin Berry'),
  ('cocteles',13,'Bramble'),('cocteles',14,'Mezcal Mule'),('cocteles',15,'Margarita'),('cocteles',16,'Palomita'),
  ('cocteles',17,'Palomita Mexicana'),('cocteles',18,'Pisco Sour'),('cocteles',19,'Chilcano'),('cocteles',20,'Whisky Sour'),
  ('cocteles',21,'Holy Basil'),('cocteles',22,'Smoky Dark and Stormy'),('cocteles',23,'Vermut Preparado'),('cocteles',24,'Spritz'),
  ('cocteles',25,'Spritz 0,0'),('cocteles',26,'Palomita Spritz'),('cocteles',27,'Negroni'),('cocteles',28,'Bloody Mary'),
  ('cocteles',29,'1/2 Bloody Mary'),('cocteles',30,'Caipirinha'),('cocteles',31,'Valenciano'),('cocteles',32,'Old Fashioned'),
  ('cocteles',33,'Mai Tai'),('cocteles',34,'Long Island'),('cocteles',35,'Elan Tropical'),('cocteles',36,'Perla Roja'),
  ('cocteles',37,'Mula Botánica'),('cocteles',38,'Apple Fizz'),('cocteles',39,'Virgin Mary'),('cocteles',40,'La Bella y la Bestia'),
  ('cocteles',41,'Green Lander'),
  -- COMBINADOS - Rones
  ('combinados',1,'Barceló'),('combinados',2,'Santa Teresa'),('combinados',3,'Habana 7'),('combinados',4,'Santísima Trinidad'),
  ('combinados',5,'Kraken'),('combinados',6,'Cuba Libre'),('combinados',7,'MG Paradiso'),('combinados',8,'Brugal'),
  -- COMBINADOS - Ginebras
  ('combinados',9,'Seagrams'),('combinados',10,'Beefeater'),('combinados',11,'Tanqueray'),('combinados',12,'Gin Le Tribute'),
  ('combinados',13,'Destornillador'),('combinados',14,'Kendal'),('combinados',15,'Nordés'),('combinados',16,'Brockmans'),
  ('combinados',17,'Martin Miller''s'),('combinados',18,'G''Vine'),('combinados',19,'Roku'),('combinados',20,'Hendrick''s'),
  ('combinados',21,'Plymouth'),('combinados',22,'Sipsmith'),('combinados',23,'Bombay Sapphire'),('combinados',24,'MG Rosa'),
  ('combinados',25,'Grey Goose'),('combinados',26,'Haku'),('combinados',27,'Ciroc'),('combinados',28,'Gin Raw'),
  ('combinados',29,'Monkey 47'),('combinados',30,'London Nº1'),('combinados',31,'Le Bombay'),
  -- COMBINADOS - Whiskies
  ('combinados',32,'Red Label'),('combinados',33,'Black Label'),('combinados',34,'Jameson'),('combinados',35,'Macallan'),
  ('combinados',36,'Macallan 15'),('combinados',37,'Macallan 18'),('combinados',38,'Zacapa'),('combinados',39,'Matusalem'),
  ('combinados',40,'Licor 43'),('combinados',41,'Ron 311'),('combinados',42,'Toki'),('combinados',43,'Yamazaki'),
  ('combinados',44,'Hibiki'),('combinados',45,'Hakushu'),('combinados',46,'Chita'),('combinados',47,'Legendario'),
  ('combinados',48,'Glenfiddich 15'),('combinados',49,'Laphroaig'),('combinados',50,'Deacon'),('combinados',51,'Jack Daniel''s'),
  ('combinados',52,'Glenfiddich 12'),('combinados',53,'Santísima Trinidad 7'),('combinados',54,'Ballantine''s'),('combinados',55,'Flaming Pig'),
  ('combinados',56,'Angelillo'),
  -- COMBINADOS - Otros
  ('combinados',57,'Cointreau'),('combinados',58,'Koi'),
  -- REFRESCOS
  ('refrescos',1,'Coca-Cola'),('refrescos',2,'Coca-Cola Zero'),('refrescos',3,'Bitter Kas'),('refrescos',4,'Aquarius'),
  ('refrescos',5,'Nestea'),('refrescos',6,'Bliss Naranja'),('refrescos',7,'Agua'),('refrescos',8,'Agua con Gas'),
  ('refrescos',9,'Kas Limón'),('refrescos',10,'Zumo Piña'),('refrescos',11,'Zumo Ace'),('refrescos',12,'Zumo Melocotón'),
  ('refrescos',13,'Zumo Tomate'),('refrescos',14,'Zumo Mango Maduro'),('refrescos',15,'Zumo Manzana'),('refrescos',16,'7UP'),
  ('refrescos',17,'Mosto'),('refrescos',18,'Kalimotxo'),('refrescos',19,'Tónica'),('refrescos',20,'Monster'),
  ('refrescos',21,'Agua Grande'),('refrescos',22,'Mosto Grande'),('refrescos',23,'Le Tribute'),
  -- VINO
  ('vino',1,'Cueva Tinto'),('vino',2,'Viuda Negra'),('vino',3,'Viuda Negra Crianza'),('vino',4,'Heras Cordón'),
  ('vino',5,'Tras las Cepas'),('vino',6,'Hito'),('vino',7,'Boyante'),('vino',8,'Chardonnay'),
  ('vino',9,'Godello'),('vino',10,'Albariño'),('vino',11,'Txakoli Vizcaíno'),('vino',12,'Txakoli Gipuzkoa'),
  ('vino',13,'Cueva Blanco'),('vino',14,'Anahi'),('vino',15,'Moscatel'),('vino',16,'Cava'),
  ('vino',17,'Noc'),('vino',18,'Heras Cordón Verdejo'),
  -- VERMOUTH
  ('vermouth',1,'Vermut Rojo'),('vermouth',2,'Vermut Blanco'),('vermouth',3,'Suplemento Campari'),('vermouth',4,'Vermut Preparado'),
  -- CERVEZA
  ('cerveza',1,'Zurito Bodega'),('cerveza',2,'Zurito'),('cerveza',3,'Jarra'),('cerveza',4,'Pinta Rubia'),
  ('cerveza',5,'Pinta Tostada'),('cerveza',6,'1906'),('cerveza',7,'1906 Red'),('cerveza',8,'Zurito Tostado'),
  ('cerveza',9,'Zurito Radler'),('cerveza',10,'Radler'),('cerveza',11,'Jarra 1906'),('cerveza',12,'Jarra Radler'),
  ('cerveza',13,'Pinta Radler'),('cerveza',14,'1/3'),('cerveza',15,'Moretti'),('cerveza',16,'Paulaner'),
  ('cerveza',17,'Mahou'),('cerveza',18,'Estrella Reposada'),('cerveza',19,'Mahou Pequeña'),
  -- CAFES
  ('cafes',1,'Suplemento Hielo'),('cafes',2,'Café con Leche'),('cafes',3,'Café Cortado'),('cafes',4,'Café Exprés'),
  ('cafes',5,'Café Americano'),('cafes',6,'Café Capuccino'),('cafes',7,'Café Frappé'),('cafes',8,'Café Escocés'),
  ('cafes',9,'Suplemento Baileys'),('cafes',10,'Infusión'),('cafes',11,'Café Irlandés'),('cafes',12,'Zumo Desayuno'),
  ('cafes',13,'Cola Cao'),('cafes',14,'Suplemento Vaso'),('cafes',15,'Mocca'),('cafes',16,'Frappé'),
  -- ORUJOS
  ('orujos',1,'Baileys Copa'),('orujos',2,'Baileys Txupito'),('orujos',3,'Orujo Copa'),('orujos',4,'Orujo Txupito'),('orujos',5,'Puro (habano)'),
  -- PICOTEO
  ('picoteo',1,'Pulguita Jamón'),('picoteo',2,'Pulguita Bonito'),('picoteo',3,'Gilda Especial'),('picoteo',4,'Piparras Fritas'),
  ('picoteo',5,'Rabas'),('picoteo',6,'Aceitunas'),('picoteo',7,'Patatas'),('picoteo',8,'Croquetas (4 uds)'),
  ('picoteo',9,'Media Ración'),('picoteo',10,'Media Tabla'),
  -- DESAYUNO
  ('desayuno',1,'Tortillas'),('desayuno',2,'Tostas'),('desayuno',3,'Tortitas'),('desayuno',4,'Croissant'),
  ('desayuno',5,'Bowl'),('desayuno',6,'Dulce'),('desayuno',7,'Brunch'),('desayuno',8,'Zumo Desayuno'),
  ('desayuno',9,'Suplemento Ingrediente'),('desayuno',10,'Suplemento Vaso'),('desayuno',11,'Pulguita')
)
insert into restaurant.productos (cliente_id, categoria_id, nombre, precio_centimos, disponible, orden)
select 'e73669e4-7951-41f0-aa9a-16b391d0015c', cat.id, items.nombre, 0, false, items.orden
from items join cat on cat.slug = items.slug;

-- Hacer visibles todos los productos nuevos aunque el precio siga a 0
-- (se completan precios reales desde el panel de gestión)
update restaurant.productos
set disponible = true
where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and categoria_id is not null;
