import { test } from "node:test";
import assert from "node:assert/strict";

function buildPlainRow(data) {
    return {
        get({ plain }) {
            assert.equal(plain, true);
            return data;
        }
    };
}

async function loadServiceWithMockedFindAll(t, findAllImpl) {
    t.mock.module("../../models/relationships.js", {
        namedExports: {
            Ceremony: { findAll: findAllImpl }
        }
    });

    return import(
        `../../services/ceremony.service.js?update=${Date.now()}-${Math.random()}`
    );
}

test("getAllCeremonies retorna a lista de cerimônias mapeada", async (t) => {
    const rows = [
        buildPlainRow({ id: 1, year: "1927/28" }),
        buildPlainRow({ id: 96, year: "2023" })
    ];

    const { getAllCeremonies } = await loadServiceWithMockedFindAll(
        t,
        async () => rows
    );

    const result = await getAllCeremonies();

    assert.deepEqual(result, [
        { id: 1, year: "1927/28" },
        { id: 96, year: "2023" }
    ]);
});

test("getAllCeremonies lança Error com mensagem clara quando a consulta falha", async (t) => {
    const { getAllCeremonies } = await loadServiceWithMockedFindAll(t, async () => {
        throw new Error("connection refused");
    });

    await assert.rejects(
        () => getAllCeremonies(),
        (err) => {
            assert.ok(err instanceof Error);
            assert.match(err.message, /Falha ao listar cerimônias/);
            assert.match(err.message, /connection refused/);
            return true;
        }
    );
});
