/** Bloque de carga genérico (barra con pulso), para no dejar pantallas del
 * admin en blanco con solo un "Cargando…" mientras responde la RPC. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-noche-surface-2 ${className}`} />;
}

/** Fila de skeleton con la forma aproximada de una tarjeta de listado
 * (miniatura + texto + valor a la derecha), para productos/categorías/ventas. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Skeleton className="h-10 w-10 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-3.5 w-12 shrink-0" />
    </div>
  );
}

export function SkeletonCard({ filas = 3 }: { filas?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-noche-border bg-noche-surface shadow-sm">
      <div className="border-b border-noche-border bg-noche-surface-2/60 px-4 py-2.5">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="divide-y divide-noche-border/50">
        {Array.from({ length: filas }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
