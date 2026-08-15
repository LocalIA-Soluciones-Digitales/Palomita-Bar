"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { iniciarSesionMesa, unirseSesionMesa } from "@/lib/restaurant/queries";
import type { MesaSesion, ModoSesion, SesionParticipante } from "@/lib/restaurant/types";

interface StoredContext {
  sesionId: string;
  modo: ModoSesion;
  participanteId?: string;
  participanteNombre?: string;
}

function deviceId(): string {
  if (typeof window === "undefined") return "";
  const KEY = "palomita.device_id";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

function storageKey(mesaIdentificador: string): string {
  return `palomita.mesa.${mesaIdentificador}`;
}

function readStored(mesaIdentificador: string): StoredContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(mesaIdentificador));
    return raw ? (JSON.parse(raw) as StoredContext) : null;
  } catch {
    return null;
  }
}

function writeStored(mesaIdentificador: string, value: StoredContext) {
  window.localStorage.setItem(storageKey(mesaIdentificador), JSON.stringify(value));
}

interface TableSessionValue {
  mesaIdentificador: string;
  sesion: MesaSesion | null;
  participante: SesionParticipante | null;
  loading: boolean;
  error: string | null;
  /** Listo para pedir: modo JUNTOS con sesión, o SEPARADO con participante identificado. */
  canOrder: boolean;
  elegirModo: (modo: ModoSesion) => Promise<void>;
  identificarse: (nombre: string) => Promise<void>;
  cambiarComensal: () => void;
}

const TableSessionContext = createContext<TableSessionValue | null>(null);

export function TableSessionProvider({
  mesaIdentificador,
  children,
}: {
  mesaIdentificador: string;
  children: ReactNode;
}) {
  const [sesion, setSesion] = useState<MesaSesion | null>(null);
  const [participante, setParticipante] = useState<SesionParticipante | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStored(mesaIdentificador);
    if (!stored) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const sesionActual = await iniciarSesionMesa(mesaIdentificador, stored.modo);
        if (cancelled) return;
        setSesion(sesionActual);

        if (stored.participanteId && stored.participanteNombre) {
          setParticipante({
            id: stored.participanteId,
            sesion_id: sesionActual.id,
            nombre: stored.participanteNombre,
            device_id: deviceId(),
            created_at: "",
          });
        }
      } catch {
        // Sesión ya no disponible (mesa liberada, etc.): se vuelve a preguntar.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesaIdentificador]);

  const elegirModo = useCallback(
    async (modo: ModoSesion) => {
      setError(null);
      try {
        const nuevaSesion = await iniciarSesionMesa(mesaIdentificador, modo);
        setSesion(nuevaSesion);
        writeStored(mesaIdentificador, { sesionId: nuevaSesion.id, modo: nuevaSesion.modo });
      } catch {
        setError("No hemos podido iniciar el pedido. Inténtalo de nuevo.");
      }
    },
    [mesaIdentificador],
  );

  const identificarse = useCallback(
    async (nombre: string) => {
      if (!sesion) return;
      setError(null);
      try {
        const nuevoParticipante = await unirseSesionMesa({
          sesionId: sesion.id,
          nombre,
          deviceId: deviceId(),
        });
        setParticipante(nuevoParticipante);
        writeStored(mesaIdentificador, {
          sesionId: sesion.id,
          modo: sesion.modo,
          participanteId: nuevoParticipante.id,
          participanteNombre: nuevoParticipante.nombre,
        });
      } catch {
        setError("No hemos podido registrarte en la mesa. Inténtalo de nuevo.");
      }
    },
    [mesaIdentificador, sesion],
  );

  const cambiarComensal = useCallback(() => {
    if (!sesion) return;
    setParticipante(null);
    writeStored(mesaIdentificador, { sesionId: sesion.id, modo: sesion.modo });
  }, [mesaIdentificador, sesion]);

  const canOrder = Boolean(sesion && (sesion.modo === "JUNTOS" || participante));

  const value = useMemo<TableSessionValue>(
    () => ({
      mesaIdentificador,
      sesion,
      participante,
      loading,
      error,
      canOrder,
      elegirModo,
      identificarse,
      cambiarComensal,
    }),
    [mesaIdentificador, sesion, participante, loading, error, canOrder, elegirModo, identificarse, cambiarComensal],
  );

  return <TableSessionContext.Provider value={value}>{children}</TableSessionContext.Provider>;
}

export function useTableSession() {
  const ctx = useContext(TableSessionContext);
  if (!ctx) {
    throw new Error("useTableSession debe usarse dentro de <TableSessionProvider>");
  }
  return ctx;
}
