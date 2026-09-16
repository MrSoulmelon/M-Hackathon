export interface Facility {
  facility_id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  type: 'clinic' | 'hospital' | 'pharmacy';
  catchment_population: number;
  supplier_id: string;
  neighbors: string[];
}

export interface Medicine {
  medicine_id: string;
  name: string;
  category: 'essential' | 'routine';
}

export interface RiskScore {
  facility_id: string;
  medicine_id: string;
  medicine_name: string;
  risk_level: 'green' | 'amber' | 'red';
  days_of_supply: number;
  projected_stockout_date: string;
  confidence: 'low' | 'medium' | 'high';
  confidence_note: string;
  signals: {
    consumption_trend: 'stable' | 'rising' | 'falling';
    consumption_anomaly_score: number;
    replenishment_status: 'on_time' | 'delayed' | 'overdue';
    replenishment_delay_days: number;
  };
  reason_codes: string[];
}

export interface Alert {
  alert_id: string;
  scope: 'local' | 'systemic';
  district: string;
  supplier_id: string;
  medicine_id: string;
  medicine_name?: string;
  medicine_ids?: string[];
  affected_facilities: string[];
  pct_facilities_amber_or_red: number;
  diagnosis: 'supplier_delay' | 'demand_spike' | 'mixed';
  summary: string;
}

export interface Recommendation {
  recommendation_id: string;
  type: 'redistribution' | 'expedite' | 'escalate';
  medicine_id: string;
  medicine_name: string;
  from_facility_id?: string;
  to_facility_id: string;
  suggested_quantity?: number;
  travel_time_minutes?: number;
  priority_score: number;
  priority_reason: string;
}

export interface StockHistoryPoint {
  day: number;
  label: string;
  actual: number | null;
  projected: number | null;
}

export type RiskLevel = 'green' | 'amber' | 'red';
