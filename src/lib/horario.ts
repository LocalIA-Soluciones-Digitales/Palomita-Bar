export type DiaHorario = {
  abierto: boolean;
  desde: string;
  hasta: string;
};

export type SemanaHorario = [
  DiaHorario,
  DiaHorario,
  DiaHorario,
  DiaHorario,
  DiaHorario,
  DiaHorario,
  DiaHorario,
];

export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

const MARCA_JSON = "hjson:";

export function semanaPorDefecto(): SemanaHorario {
  const base: Record<string, DiaHorario> = {
    Lunes: { abierto: true, desde: "09:00", hasta: "23:30" },
    Martes: { abierto: true, desde: "09:00", hasta: "23:30" },
    Miércoles: { abierto: true, desde: "09:00", hasta: "23:30" },
    Jueves: { abierto: true, desde: "09:00", hasta: "23:30" },
    Viernes: { abierto: true, desde: "09:00", hasta: "03:00" },
    Sábado: { abierto: true, desde: "10:00", hasta: "03:00" },
    Domingo: { abierto: true, desde: "10:00", hasta: "23:00" },
  };
  return DIAS_SEMANA.map((dia) => base[dia]!) as SemanaHorario;
}

export function parseHorario(valor: string | null | undefined): SemanaHorario | null {
  if (!valor || !valor.startsWith(MARCA_JSON)) return null;
  try {
    const dias = JSON.parse(valor.slice(MARCA_JSON.length)) as unknown;
    if (!Array.isArray(dias) || dias.length !== 7) return null;
    return dias as SemanaHorario;
  } catch {
    return null;
  }
}

export function serializarHorario(semana: SemanaHorario): string {
  return `${MARCA_JSON}${JSON.stringify(semana)}`;
}

function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function diaSemanaIndice(fechaISO: string): number {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const jsDay = new Date(anio!, (mes ?? 1) - 1, dia).getDay();
  return (jsDay + 6) % 7;
}

/** Comprueba si fechaISO/horaHHMM cae dentro del horario de apertura, teniendo en
 * cuenta que un día puede cerrar de madrugada (p. ej. Viernes 09:00–03:00). */
export function estaDentroDeHorario(
  semana: SemanaHorario,
  fechaISO: string,
  horaHHMM: string,
): boolean {
  const idxHoy = diaSemanaIndice(fechaISO);
  const idxAyer = (idxHoy + 6) % 7;
  const diaHoy = semana[idxHoy]!;
  const diaAyer = semana[idxAyer]!;
  const minutos = aMinutos(horaHHMM);

  if (diaHoy.abierto) {
    const desde = aMinutos(diaHoy.desde);
    const hasta = aMinutos(diaHoy.hasta);
    const esNocturno = hasta <= desde;
    if (esNocturno ? minutos >= desde : minutos >= desde && minutos < hasta) return true;
  }

  if (diaAyer.abierto) {
    const desdeAyer = aMinutos(diaAyer.desde);
    const hastaAyer = aMinutos(diaAyer.hasta);
    if (hastaAyer <= desdeAyer && minutos < hastaAyer) return true;
  }

  return false;
}

/** Horario aplicable a un día concreto, describiendo también la prolongación
 * nocturna del día anterior si corresponde (útil para mensajes de error). */
export function horarioDelDia(semana: SemanaHorario, fechaISO: string): DiaHorario {
  return semana[diaSemanaIndice(fechaISO)]!;
}

export function formatearHorarioVisual(semana: SemanaHorario): string {
  const firmas = semana.map((dia) => (dia.abierto ? `${dia.desde}-${dia.hasta}` : "cerrado"));

  const grupos: { firma: string; dias: string[] }[] = [];
  firmas.forEach((firma, i) => {
    const nombreDia = DIAS_SEMANA[i]!;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.firma === firma) {
      ultimo.dias.push(nombreDia);
    } else {
      grupos.push({ firma, dias: [nombreDia] });
    }
  });

  return grupos
    .map(({ firma, dias }) => {
      const etiqueta = dias.length === 1 ? dias[0] : `${dias[0]} a ${dias[dias.length - 1]}`;
      const horas = firma === "cerrado" ? "Cerrado" : firma.replace("-", " - ");
      return `${etiqueta}: ${horas}`;
    })
    .join("\n");
}
