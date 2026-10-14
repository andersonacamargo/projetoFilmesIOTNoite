// BASE_URL e DATA_SOURCE são lidos quando o módulo carrega, então cada teste
// define as variáveis de ambiente e importa o módulo de novo.
vi.mock("../data/category-awards.json", () => ({
  default: [
    {
      categoryId: 99,
      categoryName: "PLANILHA",
      winsCount: 2,
      winners: [
        { nominationId: 1, ceremony: { id: 1, year: "1927/28" } },
        { nominationId: 2, ceremony: { id: 2, year: "1928/29" } },
      ],
    },
  ],
}));

async function loadApi({ apiUrl, dataSource = "api" } = {}) {
  vi.stubEnv("VITE_API_URL", apiUrl);
  vi.stubEnv("VITE_DATA_SOURCE", dataSource);
  vi.resetModules();
  return import("./api.js");
}

function mockFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: vi.fn().mockResolvedValue(body) };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getCategoryAwards", () => {
  it("chama /api/category-awards/:ceremonyId por caminho relativo e devolve data", async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, data: [{ categoryId: 1 }] }));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards(96)).resolves.toEqual([{ categoryId: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith("/api/category-awards/96");
  });

  it("usa VITE_API_URL quando definida, sem barra duplicada", async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, data: [] }));
    const { getCategoryAwards } = await loadApi({ apiUrl: "https://back.onrender.com/" });

    await getCategoryAwards(96);
    expect(fetchMock).toHaveBeenCalledWith("https://back.onrender.com/api/category-awards/96");
  });

  it("usa caminho relativo quando VITE_API_URL nem existe", async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, data: [] }));
    const { getCategoryAwards } = await loadApi({ apiUrl: undefined });

    await getCategoryAwards(96);
    expect(fetchMock).toHaveBeenCalledWith("/api/category-awards/96");
  });

  it("devolve lista vazia quando a API não manda data", async () => {
    mockFetch(jsonResponse({ success: true }));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards(96)).resolves.toEqual([]);
  });

  it("no modo 'planilha', filtra a planilha local pela cerimônia, sem chamar a API", async () => {
    const fetchMock = mockFetch(jsonResponse({}));
    const { getCategoryAwards } = await loadApi({ dataSource: "planilha" });

    await expect(getCategoryAwards(1)).resolves.toEqual([
      {
        categoryId: 99,
        categoryName: "PLANILHA",
        winsCount: 1,
        winners: [{ nominationId: 1, ceremony: { id: 1, year: "1927/28" } }],
      },
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no modo 'planilha', omite categorias sem vencedor na cerimônia pedida", async () => {
    const { getCategoryAwards } = await loadApi({ dataSource: "planilha" });

    await expect(getCategoryAwards(999)).resolves.toEqual([]);
  });

  it("falha com mensagem clara quando a rede está fora", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards(96)).rejects.toThrow("Não foi possível alcançar a API.");
  });

  it("usa a mensagem do backend quando o status não é ok", async () => {
    mockFetch(jsonResponse({ message: "Rota não encontrada" }, { ok: false, status: 404 }));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards(96)).rejects.toThrow("Rota não encontrada");
  });

  it("informa o status quando a resposta de erro não é JSON", async () => {
    mockFetch({ ok: false, status: 500, json: vi.fn().mockRejectedValue(new SyntaxError("HTML")) });
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards(96)).rejects.toThrow("A API respondeu com status 500.");
  });

  it("falha quando a resposta ok vem sem corpo JSON", async () => {
    mockFetch(jsonResponse(null));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards(96)).rejects.toThrow("A API respondeu sem um corpo JSON válido.");
  });

  it("falha quando o backend responde success: false", async () => {
    mockFetch(jsonResponse({ success: false, message: "Banco fora do ar" }));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards(96)).rejects.toThrow("Banco fora do ar");
  });

  it("usa mensagem padrão quando success: false vem sem message", async () => {
    mockFetch(jsonResponse({ success: false }));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards(96)).rejects.toThrow("Falha na requisição para /category-awards/96.");
  });
});

describe("getCeremonies", () => {
  it("chama /api/ceremonies e devolve data", async () => {
    const fetchMock = mockFetch(
      jsonResponse({ success: true, data: [{ id: 1, year: "1927/28" }] })
    );
    const { getCeremonies } = await loadApi();

    await expect(getCeremonies()).resolves.toEqual([{ id: 1, year: "1927/28" }]);
    expect(fetchMock).toHaveBeenCalledWith("/api/ceremonies");
  });

  it("devolve lista vazia quando a API não manda data", async () => {
    mockFetch(jsonResponse({ success: true }));
    const { getCeremonies } = await loadApi();

    await expect(getCeremonies()).resolves.toEqual([]);
  });

  it("no modo 'planilha', deriva a lista de cerimônias da planilha local, sem repetir e ordenada", async () => {
    const fetchMock = mockFetch(jsonResponse({}));
    const { getCeremonies } = await loadApi({ dataSource: "planilha" });

    await expect(getCeremonies()).resolves.toEqual([
      { id: 1, year: "1927/28" },
      { id: 2, year: "1928/29" },
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falha com mensagem clara quando a rede está fora", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const { getCeremonies } = await loadApi();

    await expect(getCeremonies()).rejects.toThrow("Não foi possível alcançar a API.");
  });
});
