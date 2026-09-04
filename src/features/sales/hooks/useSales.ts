import { useState, useEffect, useCallback } from 'react';
import { Sale } from '../types';
import { saleApi } from '../api/saleApi';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  const fetchSales = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = start && end
        ? await saleApi.listSalesByDateRange(start, end)
        : await saleApi.listRecentSales(50);
      setSales(results);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dateRange) {
      fetchSales(dateRange.start, dateRange.end);
    } else {
      fetchSales();
    }
  }, [dateRange, fetchSales]);

  const deleteSale = async (id: number) => {
    await saleApi.deleteSale(id);
    if (dateRange) {
      fetchSales(dateRange.start, dateRange.end);
    } else {
      fetchSales();
    }
  };

  return {
    sales,
    loading,
    error,
    dateRange,
    setDateRange,
    deleteSale,
    refreshSales: () => {
      if (dateRange) {
        fetchSales(dateRange.start, dateRange.end);
      } else {
        fetchSales();
      }
    },
  };
}
