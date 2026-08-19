"use client";

import { ReglasFidelizacionGestion } from "@/components/admin/ReglasFidelizacionGestion";
import { ComensalesGestion } from "@/components/admin/ComensalesGestion";
import { PremiosGestion } from "@/components/admin/PremiosGestion";
import { StarIcon } from "@/components/icons";

export default function FidelizacionAdminPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-noche-primary/10 text-noche-primary">
          <StarIcon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="font-display text-2xl text-noche-ink">Fidelización</h1>
          <p className="text-xs text-noche-ink-faint">
            Reglas de premios por visitas, comensales registrados y premios pendientes de canjear.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <ReglasFidelizacionGestion />
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <ComensalesGestion />
          <PremiosGestion />
        </div>
      </div>
    </div>
  );
}
