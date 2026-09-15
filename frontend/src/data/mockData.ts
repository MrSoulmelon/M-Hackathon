import type { Facility, Medicine, RiskScore, Alert, Recommendation, StockHistoryPoint, RiskLevel } from '../types';

export const mockFacilities: Facility[] = [
  { facility_id: 'FAC-001', name: 'St. Jude Regional Hospital', district: 'Central Metro', lat: -1.286389, lon: 36.817223, type: 'hospital', catchment_population: 84000, supplier_id: 'SUP-ALPHA-01', neighbors: ['FAC-002', 'FAC-004'] },
  { facility_id: 'FAC-002', name: 'Metro North Health Center', district: 'Central Metro', lat: -1.2651, lon: 36.8021, type: 'clinic', catchment_population: 28000, supplier_id: 'SUP-ALPHA-01', neighbors: ['FAC-001', 'FAC-003'] },
  { facility_id: 'FAC-003', name: 'Kibera Community Clinic', district: 'Central Metro', lat: -1.3133, lon: 36.7844, type: 'clinic', catchment_population: 45000, supplier_id: 'SUP-ALPHA-01', neighbors: ['FAC-002'] },
  { facility_id: 'FAC-004', name: 'Avenue Central Dispensary', district: 'Central Metro', lat: -1.291, lon: 36.822, type: 'pharmacy', catchment_population: 16000, supplier_id: 'SUP-BETA-02', neighbors: ['FAC-001'] },
  { facility_id: 'FAC-005', name: 'Highland General Hospital', district: 'Northern Highland', lat: -0.4201, lon: 36.9475, type: 'hospital', catchment_population: 62000, supplier_id: 'SUP-GAMMA-03', neighbors: ['FAC-006', 'FAC-007'] },
  { facility_id: 'FAC-006', name: 'Mountview District Clinic', district: 'Northern Highland', lat: -0.38, lon: 36.91, type: 'clinic', catchment_population: 21000, supplier_id: 'SUP-GAMMA-03', neighbors: ['FAC-005'] },
  { facility_id: 'FAC-007', name: 'Solio Rural Pharmacy', district: 'Northern Highland', lat: -0.45, lon: 36.98, type: 'pharmacy', catchment_population: 9500, supplier_id: 'SUP-BETA-02', neighbors: ['FAC-005'] },
  { facility_id: 'FAC-008', name: 'Nyeri Hill Maternity Post', district: 'Northern Highland', lat: -0.43, lon: 36.92, type: 'clinic', catchment_population: 14000, supplier_id: 'SUP-GAMMA-03', neighbors: ['FAC-006'] },
  { facility_id: 'FAC-009', name: 'Eastern Valley Medical Hub', district: 'Eastern Valley', lat: -0.98, lon: 37.45, type: 'hospital', catchment_population: 71000, supplier_id: 'SUP-DELTA-04', neighbors: ['FAC-010', 'FAC-011'] },
  { facility_id: 'FAC-010', name: 'Riftview Outreach Center', district: 'Eastern Valley', lat: -1.02, lon: 37.41, type: 'clinic', catchment_population: 18500, supplier_id: 'SUP-DELTA-04', neighbors: ['FAC-009'] },
  { facility_id: 'FAC-011', name: 'Machakos Way Dispensary', district: 'Eastern Valley', lat: -0.96, lon: 37.49, type: 'pharmacy', catchment_population: 12000, supplier_id: 'SUP-BETA-02', neighbors: ['FAC-009'] },
  { facility_id: 'FAC-012', name: 'Yatta Foothills Care Unit', district: 'Eastern Valley', lat: -1.05, lon: 37.52, type: 'clinic', catchment_population: 15000, supplier_id: 'SUP-DELTA-04', neighbors: ['FAC-010'] },
  { facility_id: 'FAC-013', name: 'Coast Provincial Referral Hospital', district: 'Coastal Delta', lat: -4.0435, lon: 39.6682, type: 'hospital', catchment_population: 95000, supplier_id: 'SUP-ALPHA-01', neighbors: ['FAC-014', 'FAC-015'] },
  { facility_id: 'FAC-014', name: 'Portside Family Clinic', district: 'Coastal Delta', lat: -4.06, lon: 39.64, type: 'clinic', catchment_population: 31000, supplier_id: 'SUP-ALPHA-01', neighbors: ['FAC-013'] },
  { facility_id: 'FAC-015', name: 'Nyali Coastal Dispensary', district: 'Coastal Delta', lat: -4.02, lon: 39.69, type: 'pharmacy', catchment_population: 14500, supplier_id: 'SUP-BETA-02', neighbors: ['FAC-013'] },
  { facility_id: 'FAC-016', name: 'Likoni Crossing Health Center', district: 'Coastal Delta', lat: -4.08, lon: 39.65, type: 'clinic', catchment_population: 29000, supplier_id: 'SUP-ALPHA-01', neighbors: ['FAC-014'] },
  { facility_id: 'FAC-017', name: 'Kilifi Creekside Post', district: 'Coastal Delta', lat: -3.63, lon: 39.85, type: 'clinic', catchment_population: 11000, supplier_id: 'SUP-BETA-02', neighbors: ['FAC-013'] },
  { facility_id: 'FAC-018', name: 'Bamburi Municipal Clinic', district: 'Coastal Delta', lat: -3.99, lon: 39.71, type: 'clinic', catchment_population: 22000, supplier_id: 'SUP-ALPHA-01', neighbors: ['FAC-015'] },
];

