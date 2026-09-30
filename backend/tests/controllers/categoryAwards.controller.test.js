import { test, mock } from "node:test";
import assert from "node:assert/strict";

let serviceImplementation;

mock.module("../../services/categoryAwards.service.js", {
    namedExports: {
        getWinsByCategory: async () => {
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