# Palomita Bar — Arquitectura

Estado: **Fases 0 a 9 completadas.** Quedan acciones puntuales de Fase 10 (dominio propio,
cuenta de Stripe real) que son decisiones/credenciales del usuario, detalladas en §10.
Resumen: schema `restaurant` aplicado en el proyecto Supabase compartido, en producción en
`palomita-bar.vercel.app`; web pública, pedido en mesa con carrito y pago (local funcionando
end-to-end, online con Stripe Checkout + webhook implementado y a falta solo de credenciales
reales), cocina en vivo con Realtime, y panel de administración completo (productos,
categorías, mesas con QR descargable, ventas del día, configuración de horario). Auditoría de
seguridad (Fase 8) encontró y corrigió un fallo real de aislamiento por tenant en las RPC de
admin (§8). Verificación funcional (Fase 9) ejecutada contra la base de datos real: 8/8 PASS
(§9).

---

## 1. Resumen ejecutivo

Palomita Bar es un tenant nuevo dentro de la infraestructura Supabase compartida de LocalIA
(proyecto `LocalIA-Soluciones-Digitales`, ref `ukhfaphloxlszomccgde`). LocalIA **ya tiene**
un sistema multi-tenant real en producción, usado hoy por otro cliente (`Pescados y Mariscos
Arrantza`, tienda de pescado con pedido a domicilio/recogida). No se crea una base de datos
nueva ni un mecanismo de tenants nuevo: Palomita se da de alta como una fila más en la tabla
`clientes` existente y reutiliza el patrón `cliente_id` + `site_key` + funciones RPC.

Lo que existe hoy **encaja parcialmente**: el patrón de aislamiento multi-tenant, RLS,
autenticación y RPC es 100% reutilizable tal cual. Las tablas `productos` y `pedidos`, en
cambio, están modeladas para un negocio de "pedido a domicilio de pescado" (categorías fijas
tipo pescado/marisco, precio en texto, `items` como JSON, sin mesas, sin cocina, sin pagos) y
no representan un pedido en mesa con estados de cocina y Stripe.

**Enfoque de plataforma, no solo de este proyecto.** LocalIA va a seguir dando de alta
clientes con modelos de negocio distintos sobre esta misma base de datos. Seguir añadiendo
tablas al schema `public` con nombres cada vez más específicos para evitar chocar con las de
otros clientes (`productos_carta`, `pedidos_mesa`...) no escala. El plan de datos de Palomita
(§4) organiza esto de raíz: `public` se queda como el **núcleo de la plataforma** (tenants,
usuarios, funciones de aislamiento, tablas realmente genéricas) y cada modelo de negocio vive
en su propio **schema de Postgres** dentro de la misma base de datos — para Palomita, el
schema `restaurant`, reutilizable tal cual por cualquier bar/restaurante futuro. Sigue siendo
una única base de datos centralizada; lo que cambia es que un cliente nuevo nunca puede
colisionar con el esquema de otro, sin necesidad de convenciones de nombres ad-hoc. Cero
`ALTER TABLE`, cero `DROP` sobre lo existente, cero riesgo sobre el cliente ya en producción.

---

## 2. Auditoría del entorno local

| Elemento | Resultado |
|---|---|
| Repositorio Git local | No existía. Creado en `C:\Users\edossantos\Palomita-Bar`. |
| Repo GitHub remoto | `https://github.com/LocalIA-Soluciones-Digitales/Palomita-Bar` — **existe y está vacío** (`git ls-remote` responde sin refs, exit 0). |
| GitHub CLI (`gh`) | **No instalado** en esta máquina. |
| Credenciales Git para GitHub | **No se encontró ninguna credencial cacheada** (Windows Credential Manager sin entradas `git:https://github.com`, sin `GH_TOKEN`/`GITHUB_TOKEN` en el entorno). El push probablemente pedirá autenticación interactiva, que este entorno no puede completar. |
| Node.js / npm | **No instalados** en esta máquina (ni en Git Bash ni en PowerShell). No se puede ejecutar `npm install`, build, lint ni tests localmente todavía. |
| Vercel | Cuenta conectada solo tiene el team personal `edortadossantos-projects` (`team_q6SQ30xGmr4Hs1zUpdSmwhXz`). No existe (o no es visible) un team/organización llamado "LocalIA Soluciones Digitales". No relevante ahora mismo (el usuario ha pedido posponer el despliegue a Vercel), pero habrá que resolverlo antes de la Fase 10. |
| Proyecto hermano de referencia | `C:\Users\edossantos\Pescados-Mariscos-Arrantza` — cliente real de LocalIA sobre la misma Supabase. Usa Vite + React + TS (no Next.js), Tailwind, i18n es/eu, Cloudflare Turnstile, y **toda su escritura a base de datos pasa por funciones RPC `SECURITY DEFINER`** (nunca INSERT/UPDATE directo desde el cliente). Ese patrón de "nunca confiar en el cliente, todo pasa por una función que resuelve el tenant desde `site_key`" es exactamente el que pide el prompt (regla 60) y se reutiliza para Palomita. |