export const mockMedicines: Medicine[] = [
  { medicine_id: 'MED-001', name: 'Amoxicillin 500mg Oral', category: 'essential' },
  { medicine_id: 'MED-002', name: 'Artemether-Lumefantrine (ACT)', category: 'essential' },
  { medicine_id: 'MED-003', name: 'Oxytocin 10 IU/ml Injection', category: 'essential' },
  { medicine_id: 'MED-004', name: 'Metformin 500mg Tab', category: 'routine' },
  { medicine_id: 'MED-005', name: 'Gentamicin 80mg/2ml', category: 'essential' },
  { medicine_id: 'MED-006', name: 'Salbutamol Inhaler 100mcg', category: 'routine' },
  { medicine_id: 'MED-007', name: 'Paracetamol 500mg Tab', category: 'routine' },
  { medicine_id: 'MED-008', name: 'Ceftriaxone 1g Powder', category: 'essential' },
];

// Explicit risk scores for the systemic + isolated scenarios
const explicitRiskScores: RiskScore[] = [
  // FAC-001 (St. Jude — systemic victim of SUP-ALPHA-01 delay)
  {
    facility_id: 'FAC-001', medicine_id: 'MED-001', medicine_name: 'Amoxicillin 500mg Oral',
    risk_level: 'red', days_of_supply: 4, projected_stockout_date: 'Sep 17', confidence: 'high',
    confidence_note: 'Complete sensor telemetry & inventory scans over 90 days',
    signals: { consumption_trend: 'rising', consumption_anomaly_score: 0.88, replenishment_status: 'overdue', replenishment_delay_days: 9 },
    reason_codes: ['SUPPLIER_OVERDUE_9D', 'BURN_RATE_SPIKE_40PCT', 'BUFFER_BELOW_THRESHOLD'],
  },
  {
    facility_id: 'FAC-001', medicine_id: 'MED-002', medicine_name: 'Artemether-Lumefantrine (ACT)',
    risk_level: 'amber', days_of_supply: 9, projected_stockout_date: 'Sep 22', confidence: 'medium',
    confidence_note: 'Partial weekly counts; seasonal trend factored',
    signals: { consumption_trend: 'rising', consumption_anomaly_score: 0.62, replenishment_status: 'delayed', replenishment_delay_days: 4 },
    reason_codes: ['SEASONAL_MALARIA_UPTICK', 'SUPPLIER_DELAY_4D'],
  },
  {
    facility_id: 'FAC-001', medicine_id: 'MED-003', medicine_name: 'Oxytocin 10 IU/ml Injection',
    risk_level: 'green', days_of_supply: 38, projected_stockout_date: 'Oct 29', confidence: 'high',
    confidence_note: 'Cold-chain tracked; steady baseline',
    signals: { consumption_trend: 'stable', consumption_anomaly_score: 0.12, replenishment_status: 'on_time', replenishment_delay_days: 0 },
    reason_codes: ['INVENTORY_STABLE'],
  },

  // FAC-002 (Metro North — also under SUP-ALPHA-01)
  {
    facility_id: 'FAC-002', medicine_id: 'MED-001', medicine_name: 'Amoxicillin 500mg Oral',
    risk_level: 'red', days_of_supply: 3, projected_stockout_date: 'Sep 16', confidence: 'high',
    confidence_note: 'Verified daily dispensing counts',
    signals: { consumption_trend: 'stable', consumption_anomaly_score: 0.79, replenishment_status: 'overdue', replenishment_delay_days: 8 },
    reason_codes: ['SUPPLIER_HUB_BOTTLENECK', 'CRITICAL_BUFFER_VIOLATION'],
  },

  // FAC-003 (Kibera Clinic — also under SUP-ALPHA-01)
  {
    facility_id: 'FAC-003', medicine_id: 'MED-001', medicine_name: 'Amoxicillin 500mg Oral',
    risk_level: 'amber', days_of_supply: 8, projected_stockout_date: 'Sep 21', confidence: 'medium',
    confidence_note: 'High variance in daily walk-in demand',
    signals: { consumption_trend: 'rising', consumption_anomaly_score: 0.68, replenishment_status: 'delayed', replenishment_delay_days: 5 },
    reason_codes: ['SUPPLIER_DELAY_5D', 'URBAN_HIGH_DENSITY_SURGE'],
  },

  // FAC-013 (Coast Provincial — also under SUP-ALPHA-01, red on Amoxicillin)
  {
    facility_id: 'FAC-013', medicine_id: 'MED-001', medicine_name: 'Amoxicillin 500mg Oral',
    risk_level: 'red', days_of_supply: 5, projected_stockout_date: 'Sep 18', confidence: 'high',
    confidence_note: 'Hospital ERP feed synchronized',
    signals: { consumption_trend: 'rising', consumption_anomaly_score: 0.81, replenishment_status: 'overdue', replenishment_delay_days: 9 },
    reason_codes: ['SUPPLIER_OVERDUE_9D', 'INPATIENT_WARD_DRAIN'],
  },

  // FAC-009 (Eastern Valley Hub — isolated local spike on Ceftriaxone under SUP-DELTA-04)
  {
    facility_id: 'FAC-009', medicine_id: 'MED-008', medicine_name: 'Ceftriaxone 1g Powder',
    risk_level: 'amber', days_of_supply: 7, projected_stockout_date: 'Sep 20', confidence: 'low',
    confidence_note: 'Limited reporting data due to telecom maintenance',
    signals: { consumption_trend: 'rising', consumption_anomaly_score: 0.74, replenishment_status: 'on_time', replenishment_delay_days: 0 },
    reason_codes: ['UNEXPECTED_LOCAL_DIAGNOSTIC_SURGE', 'DATA_TELEMETRY_GAP'],
  },
];

