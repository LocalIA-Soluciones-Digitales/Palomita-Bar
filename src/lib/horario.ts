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
