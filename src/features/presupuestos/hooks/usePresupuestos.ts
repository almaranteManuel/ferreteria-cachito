import { useCallback, useEffect, useState } from 'react';
import { presupuestoApi } from '../api/presupuestoApi';
import {
  CreatePresupuestoDto,
  Presupuesto,
  PresupuestoWithItems,
} from '../types';

export function usePresupuestos() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPresupuestos(await presupuestoApi.listar());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { presupuestos, loading, error, refresh };
}

export function useCrearPresupuesto(onSuccess?: (p: PresupuestoWithItems) => void) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimo, setUltimo] = useState<PresupuestoWithItems | null>(null);

  const crear = useCallback(
    async (dto: CreatePresupuestoDto) => {
      setCreating(true);
      setError(null);
      try {
        const p = await presupuestoApi.crear(dto);
        setUltimo(p);
        onSuccess?.(p);
        return p;
      } catch (e) {
        setError(String(e));
        return null;
      } finally {
        setCreating(false);
      }
    },
    [onSuccess],
  );

  const limpiar = useCallback(() => {
    setUltimo(null);
    setError(null);
  }, []);

  return { crear, creating, error, ultimo, limpiar, setError };
}
