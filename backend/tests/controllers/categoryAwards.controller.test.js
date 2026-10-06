import { test, mock } from "node:test";
import assert from "node:assert/strict";

let serviceImplementation;
let receivedId;

mock.module("../../services/categoryAwards.service.js", {
    namedExports: {
        getWinsByCategory: async (id) => {
            receivedId = id;
            return serviceImplementation();
        }
    }
});

const {
    getWinsByCategory
} = await import(
    "../../controllers/categoryAwards.controller.js"
);

function buildRes() {
    return {
        statusCode: null,
        body: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(payload) {
            this.body = payload;
            return this;
        }
    };
}

test(
    "getWinsByCategory (controller) responde 200 com os dados do service",
    async () => {
        const fakeData = [
            {
                categoryId: 1,
                categoryName: "BEST PICTURE",
                winsCount: 1,
                winners: []
            }
        ];

        serviceImplementation = async () => fakeData;

        const res = buildRes();

        await getWinsByCategory({}, res);

        assert.equal(res.statusCode, 200);

        assert.deepEqual(res.body, {
            success: true,
            total: fakeData.length,
            data: fakeData
        });
    }
);

test(
    "getWinsByCategory (controller) responde 500 quando o service lança Error",
    async () => {
        serviceImplementation = async () => {
            throw new Error(
                "Falha ao obter premiações ganhas por categoria: db down"
            );
        };

        const res = buildRes();

        await getWinsByCategory({}, res);

        assert.equal(res.statusCode, 500);
        assert.equal(res.body.success, false);

        assert.match(
            res.body.message,
            /db down/
        );
    }
);

test(
    "getWinsByCategory (controller) sem ceremony_id consulta todas as cerimônias",
    async () => {
        serviceImplementation = async () => [];
        receivedId = "não chamado";

        const res = buildRes();

        await getWinsByCategory({ params: {} }, res);

        assert.equal(res.statusCode, 200);
        assert.equal(receivedId, undefined);
    }
);

test(
    "getWinsByCategory (controller) repassa ceremony_id numérico ao service",
    async () => {
        serviceImplementation = async () => [];

        const res = buildRes();

        await getWinsByCategory({ params: { ceremony_id: "96" } }, res);

        assert.equal(res.statusCode, 200);
        assert.equal(receivedId, 96);
    }
);

test(
    "getWinsByCategory (controller) responde 400 para ceremony_id inválido",
    async () => {
        for (const ceremony_id of ["abc", "0", "-1"]) {
            const res = buildRes();

            await getWinsByCategory({ params: { ceremony_id } }, res);

            assert.equal(res.statusCode, 400);
            assert.equal(res.body.success, false);
        }
    }
);
