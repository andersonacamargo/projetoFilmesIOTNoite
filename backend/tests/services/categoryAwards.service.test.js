import { test, mock } from "node:test";
import assert from "node:assert/strict";

let fakeCategoryFindAll;

mock.module("../../models/relationships.js", {
    namedExports: {
        Category: {
            findAll: async (...args) => {
                return fakeCategoryFindAll(...args);
            }
        },

        Nomination: {},
        Film: {},
        Person: {},
        Ceremony: {}
    }
});

const { getWinsByCategory } = await import(
    "../../services/categoryAwards.service.js"
);

function criarCategoria(dados) {
    return {
        get() {
            return {
                ...dados
            };
        }
    };
}

test(
    "getWinsByCategory retorna categorias com vencedores mapeados corretamente",
    async () => {
        fakeCategoryFindAll = async () => [
            criarCategoria({
                id: 1,
                name: "BEST PICTURE",
                class: "Principal",
                nominations: [
                    {
                        id: 10,
                        category_label: "BEST PICTURE",
                        note: "Vencedor",
                        citation: "Oscar",
                        ceremony: {
                            id: 96,
                            year: 2024
                        },
                        films: [
                            {
                                id: 100,
                                imdb_id: "tt15398776",
                                title: "Oppenheimer",
                                NominationFilm: {
                                    detail: "Winner"
                                }
                            }
                        ],
                        nominees: [
                            {
                                id: 200,
                                imdb_id: "nm0000001",
                                name: "Christopher Nolan"
                            }
                        ]
                    }
                ]
            })
        ];

        const result = await getWinsByCategory();

        assert.deepEqual(result, [
            {
                categoryId: 1,
                categoryName: "BEST PICTURE",
                categoryClass: "Principal",
                winsCount: 1,
                winners: [
                    {
                        nominationId: 10,
                        categoryLabel: "BEST PICTURE",
                        note: "Vencedor",
                        citation: "Oscar",
                        ceremony: {
                            id: 96,
                            year: 2024
                        },
                        films: [
                            {
                                id: 100,
                                imdbId: "tt15398776",
                                title: "Oppenheimer",
                                detail: "Winner"
                            }
                        ],
                        nominees: [
                            {
                                id: 200,
                                imdbId: "nm0000001",
                                name: "Christopher Nolan"
                            }
                        ]
                    }
                ]
            }
        ]);
    }
);

test(
    "getWinsByCategory retorna winsCount 0 e winners vazio quando a categoria não tem vencedores",
    async () => {
        fakeCategoryFindAll = async () => [
            criarCategoria({
                id: 2,
                name: "BEST SOUND",
                class: "Técnica",
                nominations: []
            })
        ];

        const result = await getWinsByCategory();

        assert.deepEqual(result, [
            {
                categoryId: 2,
                categoryName: "BEST SOUND",
                categoryClass: "Técnica",
                winsCount: 0,
                winners: []
            }
        ]);
    }
);

test(
    "getWinsByCategory lança Error com mensagem clara quando a consulta falha",
    async () => {
        fakeCategoryFindAll = async () => {
            throw new Error("db down");
        };

        await assert.rejects(
            () => getWinsByCategory(),
            {
                message:
                    "Falha ao obter premiações ganhas por categoria: db down"
            }
        );
    }
);