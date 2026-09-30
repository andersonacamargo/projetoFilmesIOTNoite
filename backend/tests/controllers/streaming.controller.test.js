import test, { mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";

// ======================================================
// MOCK DO SERVICE
// ======================================================

let buscarStreamingPorFilmIdMock;
let buscarStreamingPorImdbMock;

mock.module("../../services/streaming.service.js", {
    namedExports: {
        buscarStreamingPorFilmId: async (...args) => {
            return buscarStreamingPorFilmIdMock(...args);
        },

        buscarStreamingPorImdb: async (...args) => {
            return buscarStreamingPorImdbMock(...args);
        }
    }
});

// Importamos o controller DEPOIS do mock.
const {
    getStreamingByFilmId,
    getStreamingByImdb
} = await import(
    "../../controllers/streaming.controller.js"
);

// ======================================================
// APP DE TESTE
// ======================================================

function criarApp() {
    const app = express();

    app.use(express.json());

    app.get(
        "/api/streaming/:id",
        getStreamingByFilmId
    );

    app.get(
        "/api/streaming/imdb/:imdbId",
        getStreamingByImdb
    );

    return app;
}

// ======================================================
// SERVIDOR DE TESTE
// ======================================================

async function iniciarServidor(app) {
    const server = createServer(app);

    await new Promise((resolve) => {
        server.listen(
            0,
            "127.0.0.1",
            resolve
        );
    });

    const address = server.address();

    return {
        server,
        url: `http://127.0.0.1:${address.port}`
    };
}

async function fecharServidor(server) {
    await new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

// ======================================================
// TESTE 1
// ID DO FILME INVÁLIDO
// ======================================================

test(
    "GET /api/streaming/:id retorna 400 quando o ID não é numérico",
    async () => {
        const app = criarApp();

        const { server, url } =
            await iniciarServidor(app);

        try {
            const response = await fetch(
                `${url}/api/streaming/abc`
            );

            assert.equal(
                response.status,
                400
            );

            const body =
                await response.json();

            assert.deepEqual(body, {
                success: false,
                message:
                    "O ID do filme deve ser numérico."
            });
        } finally {
            await fecharServidor(server);
        }
    }
);

// ======================================================
// TESTE 2
// IMDb INVÁLIDO
// ======================================================

test(
    "GET /api/streaming/imdb/:imdbId retorna 400 quando o IMDb é inválido",
    async () => {
        const app = criarApp();

        const { server, url } =
            await iniciarServidor(app);

        try {
            const response = await fetch(
                `${url}/api/streaming/imdb/abc`
            );

            assert.equal(
                response.status,
                400
            );

            const body =
                await response.json();

            assert.deepEqual(body, {
                success: false,
                message:
                    "IMDb ID inválido."
            });
        } finally {
            await fecharServidor(server);
        }
    }
);

// ======================================================
// TESTE 3
// FILME NÃO ENCONTRADO
// ======================================================

test(
    "GET /api/streaming/:id retorna 404 quando o filme não existe",
    async () => {
        buscarStreamingPorFilmIdMock =
            async () => {
                throw new Error(
                    "Filme não encontrado."
                );
            };

        const app = criarApp();

        const { server, url } =
            await iniciarServidor(app);

        try {
            const response = await fetch(
                `${url}/api/streaming/999999`
            );

            assert.equal(
                response.status,
                404
            );

            const body =
                await response.json();

            assert.deepEqual(body, {
                success: false,
                message:
                    "Filme não encontrado."
            });
        } finally {
            await fecharServidor(server);
        }
    }
);

// ======================================================
// TESTE 4
// FILME SEM IMDb
// ======================================================

test(
    "GET /api/streaming/:id retorna 422 quando o filme não possui IMDb",
    async () => {
        buscarStreamingPorFilmIdMock =
            async () => {
                throw new Error(
                    "O filme não possui IMDb ID cadastrado."
                );
            };

        const app = criarApp();

        const { server, url } =
            await iniciarServidor(app);

        try {
            const response = await fetch(
                `${url}/api/streaming/10`
            );

            assert.equal(
                response.status,
                422
            );

            const body =
                await response.json();

            assert.deepEqual(body, {
                success: false,
                message:
                    "O filme não possui IMDb ID cadastrado."
            });
        } finally {
            await fecharServidor(server);
        }
    }
);

// ======================================================
// TESTE 5
// BUSCA POR ID COM SUCESSO
// ======================================================

test(
    "GET /api/streaming/:id retorna 200 quando o serviço encontra as plataformas",
    async () => {
        buscarStreamingPorFilmIdMock =
            async () => {
                return {
                    filme: "Oppenheimer",
                    filmId: 5116,
                    imdbId: "tt15398776",
                    pais: "Brasil",

                    plataformas: [
                        {
                            nome: "Amazon",
                            tipo: "aluguel",
                            preco: 9.9,
                            url: "https://example.com",
                            regiao: "BR"
                        }
                    ],

                    totalPlataformas: 1
                };
            };

        const app = criarApp();

        const { server, url } =
            await iniciarServidor(app);

        try {
            const response = await fetch(
                `${url}/api/streaming/5116`
            );

            assert.equal(
                response.status,
                200
            );

            const body =
                await response.json();

            assert.equal(
                body.success,
                true
            );

            assert.equal(
                body.data.filme,
                "Oppenheimer"
            );

            assert.equal(
                body.data.filmId,
                5116
            );

            assert.equal(
                body.data.imdbId,
                "tt15398776"
            );

            assert.equal(
                body.data.totalPlataformas,
                1
            );
        } finally {
            await fecharServidor(server);
        }
    }
);

// ======================================================
// TESTE 6
// BUSCA POR IMDb COM SUCESSO
// ======================================================

test(
    "GET /api/streaming/imdb/:imdbId retorna 200 quando o serviço encontra o filme",
    async () => {
        buscarStreamingPorImdbMock =
            async () => {
                return {
                    filme: "Oppenheimer",
                    filmId: 5116,
                    imdbId: "tt15398776",
                    pais: "Brasil",
                    plataformas: [],
                    totalPlataformas: 0
                };
            };

        const app = criarApp();

        const { server, url } =
            await iniciarServidor(app);

        try {
            const response = await fetch(
                `${url}/api/streaming/imdb/tt15398776`
            );

            assert.equal(
                response.status,
                200
            );

            const body =
                await response.json();

            assert.equal(
                body.success,
                true
            );

            assert.equal(
                body.data.imdbId,
                "tt15398776"
            );

            assert.equal(
                body.data.filme,
                "Oppenheimer"
            );
        } finally {
            await fecharServidor(server);
        }
    }
);