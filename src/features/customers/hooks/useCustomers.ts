import { useState, useEffect, useCallback } from 'react';
import { Customer } from '../types';
import { customerApi } from '../api/customerApi';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await customerApi.searchCustomers(query);
      setCustomers(results);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchCustomers]);

  return {
    customers,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refreshCustomers: () => fetchCustomers(searchQuery),
  };
}
