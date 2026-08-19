-- Había dos overloads de crear_reserva_publica (uno sin p_email, otro con
-- p_email + teléfono obligatorio) que hacían ambigua cualquier llamada RPC
-- sin p_email, rompiendo el formulario público de reservas.
--
-- Se elimina el overload ANTIGUO (7 parámetros, sin p_email, teléfono
-- opcional). El overload NUEVO (8 parámetros, con p_email, teléfono
-- obligatorio) se deja tal cual: ya existe en la base de datos y coincide
-- con el formulario de reservas (ReservaForm.tsx / queries.ts) que añade el
-- campo de correo y exige teléfono.
--
-- Importante: hasta que esos cambios de frontend se desplieguen, cualquier
-- reserva enviada sin teléfono recibirá el error de validación "Falta el
-- teléfono para la reserva" en vez del crash de función ambigua.

drop function if exists public.crear_reserva_publica(
  uuid, text, integer, date, time without time zone, text, text
);
