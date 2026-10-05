-- Fotos rehechas con Gemini (referencia de estilo de la propia carta) — 2026-10-05.
-- Tanqueray y Zacapa tenían la botella cortada por el borde; Macallan 18, Café
-- Exprés, Café Capuccino y Mocca tenían fondo claro y desentonaban con la carta.
-- Se subieron sobrescribiendo el mismo archivo en palomita-bar/carta/; ?v=2
-- salta la caché de la CDN y del optimizador de imágenes de Next.

begin;

update restaurant.productos
set imagen_url = split_part(imagen_url, '?', 1) || '?v=2', updated_at = now()
where cliente_id = 'e73669e4-7951-41f0-aa9a-16b391d0015c'
  and split_part(imagen_url, '?', 1)
      ~ '/carta/(tanqueray|zacapa|macallan18|cafeexpres|cafecapuccino|mocca)\.webp$';

commit;
