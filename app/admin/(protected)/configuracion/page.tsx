"use client";

import { CamarerosGestion } from "@/components/admin/CamarerosGestion";
import { HorarioGestion } from "@/components/admin/HorarioGestion";
import { SettingsIcon } from "@/components/icons";

export default function ConfiguracionAdminPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-noche-primary/10 text-noche-primary">
          <SettingsIcon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="font-display text-2xl text-noche-ink">Configuración</h1>
          <p className="text-xs text-noche-ink-faint">Horario y personal del local.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <CamarerosGestion />
        <HorarioGestion />
      </div>
    </div>
  );
}
