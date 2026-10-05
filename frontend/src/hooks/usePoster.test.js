import { renderHook, waitFor } from "@testing-library/react";
import { getPosterUrl } from "../services/posters.js";
import { usePoster } from "./usePoster.js";

vi.mock("../services/posters.js", () => ({ getPosterUrl: vi.fn() }));

/** Promise que o teste resolve ou rejeita quando quiser. */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.mocked(getPosterUrl).mockReset();
});

describe("usePoster", () => {
  it("fica null sem imdbId e não consulta o serviço", () => {
    const { result } = renderHook(() => usePoster(null));
    expect(result.current).toBeNull();
    expect(getPosterUrl).not.toHaveBeenCalled();
  });

  it("devolve a URL resolvida pelo serviço", async () => {
    vi.mocked(getPosterUrl).mockResolvedValue("https://img/tt1.jpg");
    const { result } = renderHook(() => usePoster("tt1"));

    await waitFor(() => expect(result.current).toBe("https://img/tt1.jpg"));
    expect(getPosterUrl).toHaveBeenCalledWith("tt1");
  });

  it("cai para null quando o serviço falha", async () => {
    vi.mocked(getPosterUrl).mockRejectedValue(new Error("TMDB fora"));
    const { result } = renderHook(() => usePoster("tt1"));

    await waitFor(() => expect(getPosterUrl).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it("volta para null quando o imdbId some", async () => {
    vi.mocked(getPosterUrl).mockResolvedValue("https://img/tt1.jpg");
    const { result, rerender } = renderHook(({ id }) => usePoster(id), { initialProps: { id: "tt1" } });
    await waitFor(() => expect(result.current).toBe("https://img/tt1.jpg"));

    rerender({ id: null });
    expect(result.current).toBeNull();
  });

  it("ignora a resposta de um imdbId antigo (sucesso ou erro) depois da troca", async () => {
    const primeiro = deferred();
    const segundo = deferred();
    const terceiro = deferred();
    vi.mocked(getPosterUrl)
      .mockReturnValueOnce(primeiro.promise)
      .mockReturnValueOnce(segundo.promise)
      .mockReturnValueOnce(terceiro.promise);

    const { result, rerender } = renderHook(({ id }) => usePoster(id), { initialProps: { id: "tt1" } });
    rerender({ id: "tt2" });
    rerender({ id: "tt3" });

    terceiro.resolve("https://img/tt3.jpg");
    await waitFor(() => expect(result.current).toBe("https://img/tt3.jpg"));

    // Respostas atrasadas de filmes anteriores não podem sobrescrever o atual.
    primeiro.resolve("https://img/tt1.jpg");
    segundo.reject(new Error("atrasado"));
    await Promise.allSettled([primeiro.promise, segundo.promise]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current).toBe("https://img/tt3.jpg");
  });
});
