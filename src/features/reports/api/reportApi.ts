import { invoke } from '@tauri-apps/api/core';
import { YearlyReport } from '../types';

export const reportApi = {
  getYearlyReport: async (year: number): Promise<YearlyReport> => {
    return await invoke<YearlyReport>('get_yearly_report', { year });
  },

  getAvailableYears: async (): Promise<number[]> => {
    return await invoke<number[]>('get_available_report_years');
  },
};
