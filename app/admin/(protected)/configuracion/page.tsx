"use client";

import { useEffect, useState } from "react";
import {
  getConfiguracionAdmin,
  getSiteImagesAdmin,
  setConfiguracionAdmin,
  setSiteImagesAdmin,
  subirImagenSitio,
} from "@/lib/restaurant/admin-queries";
import { CamarerosGestion } from "@/components/admin/CamarerosGestion";
import { errorMessage } from "@/lib/format";
import type { SiteImages } from "@/lib/restaurant/types";
import { CheckIcon } from "@/components/icons";

const SITE_IMAGES_VACIO: SiteImages = {
  hero: "",
  about: "",
  ambiente: ["", "", "", ""],
};

export default function ConfiguracionAdminPage() {
  const [horario, setHorario] = useState("");
  const [siteImages, setSiteImagesState] = useState<SiteImages>(SITE_IMAGES_VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [subiendoClave, setSubiendoClave] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getConfiguracionAdmin(), getSiteImagesAdmin()])
      .then(([valorHorario, valorImagenes]) => {
        setHorario(valorHorario ?? "");
        if (valorImagenes) {
          const ambiente = [...valorImagenes.ambiente];
          while (ambiente.length < 4) ambiente.push("");
          setSiteImagesState({ ...valorImagenes, ambiente });
        }
      })
      .catch(() => setError("No se ha podido cargar la configuración."))
      .finally(() => setCargando(false));
  }, []);

  const handleGuardar = async () => {
    setGuardando(true);
    setGuardado(false);
    setError(null);
    try {
      await setConfiguracionAdmin(horario);
      await setSiteImagesAdmin({
        ...siteImages,
        ambiente: siteImages.ambiente.filter((url) => url.trim() !== ""),
      });
      setGuardado(true);
    } catch (err) {
      setError(`No se ha podido guardar: ${errorMessage(err)}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleSubir = async (clave: string, file: File, aplicar: (url: string) => void) => {
    setSubiendoClave(clave);
    setError(null);
    try {
      const url = await subirImagenSitio(file, clave);
      aplicar(url);
    } catch (err) {
      setError(`No se ha podido subir la imagen: ${errorMessage(err)}`);
    } finally {
      setSubiendoClave(null);
    }
  };

  if (cargando) return <p className="text-sm text-noche-ink-muted">Cargando…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl text-noche-ink">Configuración</h1>

      <div className="mt-6 rounded-lg border border-noche-border bg-noche-surface p-4">
        <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
          Horario (se muestra en la sección de contacto de la home)
        </label>
        <textarea
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          rows={4}
          placeholder="Ej: Martes a domingo, 18:00 - 01:00"
          className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
        />
      </div>

      <div className="mt-6 space-y-6 rounded-lg border border-noche-border bg-noche-surface p-4">
        <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
          Imágenes de la web pública
        </p>

        <ImagenField
          label="Foto de portada (home)"
          url={siteImages.hero}
          subiendo={subiendoClave === "hero"}
          onSubir={(file) =>
            handleSubir("hero", file, (url) =>
              setSiteImagesState((s) => ({ ...s, hero: url })),
            )
          }
          onQuitar={() => setSiteImagesState((s) => ({ ...s, hero: "" }))}
        />

        <ImagenField
          label='Foto de la sección "Nosotros"'
          url={siteImages.about}
          subiendo={subiendoClave === "about"}
          onSubir={(file) =>
            handleSubir("about", file, (url) =>
              setSiteImagesState((s) => ({ ...s, about: url })),
            )
          }
          onQuitar={() => setSiteImagesState((s) => ({ ...s, about: "" }))}
        />

        <div>
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
            Galería de ambiente (hasta 4 fotos)
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {siteImages.ambiente.map((url, index) => (
              <ImagenField
                key={index}
                label={`Foto ${index + 1}`}
                url={url}
                subiendo={subiendoClave === `ambiente-${index}`}
                compacto
                onSubir={(file) =>
                  handleSubir(`ambiente-${index}`, file, (nuevaUrl) =>
                    setSiteImagesState((s) => ({
                      ...s,
                      ambiente: s.ambiente.map((u, i) => (i === index ? nuevaUrl : u)),
                    })),
                  )
                }
                onQuitar={() =>
                  setSiteImagesState((s) => ({
                    ...s,
                    ambiente: s.ambiente.map((u, i) => (i === index ? "" : u)),
                  }))
                }
              />
            ))}
          </div>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-noche-danger">{error}</p> : null}
      {guardado ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-noche-positive">
          <CheckIcon className="h-3.5 w-3.5" />
          Guardado.
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleGuardar}
        disabled={guardando || subiendoClave !== null}
        className="mt-4 rounded-lg bg-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink disabled:opacity-50"
      >
        {guardando ? "Guardando…" : "Guardar"}
      </button>

      <CamarerosGestion />
    </div>
  );
}

function ImagenField({
  label,
  url,
  subiendo,
  compacto,
  onSubir,
  onQuitar,
}: {
  label: string;
  url: string;
  subiendo: boolean;
  compacto?: boolean;
  onSubir: (file: File) => void;
  onQuitar: () => void;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">{label}</label>
      <div className="mt-1 flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className={`shrink-0 rounded-lg border border-noche-border object-cover ${compacto ? "h-12 w-12" : "h-16 w-16"}`}
          />
        ) : (
          <div
            className={`shrink-0 rounded-lg border border-dashed border-noche-border bg-noche-surface-2 ${compacto ? "h-12 w-12" : "h-16 w-16"}`}
          />
        )}
        <input
          type="file"
          accept="image/*"
          disabled={subiendo}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSubir(file);
          }}
          className="text-xs text-noche-ink-muted"
        />
        {subiendo ? <span className="text-xs text-noche-ink-muted">Subiendo…</span> : null}
        {url ? (
          <button
            type="button"
            onClick={onQuitar}
            className="text-xs uppercase tracking-widest2 text-noche-ink-faint hover:text-noche-danger"
          >
            Quitar
          </button>
        ) : null}
      </div>
    </div>
  );
}
