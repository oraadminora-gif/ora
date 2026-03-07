// services/kpiService.ts
import api from './api';
import type { PoleKPI, NationalKPI, NationalKPIDetailed } from '../types/kpi';

export type KpiPeriod = 'semester' | 'year' | 'all';

export const fetchPoleKPIs = async (period: KpiPeriod = 'year', poleId?: number): Promise<PoleKPI> => {
  const params: Record<string, string | number> = { period };
  if (poleId) params.pole_id = poleId;
  const res = await api.get<PoleKPI>('/kpis/pole/', { params });
  return res.data;
};

export const fetchNationalKPIs = async (): Promise<NationalKPI> => {
  const res = await api.get<NationalKPI>('/kpis/national/');
  return res.data;
};

export const fetchNationalKPIsDetailed = async (
  period: KpiPeriod = 'year',
  poleId?: number
): Promise<NationalKPIDetailed> => {
  const params: Record<string, string | number> = { period };
  if (poleId) params.pole_id = poleId;
  const res = await api.get<NationalKPIDetailed>('/kpis/national/', { params });
  return res.data;
};

export const fetchPoleAlerts = async (): Promise<{ alertes_rouges: number }> => {
  const res = await api.get<PoleKPI>('/kpis/pole/', { params: { period: 'all' } });
  return { alertes_rouges: res.data.alertes_rouges_actives ?? 0 };
};
