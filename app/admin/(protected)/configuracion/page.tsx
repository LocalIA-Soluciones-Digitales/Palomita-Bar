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

  if (cargando) return <p className="text-sm text-brand-ink/50">Cargando…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl">Configuración</h1>

      <div className="mt-6 border border-brand-black/10 bg-white p-4">
        <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
          Horario (se muestra en /contacto)
        </label>
        <textarea
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          rows={4}
          placeholder="Ej: Martes a domingo, 18:00 - 01:00"
          className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-6 space-y-6 border border-brand-black/10 bg-white p-4">
        <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">
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
          <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">
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

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {guardado ? <p className="mt-3 text-sm text-green-700">Guardado.</p> : null}

      <button
        type="button"
        onClick={handleGuardar}
        disabled={guardando || subiendoClave !== null}
        className="mt-4 bg-brand-black px-4 py-2 text-xs uppercase tracking-widest2 text-brand-cream disabled:opacity-50"
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
      <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">{label}</label>
      <div className="mt-1 flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className={`shrink-0 border border-brand-black/10 object-cover ${compacto ? "h-12 w-12" : "h-16 w-16"}`}
          />
        ) : (
          <div
            className={`shrink-0 border border-dashed border-brand-black/20 bg-brand-sand ${compacto ? "h-12 w-12" : "h-16 w-16"}`}
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
          className="text-xs"
        />
        {subiendo ? <span className="text-xs text-brand-ink/50">Subiendo…</span> : null}
        {url ? (
          <button
            type="button"
            onClick={onQuitar}
            className="text-xs uppercase tracking-widest2 text-brand-ink/40 hover:text-red-600"
          >
            Quitar
          </button>
        ) : null}
      </div>
    </div>
  );
}
