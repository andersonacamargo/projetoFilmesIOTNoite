// A chave do TMDB, a lista pronta e o cache em memória vivem no escopo do
// módulo, então cada teste monta o cenário e importa o módulo de novo.
async function loadPosters({ bundled = {}, apiKey = "" } = {}) {
  vi.stubEnv("VITE_TMDB_API_KEY", apiKey);
  vi.resetModules();
  vi.doMock("../data/posters.json", () => ({ default: bundled }));
  return import("./posters.js");
}

function mockTmdb(body, { ok = true, status = 200 } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, status, json: vi.fn().mockResolvedValue(body) });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.doUnmock("../data/posters.json");
  sessionStorage.clear();
});

describe("hasPosterProvider", () => {
  it("é true quando há lista pronta", async () => {
    const { hasPosterProvider } = await loadPosters({ bundled: { tt1: "url" } });
    expect(hasPosterProvider).toBe(true);
  });

  it("é true quando só há chave do TMDB", async () => {
    const { hasPosterProvider } = await loadPosters({ apiKey: "chave" });
    expect(hasPosterProvider).toBe(true);
  });

  it("é false sem lista pronta e sem chave", async () => {
    const { hasPosterProvider } = await loadPosters();
    expect(hasPosterProvider).toBe(false);
  });
});

describe("getPosterUrl", () => {
  it("devolve null sem imdbId", async () => {
    const { getPosterUrl } = await loadPosters({ apiKey: "chave" });
    await expect(getPosterUrl(null)).resolves.toBeNull();
    await expect(getPosterUrl("")).resolves.toBeNull();
  });

  it("usa a lista pronta antes do TMDB, inclusive quando ela diz que não há pôster", async () => {
    const fetchMock = mockTmdb({});
    const { getPosterUrl } = await loadPosters({
      bundled: { tt1: "https://img/tt1.jpg", tt2: null },
      apiKey: "chave",
    });

    await expect(getPosterUrl("tt1")).resolves.toBe("https://img/tt1.jpg");
    await expect(getPosterUrl("tt2")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devolve null sem chave do TMDB, sem fazer requisição", async () => {
    const fetchMock = mockTmdb({});
    const { getPosterUrl } = await loadPosters();

    await expect(getPosterUrl("tt9")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("busca no TMDB, monta a URL da imagem e guarda no cache", async () => {
    const fetchMock = mockTmdb({ movie_results: [{ poster_path: "/abc.jpg" }] });
    const { getPosterUrl } = await loadPosters({ apiKey: "chave" });

    await expect(getPosterUrl("tt9")).resolves.toBe("https://image.tmdb.org/t/p/w500/abc.jpg");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.themoviedb.org/3/find/tt9?external_source=imdb_id&language=pt-BR&api_key=chave",
    );
    expect(sessionStorage.getItem("poster:tt9")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg");

    // Segunda chamada sai do cache em memória.
    await getPosterUrl("tt9");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("devolve null e registra no cache quando o TMDB não tem o filme", async () => {
    mockTmdb({ movie_results: [] });
    const { getPosterUrl } = await loadPosters({ apiKey: "chave" });

    await expect(getPosterUrl("tt9")).resolves.toBeNull();
    expect(sessionStorage.getItem("poster:tt9")).toBe("");
  });

  it("devolve null quando o filme existe mas não tem poster_path", async () => {
    mockTmdb({ movie_results: [{ title: "Sem imagem" }] });
    const { getPosterUrl } = await loadPosters({ apiKey: "chave" });

    await expect(getPosterUrl("tt9")).resolves.toBeNull();
  });

  it("devolve null quando o TMDB responde sem movie_results", async () => {
    mockTmdb({});
    const { getPosterUrl } = await loadPosters({ apiKey: "chave" });

    await expect(getPosterUrl("tt9")).resolves.toBeNull();
  });

  it("lança erro quando o TMDB responde com status de falha", async () => {
    mockTmdb({}, { ok: false, status: 401 });
    const { getPosterUrl } = await loadPosters({ apiKey: "chave" });

    await expect(getPosterUrl("tt9")).rejects.toThrow("TMDB respondeu 401 para tt9");
  });

  it("reaproveita o sessionStorage de uma visita anterior", async () => {
    sessionStorage.setItem("poster:tt1", "https://img/salvo.jpg");
    sessionStorage.setItem("poster:tt2", "");
    const fetchMock = mockTmdb({});
    const { getPosterUrl } = await loadPosters({ apiKey: "chave" });

    await expect(getPosterUrl("tt1")).resolves.toBe("https://img/salvo.jpg");
    // String vazia = "já consultei e não existe pôster".
    await expect(getPosterUrl("tt2")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("segue funcionando quando o sessionStorage está indisponível", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cota cheia");
    });
    const fetchMock = mockTmdb({ movie_results: [{ poster_path: "/x.jpg" }] });
    const { getPosterUrl } = await loadPosters({ apiKey: "chave" });

    await expect(getPosterUrl("tt9")).resolves.toBe("https://image.tmdb.org/t/p/w500/x.jpg");
    // O cache em memória ainda evita a segunda requisição.
    await getPosterUrl("tt9");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