**Bloqueos identificados (no puedo resolverlos por mi cuenta):**
1. **Push a GitHub**: sin `gh` ni credenciales cacheadas, necesito que el usuario autentique (`gh auth login`, o un Personal Access Token, o que haga el primer push manualmente) para poder subir el repo.
2. **Node.js**: puedo escribir todo el código a mano, pero no puedo instalar dependencias ni verificar build/lint/tests hasta que Node esté disponible (aquí o en el pipeline de Vercel).
3. **Vercel org "LocalIA Soluciones Digitales"**: no visible desde esta cuenta conectada. Se resolverá en la fase de despliegue, no bloquea el trabajo actual.

---

## 3. Auditoría de Supabase (`ukhfaphloxlszomccgde`)

### 3.1 Tablas existentes (schema `public`)

| Tabla | Función | Aislamiento |
|---|---|---|
| `clientes` | **Registro de tenants.** `id`, `nombre_negocio`, `slug`, `tipo_proyecto` (`web`/`ecommerce`/`saas`), `contacto_*`, `estado` (`activo`/`pausado`/`baja`), `site_key` (uuid único, es el identificador público que usa el frontend), `notas`, timestamps. | Es la tabla raíz de tenant. |
| `usuarios_negocio` | Vincula `auth.users` con un `cliente_id` y un `rol`. Hoy el `CHECK` de `rol` solo permite `'gestion'`. | `user_id` → `auth.users`, `cliente_id` → `clientes`. |
| `productos` | Catálogo. Pensado para pescadería: `categoria` con `CHECK` fijo (`pescado`,`especial`,`raciones`,`marisco`), `precio` como **texto**, `stock_kg`, `stock_minimo`, sin alérgenos ni modificadores. | `cliente_id` FK. |
| `pedidos` | Pedido. `items` es un **jsonb** (no hay `order_items` relacional), `metodo_entrega` `CHECK` (`home`/`pickup`), `estado` `CHECK` (`nuevo`/`confirmado`/`completado`/`cancelado`). Sin mesa, sin pago, sin Stripe. | `cliente_id` FK. |
| `resenas`, `newsletter_subscribers`, `visits`, `error_logs`, `settings` | Genéricas, sin nada específico de pescadería. Reutilizables tal cual. | `cliente_id` FK. |
| `*_backup_20260810` (productos, pedidos, resenas, settings, visits, newsletter_subscribers, error_logs) | Copias de seguridad de una migración de LocalIA del 10/08. RLS activado sin políticas (aviso INFO del linter). **No tocar**, no son mías. | — |

### 3.2 Mecanismo multi-tenant ya existente (reutilizado tal cual)

```sql
-- Resuelve el tenant a partir de la site_key pública (nunca se acepta tenant_id del cliente)
cliente_id_from_site_key(p_site_key uuid) → uuid   -- SECURITY DEFINER, STABLE

-- Resuelve el tenant del usuario autenticado (para /admin)
mi_cliente_id() → uuid                              -- SECURITY DEFINER, STABLE, via usuarios_negocio.user_id = auth.uid()

-- Existe además is_developer() (no auditada en detalle, pero es el check de SUPER_ADMIN de LocalIA)
```

- **Lectura pública**: el frontend nunca hace `SELECT` directo sobre `productos`/`pedidos` (RLS no tiene política para `anon` en esas tablas). Todo pasa por RPC `SECURITY DEFINER` que reciben `site_key`, resuelven el `cliente_id` en servidor y filtran internamente. Ej: `get_productos_publico(p_site_key)`.
- **Escritura pública**: igual, vía RPC (`crear_pedido`, `crear_resena`, `crear_newsletter_subscriber`, `crear_error_log`, `registrar_visita`), todas resolviendo `cliente_id` desde `site_key` dentro de la función, nunca desde un parámetro `tenant_id` directo.
- **Panel admin (`authenticated`)**: políticas RLS `is_developer() OR cliente_id = mi_cliente_id()` en SELECT/INSERT/UPDATE/DELETE. Esto ya es exactamente el patrón SUPER_ADMIN / TENANT_ADMIN que pide la sección 37 del brief.
- El aviso del linter de seguridad ("las funciones SECURITY DEFINER son ejecutables por `anon`") es **el diseño intencionado**, no un fallo: es la única vía de acceso público y cada función resuelve el tenant server-side. Se mantiene igual para Palomita.