// Deterministic green baseline for unlisted facility/medicine pairs
const greenDays = [32, 35, 41, 28, 47, 38, 44, 30, 52, 36, 33, 49, 40, 29, 45, 37, 42, 31, 34, 46, 39, 43, 48, 50, 55, 53, 54, 56, 57, 58, 59, 60, 61, 62, 63, 64];

function generateGreenScores(): RiskScore[] {
  const scores: RiskScore[] = [];
  let idx = 0;
  for (const fac of mockFacilities) {
    for (const med of mockMedicines) {
      const existing = explicitRiskScores.find(
        (r) => r.facility_id === fac.facility_id && r.medicine_id === med.medicine_id
      );
      if (existing) continue;
      const days = greenDays[idx % greenDays.length];
      idx++;
      scores.push({
        facility_id: fac.facility_id,
        medicine_id: med.medicine_id,
        medicine_name: med.name,
        risk_level: 'green',
        days_of_supply: days,
        projected_stockout_date: 'Nov 12',
        confidence: idx % 3 === 0 ? 'medium' : 'high',
        confidence_note: 'Consistent weekly stock replenishment cycles',
        signals: {
          consumption_trend: 'stable',
          consumption_anomaly_score: 0.15,
          replenishment_status: 'on_time',
          replenishment_delay_days: 0,
        },
        reason_codes: ['OPTIMAL_SUPPLY_LEVEL'],
      });
    }
  }
  return scores;
}

