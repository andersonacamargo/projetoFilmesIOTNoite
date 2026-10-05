import cors from "cors";

// Origens liberadas quando CORS_ORIGINS não está definida: o front em desenvolvimento (Vite).
const ORIGENS_PADRAO = ["http://localhost:5173"];

// Lê CORS_ORIGINS ("https://a.com,https://b.com") e devolve a lista de origens permitidas.
export function lerOrigensPermitidas(valor = process.env.CORS_ORIGINS) {
    if (!valor || !valor.trim()) {
        return ORIGENS_PADRAO;
    }

    return valor
        .split(",")
        .map((origem) => origem.trim().replace(/\/+$/, ""))
        .filter(Boolean);
}

// Monta o middleware de CORS: só as origens da lista podem chamar a API pelo navegador.
// Requisições sem cabeçalho Origin (curl, Postman, servidor-servidor) não são afetadas pelo CORS.
export function criarCors(origens = lerOrigensPermitidas()) {
    return cors({
        origin(origem, callback) {
            if (!origem || origens.includes(origem)) {
                return callback(null, true);
            }

            // false = responde sem Access-Control-Allow-Origin, e o navegador bloqueia a leitura.
            return callback(null, false);
        },
        methods: ["GET"],
    });
}