Esto confirma exactamente lo que pedía el prompt: no hay que inventar un sistema de tenants
nuevo, hay que dar de alta a Palomita como fila en `clientes` y seguir el mismo patrón de
`site_key` + RPC.

### 3.3 Extensiones relevantes ya instaladas
`pgcrypto`, `uuid-ossp`, `pg_net`, `supabase_vault`, `pg_stat_statements`, `plpgsql`. `pg_cron` está disponible pero no instalada (podría usarse más adelante para limpieza de pedidos abandonados, no necesaria ahora).

### 3.4 Advisors de seguridad (estado actual, no generados por este proyecto)
- 7 avisos INFO de "RLS enabled sin policy" en las tablas `*_backup_20260810` — pertenecen a la migración de backup de LocalIA, no se tocan.
- Avisos WARN de "función SECURITY DEFINER ejecutable por anon/authenticated" en todas las RPC públicas — es el diseño intencionado explicado arriba.
- WARN de "leaked password protection disabled" en Auth — configuración global de LocalIA, no específica de un tenant; se deja fuera de alcance de este proyecto salvo que el usuario pida activarlo.

---

## 4. Estrategia de plataforma multi-tenant (propuesta — pendiente de confirmación)

**Un schema de Postgres por vertical de negocio, dentro de la misma base de datos.**
`public` pasa a ser el núcleo compartido de toda la plataforma LocalIA. Cada modelo de
negocio (pedido en mesa, reservas, tienda online, lo que venga) vive en su propio schema,
con sus propias tablas, sin tocar `public` ni el schema de ningún otro vertical. Un cliente
nuevo de un vertical ya existente (otro bar, otro restaurante) reutiliza el schema tal cual;
un cliente de un modelo de negocio nuevo simplemente añade un schema más. Nada de esto es
infraestructura nueva: sigue siendo un único proyecto Supabase, una única base de datos
Postgres, un único `clientes` como registro de tenants.

### 4.1 `public` — núcleo de la plataforma (se reutiliza tal cual, cero cambios de esquema)
- `clientes` — Palomita es una fila nueva (`INSERT`, no `ALTER`): `slug = 'palomita-bar'`, `tipo_proyecto = 'web'`. Exactamente para esto existe la tabla.
- `usuarios_negocio` — staff de Palomita se da de alta con `INSERT` usando `rol = 'gestion'`, el único valor que el `CHECK` permite hoy. **No hace falta ampliar ese `CHECK`**: las políticas RLS auditadas (`is_developer() OR cliente_id = mi_cliente_id()`) no leen el valor de `rol`, solo `cliente_id`. Si más adelante hace falta distinguir permisos (p. ej. cocina no debería ver `/admin/ventas`), se resuelve con una tabla nueva `staff_permisos`, no ampliando este `CHECK`.
- `resenas`, `newsletter_subscribers`, `settings`, `visits`, `error_logs` — mismo esquema, mismo patrón RPC, sin cambios.
- Los helpers `cliente_id_from_site_key()`, `mi_cliente_id()`, `is_developer()` y el patrón de políticas RLS `is_developer() OR cliente_id = mi_cliente_id()` — se invocan desde cualquier schema (Postgres permite llamadas cross-schema sin restricción), no se modifican.

### 4.2 No se toca en absoluto
- `public.productos`, `public.pedidos` y sus `_backup_20260810`: cero `ALTER`, cero lectura/escritura desde el código de Palomita. Siguen siendo exclusivamente de Arrantza y de su vertical (catálogo + pedido a domicilio/recogida).