export const mockRiskScores: RiskScore[] = [...explicitRiskScores, ...generateGreenScores()];

export const mockAlerts: Alert[] = [
  {
    alert_id: 'ALT-SYS-01',
    scope: 'systemic',
    district: 'Central Metro & Coastal',
    supplier_id: 'SUP-ALPHA-01',
    medicine_id: 'MED-001',
    medicine_name: 'Amoxicillin 500mg Oral',
    affected_facilities: ['FAC-001', 'FAC-002', 'FAC-003', 'FAC-013', 'FAC-014'],
    pct_facilities_amber_or_red: 80,
    diagnosis: 'supplier_delay',
    summary:
      'Systemic regional risk: Supplier PharmaDirect Hub (SUP-ALPHA-01) is 8–10 days overdue on antibiotic shipments. 4 central facilities face stockout within 120 hours.',
  },
  {
    alert_id: 'ALT-LOC-02',
    scope: 'local',
    district: 'Eastern Valley',
    supplier_id: 'SUP-DELTA-04',
    medicine_id: 'MED-008',
    medicine_name: 'Ceftriaxone 1g Powder',
    affected_facilities: ['FAC-009'],
    pct_facilities_amber_or_red: 25,
    diagnosis: 'demand_spike',
    summary:
      'Localized consumption surge: Eastern Valley Hub experienced a +74% acute demand spike without supplier delinquency. High risk of localized exhaustion.',
  },
];

export const mockRecommendations: Recommendation[] = [
  {
    recommendation_id: 'REC-01',
    type: 'redistribution',
    medicine_id: 'MED-001',
    medicine_name: 'Amoxicillin 500mg',
    from_facility_id: 'FAC-005',
    to_facility_id: 'FAC-002',
    suggested_quantity: 450,
    travel_time_minutes: 42,
    priority_score: 96,
    priority_reason:
      'Avert impending 72-hour pediatric stockout by reallocating surplus stock from Highland General.',
  },
  {
    recommendation_id: 'REC-02',
    type: 'expedite',
    medicine_id: 'MED-001',
    medicine_name: 'Amoxicillin 500mg',
    to_facility_id: 'FAC-001',
    priority_score: 91,
    priority_reason:
      'Fast-track PO-8839 with PharmaDirect dispatch; waive standard ground consolidation.',
  },
  {
    recommendation_id: 'REC-03',
    type: 'redistribution',
    medicine_id: 'MED-001',
    medicine_name: 'Amoxicillin 500mg',
    from_facility_id: 'FAC-004',
    to_facility_id: 'FAC-003',
    suggested_quantity: 200,
    travel_time_minutes: 18,
    priority_score: 84,
    priority_reason:
      'Intra-district lateral transfer to protect high-density outpatient clinic.',
  },
  {
    recommendation_id: 'REC-04',
    type: 'escalate',
    medicine_id: 'MED-001',
    medicine_name: 'Amoxicillin (Regional Pool)',
    to_facility_id: 'FAC-013',
    priority_score: 79,
    priority_reason:
      'Notify Ministry of Health Central Medical Store for emergency buffer reserve release.',
  },
  {
    recommendation_id: 'REC-05',
    type: 'expedite',
    medicine_id: 'MED-008',
    medicine_name: 'Ceftriaxone 1g',
    to_facility_id: 'FAC-009',
    priority_score: 72,
    priority_reason:
      'Emergency order dispatch to accommodate acute regional respiratory surge.',
  },
];

