import { useEffect, useRef, useState } from "react";
import MaterialIcon from "./MaterialIcon.jsx";

const CEREMONIES_PER_PAGE = 12; // grade 4x3, como a visão de ano de um calendário

const OPTION_BASE =
  "px-space-xs py-2 rounded-lg font-body-sm text-body-sm transition-colors";
const OPTION_ACTIVE = "bg-primary-container text-on-primary-container font-bold";
const OPTION_INACTIVE =
  "bg-surface-container text-on-surface-variant hover:bg-surface-container-high";

/**
 * Filtro de cerimônia no topo da página, no formato de um seletor de
 * calendário: um botão mostra o ano da cerimônia selecionada e abre uma
 * grade paginada de anos (12 por vez) em vez de listar uma cerimônia por
 * botão/coluna.
 *
 * Recebe a lista de cerimônias via `ceremonies` (GET /api/ceremonies, pelo
 * hook useCeremonies) — não busca nada sozinho.
 */
export default function CeremonyFilter({ ceremonies, selectedCeremonyId, onSelectCeremony }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pageStart, setPageStart] = useState(
    Math.max(0, ceremonies.length - CEREMONIES_PER_PAGE)
  );
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (ceremonies.length === 0) return null;

  const selected = ceremonies.find((ceremony) => ceremony.id === selectedCeremonyId) ?? null;
  const visible = ceremonies.slice(pageStart, pageStart + CEREMONIES_PER_PAGE);
  const canGoPrevious = pageStart > 0;
  const canGoNext = pageStart + CEREMONIES_PER_PAGE < ceremonies.length;

  function handleSelect(ceremony) {
    onSelectCeremony(ceremony.id);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-lg text-label-lg"
      >
        <MaterialIcon name="calendar_month" className="text-[20px] text-secondary" />
        {selected ? selected.year : "Selecionar edição"}
        <MaterialIcon name="expand_more" className="text-[18px]" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Filtrar por edição do Oscar"
          className="absolute right-0 mt-2 w-64 p-space-sm rounded-xl bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-50"
        >
          <div className="flex items-center justify-between px-space-xs mb-space-xs">
            <button
              type="button"
              onClick={() => setPageStart((start) => Math.max(0, start - CEREMONIES_PER_PAGE))}
              disabled={!canGoPrevious}
              aria-label="Edições anteriores"
              className="w-7 h-7 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <MaterialIcon name="chevron_left" className="text-[18px]" />
            </button>
            <button
              type="button"
              onClick={() =>
                setPageStart((start) =>
                  Math.min(Math.max(0, ceremonies.length - CEREMONIES_PER_PAGE), start + CEREMONIES_PER_PAGE)
                )
              }
              disabled={!canGoNext}
              aria-label="Próximas edições"
              className="w-7 h-7 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <MaterialIcon name="chevron_right" className="text-[18px]" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {visible.map((ceremony) => {
              const isActive = ceremony.id === selectedCeremonyId;
              return (
                <button
                  key={ceremony.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(ceremony)}
                  className={`${OPTION_BASE} ${isActive ? OPTION_ACTIVE : OPTION_INACTIVE}`}
                >
                  {ceremony.year}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
