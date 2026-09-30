import MaterialIcon from "./MaterialIcon.jsx";

/**
 * Faixa de contagens.
 *
 * Todos os números são calculados a partir do payload de
 * GET /api/category-awards — nada é fixo no código.
 */
export default function StatsRibbon({ stats, loading, error }) {
  const unavailable = loading || Boolean(error);

  const items = [
    { icon: "category", value: stats.categories, label: "Categorias" },
    { icon: "emoji_events", value: stats.wins, label: "Vitórias registradas" },
    { icon: "event", value: stats.ceremonies, label: "Cerimônias" },
    { icon: "movie", value: stats.films, label: "Filmes premiados" },
  ];

  return (
    <section aria-label="Estatísticas" className="max-w-7xl mx-auto w-full py-space-lg sm:py-space-xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-sm sm:gap-space-md">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-surface-container-low p-space-sm sm:p-space-md rounded-xl shadow-lg flex items-center gap-space-sm sm:gap-space-md"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
              <MaterialIcon name={item.icon} className="text-[20px] sm:text-[26px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm sm:font-headline-md sm:text-headline-md text-primary leading-tight">
                {unavailable ? "—" : item.value.toLocaleString("pt-BR")}
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
