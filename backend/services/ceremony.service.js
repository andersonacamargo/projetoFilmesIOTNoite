/**
 * Service de cerimônias.
 *
 * Responsabilidade: listar as cerimônias existentes (id + ano), para
 * alimentar o seletor de edição no front — leve o suficiente para não
 * precisar carregar o payload inteiro de /category-awards/:ceremony_id
 * só para saber quais anos existem.
 *
 * Estratégia de erro: lança Error com mensagem clara em falhas de consulta.
 * O controller deve capturar e traduzir em HTTP.
 */

import { Ceremony } from "../models/relationships.js";

/**
 * Lista todas as cerimônias cadastradas, da mais antiga para a mais recente.
 *
 * @returns {Promise<Array<{ id: number, year: string }>>}
 * @throws {Error} Quando a consulta ao banco falha.
 */
export async function getAllCeremonies() {
    try {
        const ceremonies = await Ceremony.findAll({
            attributes: ["id", "year"],
            order: [["id", "ASC"]]
        });

        return ceremonies.map((ceremony) => ceremony.get({ plain: true }));
    } catch (error) {
        throw new Error(`Falha ao listar cerimônias: ${error.message}`);
    }
}
