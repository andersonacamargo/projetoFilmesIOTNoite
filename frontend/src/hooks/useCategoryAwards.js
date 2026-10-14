import { useCallback, useEffect, useState } from "react";
import { getCategoryAwards } from "../services/api.js";

/**
 * Carrega GET /api/category-awards/:ceremonyId.
 *
 * A rota exige uma cerimônia — enquanto `ceremonyId` for nulo/indefinido
 * (ex: a lista de cerimônias ainda não carregou), não busca nada e mantém
 * `categories` vazio, sem erro. Refaz a busca sozinho quando `ceremonyId`
 * muda. Expõe `reload` para a tela oferecer "tentar novamente" quando o
 * backend estiver fora do ar.
 */
export function useCategoryAwards(ceremonyId) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(Boolean(ceremonyId));
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!ceremonyId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setCategories(await getCategoryAwards(ceremonyId));
    } catch (err) {
      setError(err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [ceremonyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, loading, error, reload: load };
}
