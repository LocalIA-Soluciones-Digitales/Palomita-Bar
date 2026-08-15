export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-noche-border bg-noche-surface p-4">
      <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-noche-ink">{value}</p>
    </div>
  );
}
