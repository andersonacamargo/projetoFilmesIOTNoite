import { test, mock } from "node:test";
import assert from "node:assert/strict";

let serviceImplementation;

mock.module("../../services/ceremony.service.js", {
    namedExports: {
        getAllCeremonies: async () => serviceImplementation()
    }
});

const { getAllCeremonies } = await import("../../controllers/ceremony.controller.js");

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

test("getAllCeremonies (controller) responde 200 com os dados do service", async () => {
    const fakeData = [{ id: 96, year: "2023" }];
    serviceImplementation = async () => fakeData;

    const res = buildRes();
    await getAllCeremonies({}, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
        success: true,
        total: fakeData.length,
        data: fakeData
    });
});

test("getAllCeremonies (controller) responde 500 quando o service lança Error", async () => {
    serviceImplementation = async () => {
        throw new Error("Falha ao listar cerimônias: db down");
    };

    const res = buildRes();
    await getAllCeremonies({}, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /db down/);
});
