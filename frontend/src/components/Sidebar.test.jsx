import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Sidebar from "./Sidebar.jsx";

const CATEGORIES = [
  { categoryId: 1, categoryName: "BEST PICTURE", categoryClass: "Title", winsCount: 98, winners: [] },
  { categoryId: 2, categoryName: "DIRECTING", categoryClass: "Title", winsCount: 93, winners: [] },
];

function renderSidebar(props = {}) {
  const handlers = { onSelectCategory: vi.fn(), onClose: vi.fn() };
  render(
    <Sidebar
      categories={CATEGORIES}
      loading={false}
      error={null}
      selectedCategoryId={1}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("Sidebar", () => {
  it("mostra o fundo escuro quando aberta", () => {
    renderSidebar({ open: true });
    expect(screen.getByTestId("drawer-backdrop")).toBeInTheDocument();
  });

  it("não mostra o fundo escuro quando fechada", () => {
    renderSidebar({ open: false });
    expect(screen.queryByTestId("drawer-backdrop")).toBeNull();
  });

  it("fecha ao clicar no fundo escuro", async () => {
    const { onClose } = renderSidebar({ open: true });
    await userEvent.click(screen.getByTestId("drawer-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fecha com Esc quando aberta", async () => {
    const { onClose } = renderSidebar({ open: true });
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignora Esc quando fechada", async () => {
    const { onClose } = renderSidebar({ open: false });
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("mostra esqueletos enquanto carrega, sem botões de categoria", () => {
    renderSidebar({ loading: true });
    const nav = screen.getByRole("navigation", { name: "Categorias" });
    expect(nav.querySelectorAll(".animate-pulse")).toHaveLength(10);
    expect(screen.queryByRole("button", { name: /Directing/ })).toBeNull();
  });

  it("avisa quando as categorias não puderam ser carregadas", () => {
    renderSidebar({ error: "fora do ar" });
    expect(screen.getByText("Categorias indisponíveis.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Directing/ })).toBeNull();
  });

  it("avisa quando a API não devolve categorias", () => {
    renderSidebar({ categories: [] });
    expect(screen.getByText("Nenhuma categoria retornada.")).toBeInTheDocument();
  });

  it("seleciona a categoria clicada", async () => {
    const { onSelectCategory } = renderSidebar({ open: true });
    await userEvent.click(screen.getByRole("button", { name: /Directing/ }));
    expect(onSelectCategory).toHaveBeenCalledWith(2);
  });
});
