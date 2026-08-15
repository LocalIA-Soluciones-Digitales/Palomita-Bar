"use client";

import { useEffect, useState } from "react";
import { getSesionPublica } from "@/lib/restaurant/queries";

export function useSesionParticipantes(sesionId: string | undefined) {
  const [participantes, setParticipantes] = useState<{ id: string; nombre: string }[]>([]);

  useEffect(() => {
    if (!sesionId) return;

    let cancelled = false;
    const fetchParticipantes = async () => {
      const sesion = await getSesionPublica(sesionId);
      if (!cancelled && sesion) setParticipantes(sesion.participantes);
    };

    fetchParticipantes();
    const interval = setInterval(fetchParticipantes, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sesionId]);

  return participantes;
}
