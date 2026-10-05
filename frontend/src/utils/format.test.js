import { formatCategoryName, joinNames } from "./format.js";

describe("formatCategoryName", () => {
  it("converte caixa alta em iniciais maiúsculas", () => {
    expect(formatCategoryName("BEST PICTURE")).toBe("Best Picture");
  });

  it("mantém apóstrofo e acentos dentro da palavra", () => {
    expect(formatCategoryName("ACTOR'S CHOICE")).toBe("Actor's Choice");
    expect(formatCategoryName("CINEMATOGRAFIA ÉPICA")).toBe("Cinematografia Épica");
  });

  it("devolve string vazia sem nome", () => {
    expect(formatCategoryName("")).toBe("");
    expect(formatCategoryName(null)).toBe("");
    expect(formatCategoryName(undefined)).toBe("");
  });
});

describe("joinNames", () => {
  it("devolve string vazia para lista vazia ou ausente", () => {
    expect(joinNames([])).toBe("");
    expect(joinNames(null)).toBe("");
    expect(joinNames(undefined)).toBe("");
  });

  it("devolve o nome sozinho quando há um", () => {
    expect(joinNames(["Ana"])).toBe("Ana");
  });

  it("junta dois nomes com 'e'", () => {
    expect(joinNames(["Ana", "Bia"])).toBe("Ana e Bia");
  });

  it("junta três ou mais com vírgula e 'e' no fim", () => {
    expect(joinNames(["Ana", "Bia", "Caio"])).toBe("Ana, Bia e Caio");
  });
});
