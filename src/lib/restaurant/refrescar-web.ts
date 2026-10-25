// Tras guardar en el panel algo que se ve en la web pública, pide regenerar sus
// páginas (app/api/admin/revalidar). Sin esperar ni romper el guardado si falla:
// en ese caso el cambio sale igualmente al caducar la caché (revalidate).
export function refrescarWeb(): void {
  void fetch("/api/admin/revalidar", { method: "POST" }).catch(() => {});
}
