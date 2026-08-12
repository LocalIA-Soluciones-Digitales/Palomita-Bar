# Palomita Bar

Web y plataforma de pedidos en mesa de Palomita Bar (Barakaldo). Proyecto de
[LocalIA Soluciones Digitales](https://github.com/LocalIA-Soluciones-Digitales).

Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md) para la auditoría de la
infraestructura compartida (Supabase multi-tenant de LocalIA), el estado
actual del proyecto y el plan de migraciones propuesto.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres, Auth, Storage, Realtime) — proyecto compartido de LocalIA
- Stripe Checkout + Webhooks
- Vercel

## Desarrollo

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env.local` y rellena las variables (ver
`ARCHITECTURE.md` §7 para el detalle de cada una).

## Estado

En desarrollo. `/carta`, `/cocteleria` y `/pedir?mesa=<identificador>` ya
funcionan contra el Supabase real (schema `restaurant`), incluyendo carrito
y creación de pedido (pago en local; pago online pendiente de Stripe, Fase
6). Ver `ARCHITECTURE.md` para el detalle completo por fases y, muy
importante, **las variables de entorno que faltan por añadir en Vercel**
(§7) para que el build no falle.
