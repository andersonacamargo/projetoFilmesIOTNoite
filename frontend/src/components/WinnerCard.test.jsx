import { render, screen } from "@testing-library/react";
import { usePoster } from "../hooks/usePoster.js";
import WinnerCard from "./WinnerCard.jsx";

vi.mock("../hooks/usePoster.js", () => ({ usePoster: vi.fn() }));

const FULL_WINNER = {
  nominationId: 1,
  categoryLabel: "ACTOR",
  ceremony: { id: 1, year: "1927/28" },
  films: [
    { id: 10, title: "The Last Command", imdbId: "tt0019071", detail: "Grand Duke Sergius Alexander" },
    { id: 11, title: "The Way of All Flesh", imdbId: "tt0018578" },
  ],
  nominees: [{ id: 5, name: "Emil Jannings" }],
  citation: "Pelo conjunto da obra.",
  note: "Primeiro vencedor da categoria.",
};

afterEach(() => {
  vi.mocked(usePoster).mockReset();
});

describe("WinnerCard", () => {
  it("mostra todos os dados de uma premiação completa", () => {
    vi.mocked(usePoster).mockReturnValue("https://img/last-command.jpg");
    render(<WinnerCard winner={FULL_WINNER} />);

    expect(usePoster).toHaveBeenCalledWith("tt0019071");
    expect(screen.getByRole("img", { name: "Pôster de The Last Command" }))
      .toHaveAttribute("src", "https://img/last-command.jpg");
    expect(screen.getByText("1927/28")).toBeInTheDocument();
    expect(screen.getByText("ACTOR")).toBeInTheDocument();
    // O ganhador fica no topo, em destaque; o filme vem logo abaixo.
    expect(screen.getByRole("heading", { level: 3, name: "Emil Jannings" })).toBeInTheDocument();
    expect(screen.getByText("The Last Command")).toBeInTheDocument();
    expect(screen.getByText("Grand Duke Sergius Alexander")).toBeInTheDocument();
    expect(screen.getByText("Também premiado em: The Way of All Flesh")).toBeInTheDocument();
    expect(screen.getByText("Pelo conjunto da obra.")).toBeInTheDocument();
    expect(screen.getByText("Primeiro vencedor da categoria.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver no IMDb/ }))
      .toHaveAttribute("href", "https://www.imdb.com/title/tt0019071/");
  });

  it("junta vários ganhadores no título", () => {
    vi.mocked(usePoster).mockReturnValue(null);
    render(
      <WinnerCard
        winner={{
          ...FULL_WINNER,
          nominees: [{ id: 1, name: "Adam Somner" }, { id: 2, name: "Sara Murphy" }, { id: 3, name: "Paul Thomas Anderson" }],
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 3, name: "Adam Somner, Sara Murphy e Paul Thomas Anderson" }))
      .toBeInTheDocument();
  });

  it("mostra o fallback 'Sem pôster' quando não há imagem", () => {
    vi.mocked(usePoster).mockReturnValue(null);
    render(<WinnerCard winner={FULL_WINNER} />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Sem pôster")).toBeInTheDocument();
  });

  it("usa o nome da pessoa como título quando não há filme", () => {
    vi.mocked(usePoster).mockReturnValue(null);
    render(
      <WinnerCard
        winner={{ nominationId: 2, categoryLabel: "HONORARY AWARD", films: [], nominees: [{ id: 7, name: "Walt Disney" }] }}
      />,
    );

    expect(usePoster).toHaveBeenCalledWith(undefined);
    expect(screen.getByRole("heading", { level: 3, name: "Walt Disney" })).toBeInTheDocument();
    expect(screen.getAllByText("Walt Disney")).toHaveLength(1);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText(/Também premiado em/)).toBeNull();
  });

  it("usa o rótulo da categoria como título quando não há filme nem pessoa", () => {
    vi.mocked(usePoster).mockReturnValue(null);
    render(<WinnerCard winner={{ nominationId: 3, categoryLabel: "SPECIAL AWARD", films: [], nominees: [] }} />);

    expect(screen.getByRole("heading", { level: 3, name: "SPECIAL AWARD" })).toBeInTheDocument();
  });

  it("usa o filme como título quando não há pessoa, sem repeti-lo embaixo", () => {
    vi.mocked(usePoster).mockReturnValue(null);
    render(
      <WinnerCard
        winner={{ nominationId: 4, categoryLabel: "BEST PICTURE", films: [{ id: 20, title: "Wings" }], nominees: [] }}
      />,
    );

    expect(screen.getByRole("heading", { level: 3, name: "Wings" })).toBeInTheDocument();
    expect(screen.queryByText(/\d{4}/)).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText("•", { exact: false })).toBeNull();
  });
});
