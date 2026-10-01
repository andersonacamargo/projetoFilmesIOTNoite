import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";

vi.mock("./services/api.js", () => ({
  getCategoryAwards: vi.fn().mockResolvedValue([
    { categoryId: 1, categoryName: "BEST PICTURE", categoryClass: "Title", winsCount: 0, winners: [] },
    { categoryId: 2, categoryName: "DIRECTING", categoryClass: "Directing", winsCount: 0, winners: [] },
  ]),
}));

async function renderApp() {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("button", { name: /Directing/ });
  return user;
}

describe("App (gaveta de categorias)", () => {
  it("o botão abre a gaveta", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Abrir categorias" }));
    expect(screen.getByRole("button", { name: "Fechar categorias" })).toHaveAttribute("aria-expanded", "true");
  });

  it("escolher uma categoria fecha a gaveta e troca o título", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Abrir categorias" }));
    await user.click(screen.getByRole("button", { name: /Directing/ }));
    expect(screen.getByRole("button", { name: "Abrir categorias" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("heading", { level: 2, name: "Directing" })).toBeInTheDocument();
  });

  it("Esc fecha a gaveta e devolve o foco ao botão", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Abrir categorias" }));
    // Tira o foco do ☰ para provar que o closeDrawer o devolve.
    screen.getByRole("button", { name: /Directing/ }).focus();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Abrir categorias" })).toHaveFocus();
  });
});
