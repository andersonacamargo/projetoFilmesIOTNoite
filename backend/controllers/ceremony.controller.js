// Controller de cerimônias
// Traduz o resultado (ou erro) do service em resposta HTTP

import * as service from "../services/ceremony.service.js";

export async function getAllCeremonies(_req, res) {
    try {
        const data = await service.getAllCeremonies();

        return res.status(200).json({
            success: true,
            total: data.length,
            data
        });
    } catch (err) {
        if (err instanceof Error) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Erro interno inesperado."
        });
    }
}
