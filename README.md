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

En desarrollo. Fase 0 (auditoría) y Fase 1 (scaffold base) completadas. La
carta pública en `/carta` y `/cocteleria` usa contenido de referencia
transcrito de la carta en PDF — pasará a estar servida desde Supabase en la
Fase 3, tras confirmar el plan de migraciones descrito en `ARCHITECTURE.md`.
