import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { mockFacilities, mockMedicines, mockRiskScores, mockAlerts, mockRecommendations, generateStockHistory } from '../data/mockData';
import type { Facility, Medicine, RiskScore, Alert, Recommendation, StockHistoryPoint, RiskLevel } from '../types';

interface FacilitySummary {
  worstRisk: RiskLevel;
  atRiskCount: number;
  redCount: number;
  amberCount: number;
  totalMeds: number;
}

interface ApiContextType {
  facilities: Facility[];
  medicines: Medicine[];
  riskScores: RiskScore[];
  alerts: Alert[];
  recommendations: Recommendation[];
  loading: boolean;
  error: Error | null;
  getFacilitySummary: (facilityId: string) => FacilitySummary;
  getFacility: (facilityId: string) => Facility | undefined;
  getRiskScore: (facilityId: string, medicineId: string) => RiskScore | undefined;
  getChartData: (facilityId: string, medicineId: string, currentScore: RiskScore) => Promise<StockHistoryPoint[]>;
  approveRecommendation: (rec: Recommendation) => Promise<void>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const [facRes, medRes, riskRes, alertRes, recRes] = await Promise.allSettled([
          fetch('http://localhost:8000/facilities').then(r => r.ok ? r.json() : Promise.reject(r)),
          fetch('http://localhost:8000/supplies').then(r => r.ok ? r.json() : Promise.reject(r)),
          fetch('http://localhost:8001/risk-scores').then(r => r.ok ? r.json() : Promise.reject(r)),
          fetch('http://localhost:8001/alerts').then(r => r.ok ? r.json() : Promise.reject(r)),
          fetch('http://localhost:8001/recommendations').then(r => r.ok ? r.json() : Promise.reject(r))
        ]);

        if (!isMounted) return;

        setFacilities(facRes.status === 'fulfilled' ? facRes.value : mockFacilities);
        setMedicines(medRes.status === 'fulfilled' ? medRes.value : mockMedicines);
        setRiskScores(riskRes.status === 'fulfilled' ? riskRes.value : mockRiskScores);
        setAlerts(alertRes.status === 'fulfilled' ? alertRes.value : mockAlerts);
        setRecommendations(recRes.status === 'fulfilled' ? recRes.value : mockRecommendations);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch some data, using full fallback", err);
        setFacilities(mockFacilities);
        setMedicines(mockMedicines);
        setRiskScores(mockRiskScores);
        setAlerts(mockAlerts);
        setRecommendations(mockRecommendations);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const getFacilitySummary = useMemo(() => {
    return (facilityId: string): FacilitySummary => {
      const scores = riskScores.filter((s) => s.facility_id === facilityId);
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
    };
  }, [riskScores]);

  const getFacility = useMemo(() => {
    return (facilityId: string) => facilities.find((f) => f.facility_id === facilityId);
  }, [facilities]);

  const getRiskScore = useMemo(() => {
    return (facilityId: string, medicineId: string) => 
      riskScores.find((s) => s.facility_id === facilityId && s.medicine_id === medicineId);
  }, [riskScores]);

  const getChartData = async (facilityId: string, medicineId: string, currentScore: RiskScore): Promise<StockHistoryPoint[]> => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 20);
    const to = new Date(today);
    to.setDate(today.getDate() + 10);
    
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    try {
      const [invRes, conRes] = await Promise.allSettled([
        fetch(`http://localhost:8000/inventory?facility_id=${facilityId}&medicine_id=${medicineId}&from=${fromStr}&to=${toStr}`).then(r => r.ok ? r.json() : Promise.reject(r)),
        fetch(`http://localhost:8000/consumption?facility_id=${facilityId}&medicine_id=${medicineId}&from=${fromStr}&to=${toStr}`).then(r => r.ok ? r.json() : Promise.reject(r))
      ]);
      
      if (invRes.status === 'fulfilled' && conRes.status === 'fulfilled') {
         const data = invRes.value; 
         if (Array.isArray(data) && data.length > 0 && 'day' in data[0]) {
             return data as StockHistoryPoint[];
         }
         return generateStockHistory(currentScore);
      } else {
         throw new Error("Chart fetch failed");
      }
    } catch (err) {
      return generateStockHistory(currentScore);
    }
  };

  const approveRecommendation = async (rec: Recommendation): Promise<void> => {
    // 1. Optimistically remove the card from UI immediately
    setRecommendations(prev => prev.filter(r => r.recommendation_id !== rec.recommendation_id));

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const body = {
        recommendation_id: rec.recommendation_id,
        action_type: rec.type,
        medicine_name: rec.medicine_name,
        medicine_id: rec.medicine_id,
        from_facility_id: rec.from_facility_id ?? null,
        to_facility_id: rec.to_facility_id,
        suggested_quantity: rec.suggested_quantity ?? null,
        note: 'Approved via dashboard',
      };

      // 2. Tell detection engine (port 8001) — this updates in-memory inventory
      //    and recomputes risk scores so the facility card changes immediately
      await fetch('http://localhost:8001/recommendations/approve', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      // 3. Also tell backend (port 8000) to persist to DB so it survives restart
      await fetch('http://localhost:8000/recommendations/approve', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      // 4. Fetch updated risk scores and recommendations from detection engine
      //    so the facility cards immediately reflect the new stock levels
      const [newRiskRes, newRecRes] = await Promise.allSettled([
        fetch('http://localhost:8001/risk-scores').then(r => r.ok ? r.json() : Promise.reject(r)),
        fetch('http://localhost:8001/recommendations').then(r => r.ok ? r.json() : Promise.reject(r)),
      ]);

      if (newRiskRes.status === 'fulfilled') {
        setRiskScores(newRiskRes.value);
      }
      if (newRecRes.status === 'fulfilled') {
        // The engine already removed the approved rec and regenerated the rest
        setRecommendations(newRecRes.value);
      }

    } catch (err) {
      // Backends may be offline — UI removal still stands
      console.warn('Could not fully process approval:', err);
    }
  };

  return (
    <ApiContext.Provider value={{
      facilities, medicines, riskScores, alerts, recommendations, loading, error,
      getFacilitySummary, getFacility, getRiskScore, getChartData, approveRecommendation
    }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