### 4.3 Schema nuevo `restaurant` — vertical "pedido en mesa" (reutilizable por cualquier bar/restaurante futuro)
```sql
CREATE SCHEMA restaurant;
```
Tablas, todas con `cliente_id → public.clientes.id` y RLS con el mismo patrón `is_developer() OR cliente_id = mi_cliente_id()`:
- `restaurant.categorias` (id, cliente_id, nombre, slug, orden).
- `restaurant.productos` (id, cliente_id, categoria_id, nombre, descripcion, precio_centimos integer, imagen_url, disponible, destacado, alergenos, orden, created_at, updated_at) — precio numérico desde el origen, sin el problema de `productos.precio` como texto.
- `restaurant.product_modifiers` / `restaurant.product_modifier_options` — arquitectura preparada para opciones de producto, sin necesidad de llenarla ya.
- `restaurant.mesas` (id, cliente_id, numero, identificador, activa, created_at, updated_at).
- `restaurant.pedidos` (id, cliente_id, mesa_id, estado, payment_method, payment_status, notas, created_at, updated_at) — estado propio del flujo de cocina (`RECEIVED/ACCEPTED/PREPARING/READY/DELIVERED/CANCELLED`), independiente del `estado` de `public.pedidos`.
- `restaurant.pedido_items` (id, pedido_id, producto_id, cantidad, precio_unitario_centimos, notas, modificadores jsonb) — líneas de pedido reales para cocina e informes.
- `restaurant.payments` (id, pedido_id, stripe_session_id, stripe_payment_intent_id, amount_centimos, status, created_at).
- `restaurant.pedido_estado_historial` (id, pedido_id, estado_anterior, estado_nuevo, user_id, motivo, created_at).

**Acceso.** Igual que el resto de la plataforma: el frontend público nunca hace `SELECT`/`INSERT` directo, todo pasa por funciones RPC en `public` que resuelven el tenant desde `site_key` y leen/escriben en `restaurant.*` internamente — mismo patrón que `get_productos_publico`/`crear_pedido`. No ha hecho falta exponer el schema `restaurant` en la configuración de API de Supabase (opción de proyecto compartida): las funciones `SECURITY DEFINER` en `public` operan sobre cualquier schema sin que este esté expuesto vía REST, así que no se ha tocado ninguna configuración a nivel de proyecto.

**Transiciones de estado validadas en el propio Postgres, no solo en la app.** Un trigger `restaurant.validar_transicion_estado_pedido()` en `BEFORE UPDATE OF estado` bloquea saltos no permitidos (p. ej. `DELIVERED → RECEIVED`) y registra automáticamente cada cambio en `pedido_estado_historial`, sea cual sea el camino por el que llegue el `UPDATE` (RPC, panel admin, lo que sea). Transiciones permitidas: `RECEIVED→ACCEPTED|CANCELLED`, `ACCEPTED→PREPARING|CANCELLED`, `PREPARING→READY|CANCELLED`, `READY→DELIVERED`.

**Realtime.** `restaurant.pedidos` y `restaurant.pedido_items` están añadidas a la publicación `supabase_realtime` (aditivo, no afecta a lo que ya hubiera ahí).

### 4.4 Estado: **aplicado** (2026-08-12)

Todo lo anterior ya está en el proyecto Supabase compartido:
- Schema `restaurant` con las 9 tablas, índices y RLS descritos arriba.
- Trigger de validación de transiciones de estado.
- Funciones RPC públicas: `get_categorias_publica`, `get_carta_publica`, `validar_mesa`, `crear_pedido_restaurant`, `get_pedido_publico` (todas `SECURITY DEFINER`, resuelven el tenant desde `site_key`, nunca confían en `producto_id`/precio/mesa enviados sin validar contra `restaurant.*`).
- Palomita dada de alta en `public.clientes` (`slug = 'palomita-bar'`).
- Carta sembrada en `restaurant.categorias`/`restaurant.productos` con el contenido real del PDF (14 categorías, ~35 productos) y una mesa de prueba (`numero = 1`).
- `get_advisors` (security) revisado tras aplicar: **sin hallazgos nuevos** más allá del mismo patrón ya aceptado (funciones `SECURITY DEFINER` ejecutables por `anon`, que es el diseño intencionado — ver §3.4).
- `site_key` de Palomita y credenciales públicas guardadas en `.env.local` (no commiteado).

Pendiente y fuera de alcance de esta fase: conectar el frontend Next.js a estas funciones (Fase 4), dashboard de cocina con Realtime (Fase 5), Stripe Checkout + webhook (Fase 6), panel de administración (Fase 7).

---

## 5. Stack

