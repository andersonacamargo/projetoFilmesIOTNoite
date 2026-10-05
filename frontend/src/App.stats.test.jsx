import { render, screen, within } from "@testing-library/react";
import App from "./App.jsx";
import { getCategoryAwards } from "./services/api.js";

vi.mock("./services/api.js", () => ({ getCategoryAwards: vi.fn() }));
vi.mock("./services/posters.js", () => ({ hasPosterProvider: true, getPosterUrl: vi.fn().mockResolvedValue(null) }));

const CATEGORIES = [
  {
    categoryId: 1,
    categoryName: "BEST PICTURE",
    categoryClass: "Title",
    winsCount: 2,
    winners: [
      { nominationId: 1, categoryLabel: "OUTSTANDING PICTURE", ceremony: { id: 1, year: "1927/28" }, films: [{ id: 10, title: "Wings" }], nominees: [] },
      { nominationId: 2, categoryLabel: "OUTSTANDING PICTURE", ceremony: { id: 2, year: "1928/29" }, films: [{ id: 11, title: "The Broadway Melody" }], nominees: [] },
    ],
  },
  {
    categoryId: 2,
    categoryName: "HONORARY AWARD",
    categoryClass: "Special",
    winsCount: 1,
    // Sem cerimônia e repetindo um filme: não pode contar em dobro.
    winners: [{ nominationId: 3, categoryLabel: "HONORARY AWARD", ceremony: null, films: [{ id: 10, title: "Wings" }], nominees: [] }],
  },
];

/** Lê o número exibido no cartão de estatística pelo rótulo. */
function statValue(label) {
  const ribbon = screen.getByRole("region", { name: "Estatísticas" });
  return within(ribbon).getByText(label).previousElementSibling.textContent;
}

afterEach(() => {
  vi.mocked(getCategoryAwards).mockReset();
});

describe("App (estatísticas e categoria inicial)", () => {
  it("calcula as contagens a partir do payload, sem repetir cerimônias e filmes", async () => {
    vi.mocked(getCategoryAwards).mockResolvedValue(CATEGORIES);
    render(<App />);

    await screen.findByRole("heading", { level: 2, name: "Best Picture" });
    expect(statValue("Categorias")).toBe("2");
    expect(statValue("Vitórias registradas")).toBe("3");
    expect(statValue("Cerimônias")).toBe("2");
    expect(statValue("Filmes premiados")).toBe("2");
  });

  it("sem categorias, mostra zeros e nenhuma categoria selecionada", async () => {
    vi.mocked(getCategoryAwards).mockResolvedValue([]);
    render(<App />);

    await screen.findByText("Nenhuma categoria retornada.");
    expect(screen.getByRole("heading", { level: 2, name: "—" })).toBeInTheDocument();
    expect(statValue("Categorias")).toBe("0");
  });
});
