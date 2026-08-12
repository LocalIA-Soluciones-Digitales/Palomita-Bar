import type { MenuSection } from "@/lib/menu-data";

export function MenuSectionList({ sections }: { sections: MenuSection[] }) {
  return (
    <div className="space-y-16">
      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="font-display text-3xl text-brand-pink">{section.title}</h2>
          <ul className="mt-6 divide-y divide-brand-black/10">
            {section.items.map((item) => (
              <li key={item.name} className="flex items-baseline justify-between gap-6 py-4">
                <div>
                  <p className="font-display text-lg">{item.name}</p>
                  <p className="mt-1 max-w-lg text-sm text-brand-ink/60">
                    {item.description}
                  </p>
                </div>
                <p className="shrink-0 whitespace-nowrap text-sm text-brand-ink/80">
                  {item.price} €
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
