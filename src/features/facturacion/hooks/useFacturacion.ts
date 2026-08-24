import { useCallback, useEffect, useState } from 'react';
import { facturacionApi } from '../api/facturacionApi';
import {
  CreateFacturaDto,
  Factura,
  FacturaWithItems,
} from '../types';

export function useFacturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFacturas(await facturacionApi.listarFacturas());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { facturas, loading, error, refresh };
}

export function useEmitirFactura(onSuccess?: (f: FacturaWithItems) => void) {
  const [emitting, setEmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimaEmitida, setUltimaEmitida] = useState<FacturaWithItems | null>(null);

  const emitir = useCallback(
    async (dto: CreateFacturaDto) => {
      setEmitting(true);
      setError(null);
      try {
        const factura = await facturacionApi.emitirFactura(dto);
        setUltimaEmitida(factura);
        onSuccess?.(factura);
        return factura;
      } catch (e) {
        setError(String(e));
        return null;
      } finally {
        setEmitting(false);
      }
    },
    [onSuccess]
  );

  const limpiar = useCallback(() => {
    setUltimaEmitida(null);
    setError(null);
  }, []);

  return { emitir, emitting, error, ultimaEmitida, limpiar };
}
