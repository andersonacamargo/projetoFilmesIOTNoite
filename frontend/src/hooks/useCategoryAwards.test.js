import { act, renderHook, waitFor } from "@testing-library/react";
import { getCategoryAwards } from "../services/api.js";
import { useCategoryAwards } from "./useCategoryAwards.js";

vi.mock("../services/api.js", () => ({ getCategoryAwards: vi.fn() }));

const CATEGORIES = [{ categoryId: 1, categoryName: "BEST PICTURE", winsCount: 1, winners: [] }];

afterEach(() => {
  vi.mocked(getCategoryAwards).mockReset();
});

describe("useCategoryAwards", () => {
  it("começa carregando e entrega as categorias da API", async () => {
    vi.mocked(getCategoryAwards).mockResolvedValue(CATEGORIES);
    const { result } = renderHook(() => useCategoryAwards());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.categories).toEqual(CATEGORIES);
    expect(result.current.error).toBeNull();
  });

  it("expõe a mensagem de erro e esvazia a lista quando a API falha", async () => {
    vi.mocked(getCategoryAwards).mockRejectedValue(new Error("Não foi possível alcançar a API."));
    const { result } = renderHook(() => useCategoryAwards());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Não foi possível alcançar a API.");
    expect(result.current.categories).toEqual([]);
  });

  it("reload tenta de novo e limpa o erro anterior", async () => {
    vi.mocked(getCategoryAwards)
      .mockRejectedValueOnce(new Error("fora do ar"))
      .mockResolvedValueOnce(CATEGORIES);
    const { result } = renderHook(() => useCategoryAwards());
    await waitFor(() => expect(result.current.error).toBe("fora do ar"));

    await act(() => result.current.reload());

    expect(result.current.error).toBeNull();
    expect(result.current.categories).toEqual(CATEGORIES);
    expect(getCategoryAwards).toHaveBeenCalledTimes(2);
  });
});
