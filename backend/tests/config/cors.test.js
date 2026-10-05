import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";

import { criarCors, lerOrigensPermitidas } from "../../config/cors.js";

// ======================================================
// APP DE TESTE
// ======================================================

async function subirApp(origens) {
    const app = express();

    app.use(criarCors(origens));
    app.get("/api/ping", (req, res) => res.json({ success: true }));

    const server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));

    return {
        url: `http://127.0.0.1:${server.address().port}`,
        fechar: () => new Promise((resolve) => server.close(resolve)),
    };
}

// ======================================================
// lerOrigensPermitidas
// ======================================================

test("lerOrigensPermitidas usa o front local quando a variável está vazia", () => {
    assert.deepEqual(lerOrigensPermitidas(undefined), ["http://localhost:5173"]);
    assert.deepEqual(lerOrigensPermitidas("   "), ["http://localhost:5173"]);
});

test("lerOrigensPermitidas separa por vírgula, tira espaços e barra final", () => {
    assert.deepEqual(
        lerOrigensPermitidas(" https://filmes.vercel.app/ , http://localhost:5173,"),
        ["https://filmes.vercel.app", "http://localhost:5173"]
    );
});

// ======================================================
// criarCors
// ======================================================

test("criarCors libera origem permitida", async () => {
    const app = await subirApp(["https://filmes.vercel.app"]);

    try {
        const res = await fetch(`${app.url}/api/ping`, {
            headers: { Origin: "https://filmes.vercel.app" },
        });

        assert.equal(res.status, 200);
        assert.equal(res.headers.get("access-control-allow-origin"), "https://filmes.vercel.app");
    } finally {
        await app.fechar();
    }
});

test("criarCors não libera origem fora da lista", async () => {
    const app = await subirApp(["https://filmes.vercel.app"]);

    try {
        const res = await fetch(`${app.url}/api/ping`, {
            headers: { Origin: "https://site-qualquer.com" },
        });

        assert.equal(res.headers.get("access-control-allow-origin"), null);
    } finally {
        await app.fechar();
    }
});

test("criarCors responde preflight só para origem permitida", async () => {
    const app = await subirApp(["https://filmes.vercel.app"]);

    try {
        const permitida = await fetch(`${app.url}/api/ping`, {
            method: "OPTIONS",
            headers: {
                Origin: "https://filmes.vercel.app",
                "Access-Control-Request-Method": "GET",
            },
        });
        assert.equal(permitida.status, 204);
        assert.equal(permitida.headers.get("access-control-allow-origin"), "https://filmes.vercel.app");
        assert.match(permitida.headers.get("access-control-allow-methods"), /GET/);

        const bloqueada = await fetch(`${app.url}/api/ping`, {
            method: "OPTIONS",
            headers: {
                Origin: "https://site-qualquer.com",
                "Access-Control-Request-Method": "GET",
            },
        });
        assert.equal(bloqueada.headers.get("access-control-allow-origin"), null);
    } finally {
        await app.fechar();
    }
});

test("criarCors não bloqueia requisição sem Origin (curl, servidor)", async () => {
    const app = await subirApp(["https://filmes.vercel.app"]);

    try {
        const res = await fetch(`${app.url}/api/ping`);

        assert.equal(res.status, 200);
        assert.deepEqual(await res.json(), { success: true });
    } finally {
        await app.fechar();
    }
});
