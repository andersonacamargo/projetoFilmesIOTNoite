import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "./Header.jsx";

describe("Header", () => {
  it("mostra o botão 'Abrir categorias' quando a gaveta está fechada", () => {
    render(<Header drawerOpen={false} onToggleDrawer={() => {}} />);
    const button = screen.getByRole("button", { name: "Abrir categorias" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", "category-drawer");
  });

  it("vira 'Fechar categorias' quando a gaveta está aberta", () => {
    render(<Header drawerOpen onToggleDrawer={() => {}} />);
    expect(screen.getByRole("button", { name: "Fechar categorias" }))
      .toHaveAttribute("aria-expanded", "true");
  });

  it("chama onToggleDrawer ao clicar", async () => {
    const onToggleDrawer = vi.fn();
    render(<Header drawerOpen={false} onToggleDrawer={onToggleDrawer} />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir categorias" }));
    expect(onToggleDrawer).toHaveBeenCalledTimes(1);
  });
});
