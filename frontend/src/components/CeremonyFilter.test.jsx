import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CeremonyFilter from "./CeremonyFilter.jsx";

// 14 cerimônias: a grade mostra 12 por página, então há duas páginas.
const CEREMONIES = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  year: String(2000 + i),
}));

function renderFilter(props = {}) {
  const onSelectCeremony = vi.fn();
  render(
    <CeremonyFilter
      ceremonies={CEREMONIES}
      selectedCeremonyId={14}
      onSelectCeremony={onSelectCeremony}
      {...props}
    />
  );
  return { onSelectCeremony, user: userEvent.setup() };
}

describe("CeremonyFilter", () => {
  it("não renderiza nada quando a lista de cerimônias está vazia", () => {
    const { container } = render(
      <CeremonyFilter ceremonies={[]} selectedCeremonyId={null} onSelectCeremony={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra o ano da cerimônia selecionada no botão", () => {
    renderFilter();
    expect(screen.getByRole("button", { name: /2013/ })).toBeInTheDocument();
  });

  it("abre a grade com a página mais recente e marca a selecionada", async () => {
    const { user } = renderFilter();
    await user.click(screen.getByRole("button", { name: /2013/ }));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "2013" })).toHaveAttribute("aria-selected", "true");
    // O ano mais antigo fica na página anterior.
    expect(screen.queryByRole("option", { name: "2000" })).not.toBeInTheDocument();
  });

  it("navega para a página anterior e mostra anos mais antigos", async () => {
    const { user } = renderFilter();
    await user.click(screen.getByRole("button", { name: /2013/ }));
    await user.click(screen.getByRole("button", { name: "Edições anteriores" }));

    expect(screen.getByRole("option", { name: "2000" })).toBeInTheDocument();
  });

  it("escolher um ano chama onSelectCeremony com o id e fecha a grade", async () => {
    const { user, onSelectCeremony } = renderFilter();
    await user.click(screen.getByRole("button", { name: /2013/ }));
    await user.click(screen.getByRole("option", { name: "2005" }));

    expect(onSelectCeremony).toHaveBeenCalledWith(6);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("clicar fora fecha a grade", async () => {
    const { user } = renderFilter();
    await user.click(screen.getByRole("button", { name: /2013/ }));
    await user.click(document.body);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
