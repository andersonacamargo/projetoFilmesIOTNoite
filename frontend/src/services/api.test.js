// BASE_URL e DATA_SOURCE são lidos quando o módulo carrega, então cada teste
// define as variáveis de ambiente e importa o módulo de novo.
vi.mock("../data/category-awards.json", () => ({
  default: [{ categoryId: 99, categoryName: "PLANILHA", winsCount: 0, winners: [] }],
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
  it("chama /api/category-awards por caminho relativo e devolve data", async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, data: [{ categoryId: 1 }] }));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards()).resolves.toEqual([{ categoryId: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith("/api/category-awards");
  });

  it("usa VITE_API_URL quando definida, sem barra duplicada", async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, data: [] }));
    const { getCategoryAwards } = await loadApi({ apiUrl: "https://back.onrender.com/" });

    await getCategoryAwards();
    expect(fetchMock).toHaveBeenCalledWith("https://back.onrender.com/api/category-awards");
  });

  it("usa caminho relativo quando VITE_API_URL nem existe", async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, data: [] }));
    const { getCategoryAwards } = await loadApi({ apiUrl: undefined });

    await getCategoryAwards();
    expect(fetchMock).toHaveBeenCalledWith("/api/category-awards");
  });

  it("devolve lista vazia quando a API não manda data", async () => {
    mockFetch(jsonResponse({ success: true }));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards()).resolves.toEqual([]);
  });

  it("lê a planilha local no modo 'planilha', sem chamar a API", async () => {
    const fetchMock = mockFetch(jsonResponse({}));
    const { getCategoryAwards } = await loadApi({ dataSource: "planilha" });

    await expect(getCategoryAwards()).resolves.toEqual([
      { categoryId: 99, categoryName: "PLANILHA", winsCount: 0, winners: [] },
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falha com mensagem clara quando a rede está fora", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards()).rejects.toThrow("Não foi possível alcançar a API.");
  });

  it("usa a mensagem do backend quando o status não é ok", async () => {
    mockFetch(jsonResponse({ message: "Rota não encontrada" }, { ok: false, status: 404 }));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards()).rejects.toThrow("Rota não encontrada");
  });

  it("informa o status quando a resposta de erro não é JSON", async () => {
    mockFetch({ ok: false, status: 500, json: vi.fn().mockRejectedValue(new SyntaxError("HTML")) });
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards()).rejects.toThrow("A API respondeu com status 500.");
  });

  it("falha quando a resposta ok vem sem corpo JSON", async () => {
    mockFetch(jsonResponse(null));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards()).rejects.toThrow("A API respondeu sem um corpo JSON válido.");
  });

  it("falha quando o backend responde success: false", async () => {
    mockFetch(jsonResponse({ success: false, message: "Banco fora do ar" }));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards()).rejects.toThrow("Banco fora do ar");
  });

  it("usa mensagem padrão quando success: false vem sem message", async () => {
    mockFetch(jsonResponse({ success: false }));
    const { getCategoryAwards } = await loadApi();

    await expect(getCategoryAwards()).rejects.toThrow("Falha na requisição para /category-awards.");
  });
});
