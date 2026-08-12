import { formatCentimos } from "@/lib/format";
import type { Categoria, Producto } from "@/lib/restaurant/types";

export function CategoryMenu({
  categorias,
  productos,
}: {
  categorias: Categoria[];
  productos: Producto[];
}) {
  return (
    <div className="space-y-16">
      {categorias.map((categoria) => {
        const items = productos.filter((p) => p.categoria_id === categoria.id);
        if (items.length === 0) return null;

        return (
          <div key={categoria.id}>
            <h2 className="font-display text-3xl text-brand-pink">{categoria.nombre}</h2>
            <ul className="mt-6 divide-y divide-brand-black/10">
              {items.map((producto) => (
                <li key={producto.id} className="flex items-baseline justify-between gap-6 py-4">
                  <div>
                    <p className="font-display text-lg">{producto.nombre}</p>
                    {producto.descripcion ? (
                      <p className="mt-1 max-w-lg text-sm text-brand-ink/60">
                        {producto.descripcion}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 whitespace-nowrap text-sm text-brand-ink/80">
                    {formatCentimos(producto.precio_centimos)} €
                  </p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