Next.js 15 (App Router) + TypeScript + Tailwind CSS, tal como pide el brief. Nota: el
proyecto hermano (Arrantza) usa Vite + React SPA, no Next.js — es una referencia de
convenciones (RPC-first, i18n, RLS), no un mandato de framework. Next.js está justificado
aquí porque Palomita necesita lógica de servidor real (validación de precios, webhook de
Stripe, realtime de cocina) que el brief pide explícitamente resolver con Route Handlers de
Next.js en Vercel.

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS.
- Datos: Supabase (Postgres, Auth, Storage, Realtime) — proyecto compartido `ukhfaphloxlszomccgde`.
- Pagos: Stripe Checkout + Webhooks (Route Handler `app/api/stripe/webhook/route.ts`, verificación de firma server-side).
- Hosting: Vercel (pendiente de resolver el team/org correcto — ver §2).
- Repo: `github.com/LocalIA-Soluciones-Digitales/Palomita-Bar`.

## 6. Estructura de carpetas (Fase 1, scaffold inicial)

```
app/
  (public)/
    page.tsx                # Home
    carta/page.tsx
    historia/page.tsx
    cocteleria/page.tsx
    galeria/page.tsx
    contacto/page.tsx
  pedir/page.tsx             # ?mesa=12
  pedido/[id]/page.tsx
  admin/...                  # Fase 7
  api/stripe/webhook/route.ts  # Fase 6
src/
  components/
  lib/
  types/
```

## 7. Variables de entorno (`.env.example`)

Ver `.env.example` en la raíz. Ningún secreto real se commitea; `.env.local` (gitignorado)
tiene los valores reales para desarrollo local.

**Pendiente de acción manual: no tengo forma de escribir variables de entorno en Vercel (solo
lectura de proyectos/deployments/logs vía MCP).** Hay que añadirlas a mano en el proyecto
`palomita-bar` de Vercel (Settings → Environment Variables, en Production y Preview) o el
build de `/carta` y `/cocteleria` seguirá fallando en cuanto intenten llamar a Supabase en
build time:

```
NEXT_PUBLIC_SUPABASE_URL=https://ukhfaphloxlszomccgde.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_CalLFpdGIixVv0fV3ic62w_fUH9qLqK
NEXT_PUBLIC_PALOMITA_SITE_KEY=5a3f0cfb-a01a-4f52-a74e-71dd45c90c52
NEXT_PUBLIC_SITE_URL=https://palomita-bar.vercel.app
```

`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` necesitan valores reales para que Stripe funcione (ver
§10). Además de las 4 de arriba, ahora también hacen falta en Vercel:

```
NEXT_PUBLIC_PALOMITA_CLIENTE_ID=e73669e4-7951-41f0-aa9a-16b391d0015c
SUPABASE_SERVICE_ROLE_KEY=<sacar del dashboard de Supabase, Project Settings > API>
STRIPE_SECRET_KEY=<de Stripe, modo test para empezar>
STRIPE_WEBHOOK_SECRET=<de Stripe, al configurar el endpoint del webhook>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<de Stripe>
```

## 8. Próximos pasos (por fase, según el brief)

- **Fase 1** ✅: scaffold Next.js/TS/Tailwind, identidad visual base.
- **Fase 2** ✅ (parcial): páginas públicas (home, historia, galería, contacto) con contenido de referencia. Historia/galería siguen pendientes de contenido real del negocio.
- **Fase 3** ✅: schema `restaurant` aplicado en Supabase (ver §4.4).
- **Fase 4** ✅: `/carta`, `/cocteleria` y `/pedir` conectados a las funciones RPC; carrito, checkout (solo pago en local) y `/pedido/[id]` funcionando end-to-end contra Supabase real.
- **Fase 5** ✅: `/admin/cocina` (Supabase Auth + Realtime) y `/pedido/[id]` con actualización automática (polling, ver §4.5).
- **Fase 6** ✅ código completo (ver §10) — falta solo la cuenta/claves reales de Stripe.
- **Fase 7** ✅: `/admin/productos`, `/admin/categorias`, `/admin/mesas` (con QR descargable), `/admin/ventas`, `/admin/configuracion` (ver §11).
- **Fase 8** ✅: auditoría de seguridad, con un hallazgo real corregido (ver §12).
- **Fase 9** ✅: verificación funcional ejecutada contra la base real, 8/8 PASS (ver §13, script en `supabase/tests/fase9_verificacion.sql`).
- **Fase 10**: SEO estructurado añadido (ver §14); dominio propio y monitorización quedan como decisión del usuario (ver §14).

