import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import { getCategoryAwards, getCeremonies } from "./services/api.js";

vi.mock("./services/api.js", () => ({ getCategoryAwards: vi.fn(), getCeremonies: vi.fn() }));
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

beforeEach(() => {
  vi.mocked(getCeremonies).mockResolvedValue([{ id: 2, year: "1928/29" }]);
});

afterEach(() => {
  vi.mocked(getCategoryAwards).mockReset();
  vi.mocked(getCeremonies).mockReset();
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
  it("trocar a cerimônia busca só aquela edição e atualiza as estatísticas", async () => {
    vi.mocked(getCeremonies).mockResolvedValue([
      { id: 1, year: "1927/28" },
      { id: 2, year: "1928/29" },
    ]);
    const edition1 = [{ ...CATEGORIES[0], winsCount: 1, winners: [CATEGORIES[0].winners[0]] }];
    vi.mocked(getCategoryAwards).mockImplementation(async (id) => (id === 1 ? edition1 : CATEGORIES));

    const user = userEvent.setup();
    render(<App />);

    // Abre na edição mais recente (id 2): 2 categorias, 3 vitórias.
    await screen.findByRole("heading", { level: 2, name: "Best Picture" });
    expect(getCategoryAwards).toHaveBeenLastCalledWith(2);
    expect(statValue("Categorias")).toBe("2");
    expect(statValue("Vitórias registradas")).toBe("3");

    await user.click(screen.getByRole("button", { name: /1928\/29/ }));
    await user.click(screen.getByRole("option", { name: "1927/28" }));

    // Edição 1: só 1 categoria e 1 vitória — o resumo do topo acompanha.
    await vi.waitFor(() => expect(statValue("Categorias")).toBe("1"));
    expect(getCategoryAwards).toHaveBeenLastCalledWith(1);
    expect(statValue("Vitórias registradas")).toBe("1");
    expect(statValue("Cerimônias")).toBe("1");
  });
});
