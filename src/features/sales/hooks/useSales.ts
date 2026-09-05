import { useState, useEffect, useCallback } from 'react';
import { Sale } from '../types';
import { saleApi } from '../api/saleApi';

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const getMonthRange = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
};

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(
    getMonthRange(getCurrentMonth()),
  );

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
    fetchSales(dateRange.start, dateRange.end);
  }, [dateRange, fetchSales]);

  const changeMonth = (month: string) => {
    setSelectedMonth(month);
    setDateRange(getMonthRange(month));
  };

  const deleteSale = async (id: number) => {
    await saleApi.deleteSale(id);
    await fetchSales(dateRange.start, dateRange.end);
  };

  return {
    sales,
    loading,
    error,
    dateRange,
    setDateRange,
    deleteSale,
    refreshSales: async () => {
      await fetchSales(dateRange.start, dateRange.end);
    },
    selectedMonth,
    setSelectedMonth: changeMonth,
  };
}
