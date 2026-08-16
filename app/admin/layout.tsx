// El panel interno no tiene selector de tema (ver ThemeToggle en la web
// pública): siempre es oscuro. Como el atributo data-theme se guarda en
// <html> y Next.js no remonta <html> al navegar entre rutas, si alguien
// entra en /admin justo después de haber activado el modo día en la web
// pública, ese atributo seguiría puesto — este script lo retira antes del
// primer paint para que /admin nunca herede el modo día.
const FORCE_NOCHE_SCRIPT = `try{document.documentElement.removeAttribute("data-theme")}catch(e){}`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: FORCE_NOCHE_SCRIPT }} />
      {children}
    </>
  );
}