### 4.5 Fase 5 — cocina y tiempo real (aplicado)

- Rutas reorganizadas en grupos: `app/(public)/...` (con el nav/footer de la web pública) y
  `app/admin/(protected)/...` (sin ese nav, protegido) + `app/admin/login` (sin proteger, para
  evitar un bucle de redirección). El layout raíz (`app/layout.tsx`) ya no pinta cabecera ni
  pie — eso vive solo en `app/(public)/layout.tsx`.
- Auth: `@supabase/ssr` con sesión por cookie (`middleware.ts` la refresca en cada petición a
  `/admin/*`). `/admin/(protected)/layout.tsx` exige sesión; si no hay, redirige a
  `/admin/login`.
- **No hace falta crear ningún usuario nuevo.** `is_developer()` (ya existente, ver §3.2)
  reconoce el email `edortadossantos@gmail.com` y la cuenta `admin@developers.local` como
  super-admin de LocalIA con acceso a todos los tenants — esta última ya existe y se usó esta
  semana en el proyecto de Arrantza. Cualquiera de las dos sirve para entrar en
  `/admin/cocina` de Palomita sin dar de alta nada en `usuarios_negocio`.
- `get_pedidos_cocina()` / `avanzar_pedido_cocina(pedido_id, nuevo_estado)`: RPC nuevas en
  `public`, `SECURITY INVOKER` (no `DEFINER`) — se ejecutan como el usuario autenticado, así
  que las políticas RLS de `restaurant.pedidos`/`pedido_items` ya existentes hacen todo el
  aislamiento por tenant sin lógica extra. El trigger de transición de estado (§4.4) sigue
  aplicando igual, venga la `UPDATE` de esta función o de cualquier otro sitio.
- El tablero de cocina (`KitchenBoard`) se suscribe con Realtime a `restaurant.pedidos` y
  `restaurant.pedido_items` — como el cliente va autenticado, RLS también filtra los eventos
  de Realtime por tenant automáticamente.
- `/pedido/[id]` es público (`anon`), y `anon` no tiene política de `SELECT` sobre
  `restaurant.pedidos` — por diseño (§3.2), así que no puede usar Realtime ahí (no recibiría
  eventos). En vez de montar un mecanismo de *broadcast* solo para este caso, hace *polling*
  cada 5s a `get_pedido_publico` mientras el pedido no esté en un estado final. Es una
  simplificación consciente, no una limitación técnica de fondo.

## 9. Datos de contacto públicos (verificados desde el PDF de la carta, sin inventar nada)
- Dirección: Gernikako Arbola Etorbidea 6A, 48902 Barakaldo, Bizkaia.
- Teléfono: +34 686 53 03 10.
- Instagram: @palomita_bar.
- Horarios: no confirmados en ninguna fuente auditada — editable desde `/admin/configuracion` (ver §11), se muestra en `/contacto` en cuanto se rellene.

## 10. Fase 6 — Stripe (aplicado, falta credenciales reales)

Flujo exacto al brief (sección 25 del prompt original): el pedido se crea primero
(`crear_pedido_restaurant`, `payment_method = 'ONLINE'`, `payment_status = 'PENDING'`), luego
se crea la sesión de Stripe, y **la confirmación real llega solo por webhook, nunca por la
redirección del navegador**.

- `POST /api/stripe/checkout`: recibe `{ pedidoId }`, llama a la RPC nueva
  `get_pedido_para_pago(pedido_id)` (pública, igual de expuesta que `get_pedido_publico` — el
  UUID no adivinable es la autorización) para construir los `line_items` con los precios
  reales de `restaurant.productos`, verifica que el pedido sea `ONLINE`+`PENDING`, crea la
  Stripe Checkout Session y devuelve su URL.
- `POST /api/stripe/webhook`: verifica la firma con `STRIPE_WEBHOOK_SECRET` **antes** de tocar
  nada. En `checkout.session.completed`, llama a `marcar_pedido_pagado(...)` usando la
  **service role** (`src/lib/supabase/service-role.ts`, con `import "server-only"` para que el
  build falle si algún día se importa por error desde un componente cliente).
- `marcar_pedido_pagado` tiene el `EXECUTE` revocado de `anon`/`authenticated` y solo
  concedido a `service_role` — comprobado en el advisor de seguridad (§12) que no aparece como
  ejecutable por `anon`, a diferencia de las funciones públicas. Si cualquiera con la clave
  anon (pública, está en el bundle del navegador) pudiera llamar a esto, podría marcar
  cualquier pedido como pagado sin pagar.
