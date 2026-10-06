// Controller de premiações por categoria
// Traduz o resultado (ou erro) do service em resposta HTTP

import * as service from "../services/categoryAwards.service.js";

export async function getWinsByCategory(req, res) {
    try {
        const { ceremony_id } = req.params ?? {}

        // ceremony_id é opcional: sem ele, devolve todas as cerimônias.
        if (ceremony_id !== undefined && !/^[1-9]\d*$/.test(ceremony_id)) {
            return res.status(400).json({
                success: false,
                message: "ceremony_id deve ser um número inteiro positivo."
            });
        }

        const data = await service.getWinsByCategory(
            ceremony_id === undefined ? undefined : Number(ceremony_id)
        );

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

        console.error(err)
        return res.status(500).json({
            success: false,
            message: "Erro interno inesperado."
        });
    }
}