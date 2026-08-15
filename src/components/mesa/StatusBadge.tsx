import type { ReactNode } from "react";
import { CheckIcon, ClockIcon } from "@/components/icons";

type StatusBadgeVariant = "positive" | "warning" | "danger" | "neutral";

const VARIANT_STYLES: Record<StatusBadgeVariant, string> = {
  positive: "bg-noche-positive/10 text-noche-positive",
  warning: "bg-noche-warning/10 text-noche-warning",
  danger: "bg-noche-danger/10 text-noche-danger",
  neutral: "bg-noche-surface-2 text-noche-ink-muted",
};

/** Badge de estado reutilizable: nunca solo color, siempre texto + icono. */
export function StatusBadge({
  icon,
  label,
  variant,
}: {
  icon?: ReactNode;
  label: string;
  variant: StatusBadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest2 ${VARIANT_STYLES[variant]}`}
    >
      {icon}
      {label}
    </span>
  );
}

/** Estado de pago de un comensal a partir de lo que debe y lo que ya ha pagado. */
export function PaymentStatusBadge({ debe, pagado }: { debe: number; pagado: number }) {
  const pendiente = debe - pagado;

  if (debe === 0) {
    return <StatusBadge icon={<CheckIcon className="h-3 w-3" />} label="Sin cargos" variant="neutral" />;
  }
  if (pendiente <= 0) {
    return <StatusBadge icon={<CheckIcon className="h-3 w-3" />} label="Pagado" variant="positive" />;
  }
  if (pagado > 0) {
    return <StatusBadge icon={<ClockIcon className="h-3 w-3" />} label="Pago parcial" variant="warning" />;
  }
  return <StatusBadge icon={<ClockIcon className="h-3 w-3" />} label="No pagado" variant="danger" />;
}
