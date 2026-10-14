import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import StatsRibbon from "./components/StatsRibbon.jsx";
import WinnersCatalog from "./components/WinnersCatalog.jsx";
import { useCategoryAwards } from "./hooks/useCategoryAwards.js";
import { useCeremonies } from "./hooks/useCeremonies.js";

/** Contagens derivadas do payload da API — nenhum valor fixo no código. */
function buildStats(categories) {
  const ceremonies = new Set();
  const films = new Set();
  let wins = 0;

  for (const category of categories) {
    wins += category.winsCount;

    for (const winner of category.winners) {
      if (winner.ceremony) ceremonies.add(winner.ceremony.id);
      for (const film of winner.films) films.add(film.id);
    }
  }

  return {
    categories: categories.length,
    wins,
    ceremonies: ceremonies.size,
    films: films.size,
  };
}

export default function App() {
  const { ceremonies } = useCeremonies();
  const [selectedCeremonyId, setSelectedCeremonyId] = useState(null);

  // Assim que a lista de cerimônias chega, seleciona a mais recente — a API
  // não tem mais um modo "todas as edições" (/category-awards/:ceremonyId
  // exige uma cerimônia), então a página sempre abre em uma edição concreta.
  useEffect(() => {
    if (selectedCeremonyId == null && ceremonies.length > 0) {
      setSelectedCeremonyId(ceremonies[ceremonies.length - 1].id);
    }
  }, [ceremonies, selectedCeremonyId]);

  // categories já vem filtrado pelo backend (GET /category-awards/:ceremonyId)
  // — nenhuma filtragem de cerimônia acontece mais no front.
  const { categories, loading, error, reload } = useCategoryAwards(selectedCeremonyId);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef(null);

  // Estável para não re-registrar o listener de Esc da gaveta a cada render.
  // Ao fechar por Esc ou fundo escuro, devolve o foco ao botão ☰.
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  // Ao escolher uma categoria, fecha a gaveta sem mover o foco.
  function handleSelectCategory(id) {
    setSelectedCategoryId(id);
    setDrawerOpen(false);
  }

  // Ao trocar de edição, mantém a categoria escolhida se ela ainda existir
  // nessa cerimônia; senão, o fallback abaixo cai pra primeira disponível.
  function handleSelectCeremony(ceremonyId) {
    setSelectedCeremonyId(ceremonyId);
  }

  const stats = useMemo(() => buildStats(categories), [categories]);

  // Antes da primeira escolha do usuário (ou quando a categoria escolhida
  // não existe mais na cerimônia selecionada), mostra a primeira categoria.
  const selectedCategory = useMemo(
    () =>
      categories.find((category) => category.categoryId === selectedCategoryId) ??
      categories[0] ??
      null,
    [categories, selectedCategoryId]
  );

  return (
    <>
      <Header
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen((open) => !open)}
        menuButtonRef={menuButtonRef}
        ceremonies={ceremonies}
        selectedCeremonyId={selectedCeremonyId}
        onSelectCeremony={handleSelectCeremony}
      />

      <Sidebar
        categories={categories}
        loading={loading}
        error={error}
        selectedCategoryId={selectedCategory?.categoryId ?? null}
        open={drawerOpen}
        onClose={closeDrawer}
        onSelectCategory={handleSelectCategory}
      />

      <div className="lg:pl-72">
        <main className="w-full min-h-[calc(100vh-5rem)] pt-20 px-gutter-mobile sm:px-gutter bg-surface">
          <div className="flex flex-col w-full">
            <StatsRibbon stats={stats} loading={loading} error={error} />
            <WinnersCatalog
              category={selectedCategory}
              loading={loading}
              error={error}
              onReload={reload}
            />
          </div>
        </main>
      </div>
    </>
  );
}