// --- Helpers ---

export interface FacilitySummary {
  worstRisk: RiskLevel;
  atRiskCount: number;
  redCount: number;
  amberCount: number;
  totalMeds: number;
}

export function getFacilitySummary(facilityId: string): FacilitySummary {
  const scores = mockRiskScores.filter((s) => s.facility_id === facilityId);
  const redCount = scores.filter((s) => s.risk_level === 'red').length;
  const amberCount = scores.filter((s) => s.risk_level === 'amber').length;
  let worstRisk: RiskLevel = 'green';
  if (redCount > 0) worstRisk = 'red';
  else if (amberCount > 0) worstRisk = 'amber';
  return {
    worstRisk,
    atRiskCount: redCount + amberCount,
    redCount,
    amberCount,
    totalMeds: scores.length,
  };
}

export function getRiskScore(facilityId: string, medicineId: string): RiskScore | undefined {
  return mockRiskScores.find((s) => s.facility_id === facilityId && s.medicine_id === medicineId);
}

export function getFacility(facilityId: string): Facility | undefined {
  return mockFacilities.find((f) => f.facility_id === facilityId);
}

// Generate a plausible 30-day stock history array for a facility/medicine combo
export function generateStockHistory(score: RiskScore): StockHistoryPoint[] {
  const points: StockHistoryPoint[] = [];
  const days = score.days_of_supply;
  const risk = score.risk_level;
  const trend = score.signals.consumption_trend;

  // Starting stock level (20 days ago) — higher for healthy, lower for at-risk
  let startLevel: number;
  if (risk === 'red') startLevel = 45;
  else if (risk === 'amber') startLevel = 70;
  else startLevel = 100;

  // Current stock level
  const currentLevel = Math.max(0, Math.min(100, (days / 30) * 100));

  // Projected end level (day +10)
  let projectedEnd: number;
  if (risk === 'red') projectedEnd = 0;
  else if (risk === 'amber') projectedEnd = 5;
  else projectedEnd = 85;

  for (let i = -20; i <= 10; i++) {
    const isPast = i <= 0;
    const isFuture = i > 0;
    const progress = (i + 20) / 30; // 0..1
    let value: number | null;

    if (isPast) {
      // Historical: interpolate from startLevel to currentLevel
      const histProgress = (i + 20) / 20; // 0..1 over past 20 days
      // Add slight noise based on trend
      const noise = Math.sin(i * 1.7) * 3;
      value = startLevel + (currentLevel - startLevel) * histProgress + noise;
      // If rising consumption, steeper decline near end
      if (trend === 'rising' && i > -7) {
        value -= (i + 7) * 1.5;
      }
      value = Math.max(0, Math.min(100, value));
    } else if (isFuture) {
      // Projected: interpolate from currentLevel to projectedEnd
      const futProgress = i / 10; // 0..1 over future 10 days
      value = currentLevel + (projectedEnd - currentLevel) * futProgress;
      value = Math.max(0, Math.min(100, value));
    } else {
      // Today (i=0)
      value = currentLevel;
    }

    points.push({
      day: i,
      label: i === 0 ? 'Today' : `${i > 0 ? '+' : ''}${i}d`,
      actual: isPast || i === 0 ? Math.round(value * 10) / 10 : null,
      projected: i === 0 ? Math.round(value * 10) / 10 : isFuture ? Math.round(value * 10) / 10 : null,
    });
  }
  return points;
}
