import {
    buscarStreamingPorFilmId,
    buscarStreamingPorImdb
} from "../services/streaming.service.js";

function responderErro(res, error) {
    const mensagem = error.message || "";

    // Filme não encontrado
    if (mensagem === "Filme não encontrado.") {
        return res.status(404).json({
            success: false,
            message: mensagem
        });
    }

    // IMDb não cadastrado
    if (
        mensagem ===
        "O filme não possui IMDb ID cadastrado."
    ) {
        return res.status(422).json({
            success: false,
            message: mensagem
        });
    }

    // Timeout da Watchmode
    if (
        mensagem.includes(
            "demorou mais de 8 segundos"
        )
    ) {
        console.error(
            "[STREAMING] Timeout na Watchmode:",
            mensagem
        );

        return res.status(504).json({
            success: false,
            message:
                "A plataforma de streaming demorou para responder. Tente novamente."
        });
    }

    // Erros da Watchmode
    if (
        mensagem.includes("Erro na Watchmode")
    ) {
        console.error(
            "[STREAMING] Erro na Watchmode:",
            mensagem
        );

        return res.status(502).json({
            success: false,
            message:
                "Não foi possível consultar a disponibilidade de streaming no momento."
        });
    }

    // API Key ausente
    if (
        mensagem.includes(
            "WATCHMODE_API_KEY não configurada"
        )
    ) {
        console.error(
            "[STREAMING] WATCHMODE_API_KEY não configurada."
        );

        return res.status(500).json({
            success: false,
            message:
                "A integração com o serviço de streaming não está configurada."
        });
    }

    // Erro interno inesperado
    console.error(
        "[STREAMING] Erro interno inesperado:",
        error
    );

    return res.status(500).json({
        success: false,
        message: "Erro interno ao consultar streaming."
    });
}

export async function getStreamingByFilmId(req, res) {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "O ID do filme deve ser numérico."
            });
        }

        const data =
            await buscarStreamingPorFilmId(
                Number(id)
            );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function getStreamingByImdb(req, res) {
    try {
        const { imdbId } = req.params;

        if (!/^tt\d+$/.test(imdbId)) {
            return res.status(400).json({
                success: false,
                message: "IMDb ID inválido."
            });
        }

        const data =
            await buscarStreamingPorImdb(
                imdbId
            );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        return responderErro(res, error);
    }
}