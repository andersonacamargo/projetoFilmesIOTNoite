import Film from "../models/film.model.js";

const WATCHMODE_API_URL = "https://api.watchmode.com/v1";

// Tempo que o resultado fica no cache.
// 10 minutos.
const CACHE_TTL = 10 * 60 * 1000;

// Cache das respostas já processadas.
const streamingCache = new Map();

// Requisições que já estão acontecendo.
// Evita duas consultas simultâneas para o mesmo filme.
const requisicoesEmAndamento = new Map();

function getWatchmodeApiKey() {
    if (!process.env.WATCHMODE_API_KEY) {
        throw new Error("WATCHMODE_API_KEY não configurada.");
    }

    return process.env.WATCHMODE_API_KEY;
}

async function consultarWatchmode(imdbId) {
    const apiKey = getWatchmodeApiKey();

    const url =
        `${WATCHMODE_API_URL}/title/${imdbId}/sources` +
        `?regions=BR`;

    const inicio = performance.now();

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 8000);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-API-Key": apiKey
            },
            signal: controller.signal
        });

        if (!response.ok) {
            const erro = await response.text();

            throw new Error(
                `Erro na Watchmode (${response.status}): ${erro}`
            );
        }

        const data = await response.json();

        const fim = performance.now();

        console.log(
            `[WATCHMODE] ${imdbId} respondeu em ${Math.round(
                fim - inicio
            )}ms`
        );

        return data;
    } catch (error) {
        const fim = performance.now();

        if (error.name === "AbortError") {
            throw new Error(
                `A Watchmode demorou mais de 8 segundos para responder.`
            );
        }

        console.error(
            `[WATCHMODE] Erro após ${Math.round(
                fim - inicio
            )}ms`
        );

        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function normalizarTipo(tipo) {
    switch (tipo) {
        case "sub":
            return "assinatura";

        case "free":
            return "gratuito";

        case "tve":
            return "TV";

        case "rent":
            return "aluguel";

        case "buy":
            return "compra";

        default:
            return tipo || "outro";
    }
}

function normalizarFontes(sources) {
    if (!Array.isArray(sources)) {
        return [];
    }

    const fontes = [];
    const existentes = new Set();

    for (const source of sources) {
        const fonte = {
            nome: source.name || null,
            tipo: normalizarTipo(source.type),
            preco: source.price ?? null,
            url: source.web_url || null,
            regiao: source.region || "BR"
        };

        const chave = [
            fonte.nome,
            fonte.tipo,
            fonte.preco,
            fonte.url,
            fonte.regiao
        ].join("|");

        if (existentes.has(chave)) {
            continue;
        }

        existentes.add(chave);
        fontes.push(fonte);
    }

    return fontes;
}

function buscarCache(imdbId) {
    const registro = streamingCache.get(imdbId);

    if (!registro) {
        return null;
    }

    const expirado =
        Date.now() - registro.timestamp > CACHE_TTL;

    if (expirado) {
        streamingCache.delete(imdbId);
        return null;
    }

    return registro.data;
}

function salvarCache(imdbId, data) {
    streamingCache.set(imdbId, {
        timestamp: Date.now(),
        data
    });
}

export async function buscarStreamingPorFilmId(filmId) {
    const filme = await Film.findByPk(filmId);

    if (!filme) {
        throw new Error("Filme não encontrado.");
    }

    if (!filme.imdb_id) {
        throw new Error(
            "O filme não possui IMDb ID cadastrado."
        );
    }

    return buscarStreaming(filme);
}

export async function buscarStreamingPorImdb(imdbId) {
    const filme = await Film.findOne({
        where: {
            imdb_id: imdbId
        }
    });

    if (!filme) {
        throw new Error("Filme não encontrado.");
    }

    return buscarStreaming(filme);
}

async function buscarStreaming(filme) {
    const inicio = performance.now();

    try {
        const imdbId = filme.imdb_id;

        // 1. Verifica o cache
        const cache = buscarCache(imdbId);

        if (cache) {
            const fim = performance.now();

            console.log(
                `[STREAMING] ${imdbId} retornado do cache em ${Math.round(
                    fim - inicio
                )}ms`
            );

            return cache;
        }

        // 2. Verifica se já existe uma requisição em andamento
        if (requisicoesEmAndamento.has(imdbId)) {
            console.log(
                `[STREAMING] ${imdbId} já está sendo consultado. Aguardando requisição existente...`
            );

            return await requisicoesEmAndamento.get(imdbId);
        }

        // 3. Cria a requisição para a Watchmode
        const requisicao = (async () => {
            try {
                const sources = await consultarWatchmode(imdbId);

                const plataformas = normalizarFontes(
                    sources
                );

                const resultado = {
                    filme: filme.title,
                    filmId: filme.id,
                    imdbId: filme.imdb_id,
                    pais: "Brasil",
                    plataformas,
                    totalPlataformas: plataformas.length
                };

                // 4. Salva somente respostas válidas no cache
                salvarCache(imdbId, resultado);

                return resultado;
            } finally {
                // Remove a requisição da lista quando terminar
                requisicoesEmAndamento.delete(imdbId);
            }
        })();

        requisicoesEmAndamento.set(
            imdbId,
            requisicao
        );

        const resultado = await requisicao;

        const fim = performance.now();

        console.log(
            `[STREAMING] ${imdbId} concluído em ${Math.round(
                fim - inicio
            )}ms`
        );

        return resultado;
    } catch (error) {
        const fim = performance.now();

        console.error(
            `[STREAMING] Erro após ${Math.round(
                fim - inicio
            )}ms`
        );

        console.error(
            "Erro ao consultar streaming:",
            error
        );

        throw new Error(
            `Falha ao consultar disponibilidade de streaming: ${error.message}`
        );
    }
}