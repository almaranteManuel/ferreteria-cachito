import { useState, useEffect, useCallback } from 'react';
import { Supplier } from '../types';
import { supplierApi } from '../api/supplierApi';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      // Llamamos a searchSuppliers pasándole el término tipeado (o string vacío)
      const results = await supplierApi.searchSuppliers(query);
      setSuppliers(results);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers(searchQuery);
    }, 250); // Debounce de 250ms

    return () => clearTimeout(timer);
  }, [searchQuery, fetchSuppliers]);

  return {
    suppliers,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refreshSuppliers: () => fetchSuppliers(searchQuery),
  };
}