import { useCallback, useEffect, useState } from "react";
import { getCeremonies } from "../services/api.js";

/**
 * Carrega GET /api/ceremonies — uma vez só, independente da cerimônia
 * selecionada. Alimenta o seletor de edição no topo da página.
 */
export function useCeremonies() {
  const [ceremonies, setCeremonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setCeremonies(await getCeremonies());
    } catch (err) {
      setError(err.message);
      setCeremonies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ceremonies, loading, error, reload: load };
}
