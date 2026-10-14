import { act, renderHook, waitFor } from "@testing-library/react";
import { getCeremonies } from "../services/api.js";
import { useCeremonies } from "./useCeremonies.js";

vi.mock("../services/api.js", () => ({ getCeremonies: vi.fn() }));

const CEREMONIES = [
  { id: 1, year: "1927/28" },
  { id: 2, year: "1928/29" },
];

afterEach(() => {
  vi.mocked(getCeremonies).mockReset();
});

describe("useCeremonies", () => {
  it("começa carregando e entrega a lista de cerimônias", async () => {
    vi.mocked(getCeremonies).mockResolvedValue(CEREMONIES);
    const { result } = renderHook(() => useCeremonies());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ceremonies).toEqual(CEREMONIES);
    expect(result.current.error).toBeNull();
  });

  it("expõe a mensagem de erro e esvazia a lista quando a API falha", async () => {
    vi.mocked(getCeremonies).mockRejectedValue(new Error("fora do ar"));
    const { result } = renderHook(() => useCeremonies());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("fora do ar");
    expect(result.current.ceremonies).toEqual([]);
  });

  it("reload tenta de novo e limpa o erro anterior", async () => {
    vi.mocked(getCeremonies)
      .mockRejectedValueOnce(new Error("fora do ar"))
      .mockResolvedValueOnce(CEREMONIES);
    const { result } = renderHook(() => useCeremonies());
    await waitFor(() => expect(result.current.error).toBe("fora do ar"));

    await act(() => result.current.reload());

    expect(result.current.error).toBeNull();
    expect(result.current.ceremonies).toEqual(CEREMONIES);
  });
});
