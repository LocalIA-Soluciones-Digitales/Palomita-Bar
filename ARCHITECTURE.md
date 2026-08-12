# Palomita Bar — Arquitectura

Estado: **Fase 0 (auditoría) completada.** Fase 3 (migraciones Supabase) está **propuesta pero NO aplicada** — pendiente de confirmación explícita antes de tocar la base de datos compartida.

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
no representan un pedido en mesa con estados de cocina y Stripe. Por eso el plan de datos de
Palomita (§4) **no modifica el esquema de ninguna tabla existente**: solo añade tablas nuevas,
propias del modelo de pedido en mesa, y dos `INSERT` en `clientes`/`usuarios_negocio` (para
eso están pensadas). Cero `ALTER TABLE`, cero `DROP`, cero riesgo sobre el cliente ya en
producción.

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

## 4. Qué se reutiliza / qué se crea (propuesta — pendiente de confirmación)

**Revisión tras feedback: plan de exposición cero sobre las tablas existentes.** La primera
versión de este plan (§4, versión anterior) proponía extender `productos`/`pedidos`/
`usuarios_negocio` con columnas nuevas *nullable* y ampliar un `CHECK`. Eso no es destructivo
en Postgres (`ALTER TABLE ADD COLUMN` nullable es un cambio de metadatos, no reescribe filas;
ampliar un `CHECK` no invalida valores existentes), pero sigue siendo tocar el DDL de tablas
que usa un cliente real en producción (Arrantza). Dado que `productos`/`pedidos` tampoco
encajan estructuralmente con el modelo de pedido en mesa (ver §3.1), no hace falta forzar el
reuso: se sustituye por un plan que **no ejecuta ni un solo `ALTER TABLE` ni `DROP` sobre
tablas existentes**, solo `CREATE TABLE` nuevas y los `INSERT` que la propia tabla `clientes`
está pensada para recibir.

### 4.1 Se reutiliza tal cual (cero cambios de esquema, solo lectura/INSERT)
- `clientes` — Palomita es una fila nueva (`INSERT`, no `ALTER`): `slug = 'palomita-bar'`, `tipo_proyecto = 'web'`. Exactamente para esto existe la tabla.
- `usuarios_negocio` — staff de Palomita se da de alta con `INSERT` usando `rol = 'gestion'`, el único valor que el `CHECK` permite hoy. **No hace falta ampliar ese `CHECK`**: las políticas RLS auditadas (`is_developer() OR cliente_id = mi_cliente_id()`) no leen el valor de `rol`, solo `cliente_id`. Si más adelante hace falta distinguir permisos (p. ej. cocina no debería ver `/admin/ventas`), se resuelve con una tabla nueva `staff_permisos` (cliente_id, user_id, permisos jsonb) — de nuevo, `CREATE TABLE`, no `ALTER`.
- `resenas`, `newsletter_subscribers`, `settings`, `visits`, `error_logs` — mismo esquema, mismo patrón RPC, sin cambios.
- Los helpers `cliente_id_from_site_key()`, `mi_cliente_id()`, `is_developer()` y el patrón de políticas RLS `is_developer() OR cliente_id = mi_cliente_id()` — se invocan, no se modifican.

### 4.2 No se toca en absoluto
- `productos`, `pedidos` y sus `_backup_20260810`: cero `ALTER`, cero lectura/escritura desde el código de Palomita. Siguen siendo exclusivamente de Arrantza.

### 4.3 Se crea nuevo (tablas propias, `CREATE TABLE` puro, tenant-scoped vía `cliente_id`)
Nombradas para no colisionar con `productos`/`pedidos` (que quedan como el modelo de
catálogo/pedido a domicilio de Arrantza) y quedar disponibles para cualquier tenant futuro con
pedido en mesa:
- `categorias` (id, cliente_id, nombre, slug, orden).
- `productos_carta` (id, cliente_id, categoria_id, nombre, descripcion, precio_centimos integer, imagen_url, disponible, destacado, alergenos, orden, created_at, updated_at) — precio numérico desde el origen, sin el problema del `precio text` de `productos`.
- `mesas` (id, cliente_id, numero, identificador, activa, created_at, updated_at).
- `pedidos_mesa` (id, cliente_id, mesa_id, estado, payment_method, payment_status, notas, created_at, updated_at) — estado propio (`RECEIVED/ACCEPTED/PREPARING/READY/DELIVERED/CANCELLED`), sin mezclarlo con el `estado` de `pedidos`.
- `pedidos_mesa_items` (id, pedido_mesa_id, producto_id, cantidad, precio_unitario_centimos, notas, modificadores jsonb) — líneas de pedido reales para cocina e informes.
- `payments` (id, pedido_mesa_id, stripe_session_id, stripe_payment_intent_id, amount_centimos, status, created_at).
- `pedido_mesa_estado_historial` (id, pedido_mesa_id, estado_anterior, estado_nuevo, user_id, motivo, created_at).
- `product_modifiers` / `product_modifier_options` (arquitectura preparada, sin necesidad de llenarla ya).

Todas llevan `cliente_id`, cubiertas por RLS con el mismo patrón `is_developer() OR cliente_id = mi_cliente_id()` para admin/cocina, y acceso público exclusivamente vía funciones RPC nuevas (`get_carta_publica(site_key)`, `crear_pedido_mesa(site_key, mesa_id, items, ...)`) que resuelven el tenant desde `site_key`, siguiendo el mismo patrón que `get_productos_publico`/`crear_pedido`.

**Nada de esto se ejecuta todavía.** Es la propuesta de migración para la Fase 3. Antes de
aplicar cualquier `apply_migration`, necesito luz verde explícita.

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

Ver `.env.example` en la raíz. Ningún secreto real se commitea.

## 8. Próximos pasos (por fase, según el brief)

- **Fase 1** (en curso ahora): scaffold Next.js/TS/Tailwind, identidad visual base, páginas públicas placeholder. No toca Supabase.
- **Fase 2**: contenido real de la web pública (home, carta estática de referencia, historia, coctelería, galería, contacto) usando la carta del PDF como dato de partida, editable después desde admin.
- **Fase 3**: aplicar el plan del §4 en Supabase — **requiere confirmación explícita del usuario antes de ejecutar ninguna migración**.
- **Fases 4-10**: según el plan original del brief.

## 9. Datos de contacto públicos (verificados desde el PDF de la carta, sin inventar nada)
- Dirección: Gernikako Arbola Etorbidea 6A, 48902 Barakaldo, Bizkaia.
- Teléfono: +34 686 53 03 10.
- Instagram: @palomita_bar.
- Horarios: no confirmados en ninguna fuente auditada — se dejarán como placeholder editable, no se inventan.
