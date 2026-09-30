import { useEffect } from "react";
import { formatCategoryName } from "../utils/format.js";

const ACTIVE_CLASSES =
  "bg-primary-container text-on-primary-container font-bold rounded-lg shadow-[0_0_16px_rgba(245,215,127,0.3)]";
const INACTIVE_CLASSES =
  "rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors";
const ITEM_BASE =
  "flex items-center justify-between gap-space-xs px-space-sm py-2.5 transition-colors w-full text-left";

/**
 * Navegação lateral com as categorias de GET /api/category-awards.
 *
 * O selo à direita é o `winsCount` retornado pela API.
 *
 * Abaixo de `lg` (1024px) vira uma gaveta controlada por `open`/`onClose`:
 * fica fora da tela e desliza para dentro ao abrir, com fundo escuro clicável
 * e fechamento pela tecla Esc. A gaveta fechada usa `invisible` para tirar os
 * botões da ordem do Tab e do leitor de tela. Em `lg` ou mais, é a barra
 * lateral fixa de sempre (`lg:translate-x-0 lg:visible`).
 */
export default function Sidebar({
  categories,
  loading,
  error,
  selectedCategoryId,
  onSelectCategory,
  open = false,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          data-testid="drawer-backdrop"
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-x-0 top-20 bottom-0 z-30 bg-black/60 lg:hidden"
        />
      )}
      <aside
        id="category-drawer"
        className={`fixed left-0 top-20 bottom-0 w-72 max-w-[85vw] bg-surface-container-lowest overflow-y-auto shadow-[1px_0_12px_rgba(0,0,0,0.5)] z-40 transition-transform duration-300 lg:translate-x-0 lg:visible ${
          open ? "translate-x-0 visible" : "-translate-x-full invisible"
        }`}
      >
      <div className="p-space-md flex flex-col">
        <span className="px-space-sm pb-space-xs font-label-sm text-label-sm uppercase text-outline tracking-widest">
          Categorias
        </span>

        <nav aria-label="Categorias" className="flex flex-col gap-1">
          {loading &&
            Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="px-space-sm py-2.5 animate-pulse">
                <div className="h-4 w-full bg-surface-container rounded" />
              </div>
            ))}

          {!loading && error && (
            <span className="px-space-sm py-2.5 font-body-sm text-body-sm text-error">
              Categorias indisponíveis.
            </span>
          )}

          {!loading &&
            !error &&
            categories.length === 0 && (
              <span className="px-space-sm py-2.5 font-body-sm text-body-sm text-outline">
                Nenhuma categoria retornada.
              </span>
            )}

          {!loading &&
            !error &&
            categories.map((category) => {
              const isActive = category.categoryId === selectedCategoryId;

              return (
                <button
                  key={category.categoryId}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onSelectCategory(category.categoryId)}
                  className={`${ITEM_BASE} ${isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES}`}
                >
                  <span className="font-label-lg text-label-lg">
                    {formatCategoryName(category.categoryName)}
                  </span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-secondary shrink-0">
                    {category.winsCount}
                  </span>
                </button>
              );
            })}
        </nav>
      </div>
      </aside>
    </>
  );
}
