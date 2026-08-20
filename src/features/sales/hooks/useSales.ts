import { useState, useEffect, useCallback } from 'react';
import { Sale } from '../types';
import { saleApi } from '../api/saleApi';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await saleApi.listRecentSales(50);
      setSales(results);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return { sales, loading, error, refreshSales: fetchSales };
}
