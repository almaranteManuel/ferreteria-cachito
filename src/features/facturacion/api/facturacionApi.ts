import { invoke } from '@tauri-apps/api/core';
import {
  CreateFacturaDto,
  Factura,
  FacturaWithItems,
} from '../types';

export const facturacionApi = {
  emitirFactura: async (dto: CreateFacturaDto): Promise<FacturaWithItems> => {
    return await invoke<FacturaWithItems>('emitir_factura', { dto });
  },

  listarFacturas: async (limit = 50): Promise<Factura[]> => {
    return await invoke<Factura[]>('listar_facturas', { limit });
  },

  getFactura: async (id: number): Promise<FacturaWithItems> => {
    return await invoke<FacturaWithItems>('get_factura', { id });
  },
};
