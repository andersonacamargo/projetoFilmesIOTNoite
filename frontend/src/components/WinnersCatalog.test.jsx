import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WinnersCatalog from "./WinnersCatalog.jsx";

// hasPosterProvider é uma constante do módulo; o getter deixa cada teste escolher o valor.
const posters = vi.hoisted(() => ({ hasProvider: true }));

vi.mock("../services/posters.js", () => ({
  get hasPosterProvider() {
    return posters.hasProvider;
  },
}));

vi.mock("./WinnerCard.jsx", () => ({
  default: ({ winner }) => <article>{winner.categoryLabel}</article>,
}));

const CATEGORY = {
  categoryId: 1,
  categoryName: "BEST PICTURE",
  categoryClass: "Title",
  winsCount: 2,
  winners: [
    { nominationId: 1, categoryLabel: "OUTSTANDING PICTURE" },
    { nominationId: 2, categoryLabel: "BEST MOTION PICTURE" },
  ],
};

function renderCatalog(props = {}) {
  const onReload = vi.fn();
  render(<WinnersCatalog category={CATEGORY} loading={false} error={null} onReload={onReload} {...props} />);
  return { onReload };
}

afterEach(() => {
  posters.hasProvider = true;
});

describe("WinnersCatalog", () => {
  it("mostra título, classe, contagem e um card por vencedor", () => {
    renderCatalog();

    expect(screen.getByRole("heading", { level: 2, name: "Best Picture" })).toBeInTheDocument();
    expect(screen.getByText("Classe: Title")).toBeInTheDocument();
    expect(screen.getByText("2 vitórias")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("usa o singular com uma vitória", () => {
    renderCatalog({ category: { ...CATEGORY, winsCount: 1, winners: [CATEGORY.winners[0]] } });
    expect(screen.getByText("1 vitória")).toBeInTheDocument();
  });

  it("mostra um traço e nenhuma contagem sem categoria selecionada", () => {
    renderCatalog({ category: null });

    expect(screen.getByRole("heading", { level: 2, name: "—" })).toBeInTheDocument();
    expect(screen.queryByText(/^\d+ vitórias?$/)).toBeNull();
    expect(screen.queryByText(/Classe:/)).toBeNull();
    expect(screen.getByRole("heading", { level: 3, name: "Nenhuma vitória registrada" })).toBeInTheDocument();
  });

  it("omite a classe quando a categoria não tem", () => {
    renderCatalog({ category: { ...CATEGORY, categoryClass: null } });
    expect(screen.queryByText(/Classe:/)).toBeNull();
  });

  it("mostra esqueletos enquanto carrega, sem cards nem mensagens", () => {
    const { container } = render(<WinnersCatalog category={null} loading error={null} onReload={vi.fn()} />);

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(6);
    expect(screen.queryByRole("article")).toBeNull();
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  });

  it("mostra o erro e chama onReload em 'Tentar novamente'", async () => {
    const { onReload } = renderCatalog({ error: "Não foi possível alcançar a API." });

    const alerta = screen.getByRole("heading", { level: 3, name: "Não foi possível carregar os dados" }).parentElement;
    expect(within(alerta).getByText(/Não foi possível alcançar a API\./)).toBeInTheDocument();
    expect(screen.queryByRole("article")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /Tentar novamente/ }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it("avisa quando a categoria não tem vencedores", () => {
    renderCatalog({ category: { ...CATEGORY, winsCount: 0, winners: [] } });

    expect(screen.getByRole("heading", { level: 3, name: "Nenhuma vitória registrada" })).toBeInTheDocument();
    expect(screen.getByText("Esta categoria não tem premiações com vencedor no banco.")).toBeInTheDocument();
  });

  it("avisa como configurar os pôsteres quando não há provedor", () => {
    posters.hasProvider = false;
    renderCatalog();
    expect(screen.getByText("VITE_TMDB_API_KEY")).toBeInTheDocument();
  });

  it("não mostra o aviso de pôsteres quando há provedor", () => {
    renderCatalog();
    expect(screen.queryByText("VITE_TMDB_API_KEY")).toBeNull();
  });
});
