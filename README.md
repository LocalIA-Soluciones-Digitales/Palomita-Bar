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

Fases 0-9 completas (auditoría, web pública, Supabase, pedidos, cocina en
vivo, Stripe, administración, seguridad, verificación funcional). En
producción en `palomita-bar.vercel.app`. Ver `ARCHITECTURE.md` §15 para el
resumen de qué queda por hacer manualmente (básicamente: dar de alta
Stripe) y el resto de fases en detalle.
