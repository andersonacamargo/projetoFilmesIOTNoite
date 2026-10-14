import MaterialIcon from "./MaterialIcon.jsx";
import CeremonyFilter from "./CeremonyFilter.jsx";

/**
 * Barra fixa do topo.
 *
 * Contém a identificação do projeto, o filtro de cerimônia/ano (à direita)
 * e, abaixo de 1024px, o botão ☰ que abre e fecha a gaveta de categorias.
 * Busca, notificações e perfil foram removidos: o backend não expõe nada
 * que os alimente.
 */
export default function Header({
  drawerOpen = false,
  onToggleDrawer,
  menuButtonRef,
  ceremonies = [],
  selectedCeremonyId = null,
  onSelectCeremony,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
      <div className="h-20 w-full px-gutter flex items-center gap-space-sm">
        <button
          type="button"
          ref={menuButtonRef}
          onClick={onToggleDrawer}
          aria-expanded={drawerOpen}
          aria-controls="category-drawer"
          aria-label={drawerOpen ? "Fechar categorias" : "Abrir categorias"}
          className="lg:hidden w-10 h-10 -ml-2 flex items-center justify-center rounded-lg text-primary hover:bg-surface-container transition-colors"
        >
          <MaterialIcon name={drawerOpen ? "close" : "menu"} className="text-[26px]" />
        </button>
        <MaterialIcon name="emoji_events" className="text-secondary text-[30px]" filled />
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm uppercase tracking-widest text-primary leading-tight">
            Oscars
          </span>
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
            Premiações da Academia
          </span>
        </div>

        <div className="ml-auto">
          <CeremonyFilter
            ceremonies={ceremonies}
            selectedCeremonyId={selectedCeremonyId}
            onSelectCeremony={onSelectCeremony}
          />
        </div>
      </div>
    </header>
  );
}