- `get_pedidos_cocina()` se actualizó para no mostrar pedidos `ONLINE` con `payment_status`
  distinto de `PAID` — cocina nunca debe preparar un pedido online que no se ha cobrado
  todavía.
- Carrito: el toggle "pagar online" ya funciona (antes estaba deshabilitado). Al confirmar con
  pago online, crea el pedido y redirige de verdad a Stripe (`window.location.href`).

**Manual, imprescindible para que esto funcione:**
1. Crear/usar una cuenta de Stripe (modo test para probar).
2. Añadir en Vercel (Production + Preview): `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. En el dashboard de Stripe, crear un endpoint de webhook apuntando a
   `https://palomita-bar.vercel.app/api/stripe/webhook`, evento `checkout.session.completed`,
   y copiar el *signing secret* a `STRIPE_WEBHOOK_SECRET` en Vercel.
4. Añadir también `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → `service_role`) y `NEXT_PUBLIC_PALOMITA_CLIENTE_ID` (ver §7).
5. Redeploy.

Sin esto, "pagar en local" sigue funcionando perfectamente — solo "pagar online" queda a
medias hasta que se configure.

## 11. Fase 7 — Administración (aplicado)

Todo bajo `/admin`, protegido por el mismo `Supabase Auth` de la Fase 5 (`is_developer()` o
un futuro `usuarios_negocio` específico de Palomita):

- **`/admin/categorias`**: alta/edición/borrado. El `slug` se genera automáticamente del
  nombre.
- **`/admin/productos`**: alta/edición/borrado, categoría, precio, disponible/destacado.
  Marcar "no disponible" lo retira al instante de `/carta`, `/cocteleria` y `/pedir` (esas
  páginas ya filtran por `disponible = true`).
- **`/admin/mesas`**: crear mesas por número, activar/desactivar, **generar y descargar el QR**
  (paquete `qrcode`, renderizado como PNG en el propio navegador — apunta a
  `NEXT_PUBLIC_SITE_URL/pedir?mesa=<identificador>`) y regenerarlo (invalida el QR impreso
  anterior).
- **`/admin/ventas`**: pedidos de hoy, ventas, ticket medio, pedidos en curso, desglose
  pago local/online, productos más vendidos — todo vía `get_ventas_hoy_admin()`.
- **`/admin/configuracion`**: horario del local, reutilizando la tabla `public.settings` ya
  existente (no se crea tabla nueva) — se refleja en `/contacto` público.
- Todas las funciones RPC de admin son `SECURITY INVOKER` y reciben `p_cliente_id`
  explícitamente (ver el hallazgo de seguridad en §12) — no dependen únicamente de la RLS para
  aislar por tenant.

No manual aquí: funciona con la misma sesión de `/admin/cocina`.

## 12. Fase 8 — Auditoría de seguridad

- `get_advisors` (security) revisado tras cada migración de esta sesión: **sin hallazgos
  nuevos** más allá del patrón ya aceptado (funciones públicas `SECURITY DEFINER` ejecutables
  por `anon`, que es el diseño intencionado, ver §3.4) y las 7 notas INFO preexistentes de las
  tablas `*_backup_20260810` de Arrantza, que no son mías.
- **Hallazgo real, corregido**: `get_categorias_admin()`, `get_productos_admin()`,
  `get_mesas_admin()`, `get_ventas_hoy_admin()` y las mutaciones de admin no filtraban por
  `cliente_id` — se apoyaban solo en la RLS. Para un `TENANT_ADMIN` normal (`mi_cliente_id()`)
  eso ya bastaba, pero `is_developer()` (la cuenta que usa el panel de Palomita) **ve todos los
  tenants por diseño**, así que sin el filtro, el panel de Palomita habría mostrado — y
  permitido editar o borrar — datos de cualquier otro tenant futuro que reutilizara el schema
  `restaurant`. Corregido añadiendo `p_cliente_id` explícito a las 8 funciones afectadas y
  comprobando pertenencia al tenant también en los `UPDATE`/`DELETE`, no solo en el `INSERT`.
  Con un solo tenant activo (Palomita) en `restaurant` hoy, no era explotable todavía, pero sí
  lo habría sido en cuanto se diera de alta un segundo cliente con el mismo modelo de negocio.
- Confirmado que `marcar_pedido_pagado` (la función que marca un pago como cobrado) no aparece
  en ningún advisor como ejecutable por `anon`/`authenticated` — solo `service_role`.
- Verificado que ningún endpoint nuevo (`/api/stripe/*`) expone `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET` ni `SUPABASE_SERVICE_ROLE_KEY` al cliente — viven solo en módulos
  marcados `import "server-only"`, y ninguna página ni componente `"use client"` los importa.
- Autorización revisada en servidor, no solo ocultando botones: todas las mutaciones de
  `/admin` pasan por RPC con `SECURITY INVOKER`/RLS o `SECURITY DEFINER` con `GRANT` explícito,
  nunca por lógica que se pueda saltar cambiando el JS del navegador.

## 13. Fase 9 — Verificación funcional

Sin Node.js disponible en esta máquina para ejecutar un framework de tests (Vitest/Jest), se
optó por verificar las reglas de negocio críticas **ejecutándolas de verdad** contra el
Supabase real, en vez de escribir tests JS que no se podían correr ni comprobar. Script
completo en `supabase/tests/fase9_verificacion.sql`, con limpieza de los datos de prueba al
terminar (verificado que no queda ningún resto). Resultado, 2026-08-12: **8/8 PASS**:

1. El precio guardado en `pedido_items` es el de `restaurant.productos`, nunca uno inventado (la propia función ni acepta un precio como parámetro).
2. Una transición de estado que se salta pasos (`RECEIVED → READY`) es rechazada por el trigger.
3. La secuencia completa válida (`RECEIVED → ACCEPTED → PREPARING → READY → DELIVERED`) funciona y queda registrada automáticamente en `pedido_estado_historial` (4 filas).
4. `DELIVERED` es un estado terminal: no se puede volver a `RECEIVED`.
5. `get_pedido_publico` refleja el estado real tras las transiciones.
6. Una `site_key` inventada no devuelve productos de ningún tenant (aislamiento multi-tenant).
7. `validar_mesa` rechaza un identificador de mesa que no existe.
8. `crear_pedido_restaurant` rechaza un producto marcado como no disponible.

Es una suite manual, no un pipeline de CI — queda documentada para volver a correrla a mano
tras cualquier cambio en `restaurant.*` o sus funciones. Cuando haya Node.js disponible (aquí
o en CI), lo natural es complementarla con tests de componente para el carrito/checkout, que
esta suite no cubre.

## 14. Fase 10 — Producción

Aplicado:
- **SEO estructurado**: JSON-LD `BarOrPub` (schema.org) en `app/(public)/layout.tsx` con
  dirección, teléfono e Instagram — además del `sitemap.xml`/`robots.txt`/metadata ya de la
  Fase 1.
- **Performance**: fuentes vía `next/font` (sin bloquear render), ISR de 60s en `/carta`,
  `/cocteleria` y `/contacto`, sin dependencias pesadas innecesarias añadidas en ninguna fase.
- **Monitorización**: comprobado con `get_runtime_errors` de Vercel — sin errores en
  producción a fecha de hoy. Vercel ya da logs/analytics básicos sin configuración adicional.

Pendiente, son decisiones/acciones del usuario, no código:
- **Dominio propio (`palomitabar.es`)**: no lo he comprado ni configurado — es una decisión y
  un gasto real. Si se quiere, dímelo y lo compruebo/gestiono con las herramientas de Vercel
  (o se añade manualmente en Vercel → Domains si ya se posee).
- **Cuenta de Stripe real** (ver §10).
- La organización "LocalIA Soluciones Digitales" no existe (o no es visible) en Vercel — el
  proyecto vive en la cuenta personal `edortadossantos-projects`. No bloquea nada hoy, pero si
  la idea es centralizar varios clientes bajo una organización de Vercel propia de LocalIA,
  es el momento de crearla y mover el proyecto.

## 15. Resumen: qué tienes que hacer tú, por fase

| Fase | ¿Acción manual? |
|---|---|
| 0-5 | Ya resueltas (variables de Supabase en Vercel, ya añadidas). |
| 6 (Stripe) | **Sí** — cuenta de Stripe, 3 claves + configurar el webhook en su dashboard (ver §10). |
| 7 (Admin) | No — funciona con la sesión que ya usas en `/admin/cocina`. |
| 8 (Seguridad) | No. |
| 9 (Testing) | No. |
| 10 (Producción) | Opcional — dominio propio y decidir si mover el proyecto a una organización de Vercel de LocalIA (ver §14). |
