import { invoke } from '@tauri-apps/api/core';
import {
  CreatePresupuestoDto,
  Presupuesto,
  PresupuestoWithItems,
} from '../types';

export const presupuestoApi = {
  crear: async (dto: CreatePresupuestoDto): Promise<PresupuestoWithItems> => {
    return await invoke<PresupuestoWithItems>('crear_presupuesto', { dto });
  },

  listar: async (limit = 50): Promise<Presupuesto[]> => {
    return await invoke<Presupuesto[]>('listar_presupuestos', { limit });
  },

  getById: async (id: number): Promise<PresupuestoWithItems> => {
    return await invoke<PresupuestoWithItems>('get_presupuesto', { id });
  },

  eliminar: async (id: number): Promise<void> => {
    return await invoke<void>('eliminar_presupuesto', { id });
  },
};
