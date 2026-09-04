import React, { useCallback, useEffect, useState } from 'react';
import { Product } from '../types';
import { productApi } from '../api/productApi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calcSalePrice } from '@/features/sales/types';

interface ProductSearchBarProps {
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (product: Product) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
  debounceMs?: number;
  id?: string;
}

const nf = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  value,
  onValueChange,
  onSelect,
  placeholder = 'Código o descripción...',
  label,
  autoFocus,
  debounceMs = 250,
  id = 'producto-search',
}) => {
  const [results, setResults] = useState<Product[]>([]);

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      const res = await productApi.searchProducts(query);
      setResults(res);
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(value), debounceMs);
    return () => clearTimeout(timer);
  }, [value, searchProducts, debounceMs]);

  const handleSelect = (p: Product) => {
    onSelect(p);
    setResults([]);
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        autoComplete="off"
        autoFocus={autoFocus}
      />
      {results.length > 0 && (
        <div className="border rounded-md divide-y max-h-56 overflow-y-auto shadow-sm bg-popover">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent flex justify-between items-center text-sm transition-colors"
              onClick={() => handleSelect(p)}
            >
              <span className="truncate pr-2">
                <span className="font-mono text-xs text-muted-foreground mr-2">
                  {p.code}
                </span>
                <span className="font-medium">{p.description}</span>
              </span>
              <span className="font-semibold whitespace-nowrap ml-2">
                ${nf.format(calcSalePrice(p.price, p.variant))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
