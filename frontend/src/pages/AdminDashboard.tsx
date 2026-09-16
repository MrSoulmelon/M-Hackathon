import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { SearchX } from 'lucide-react';
import Header from '../components/Header';
import MetricCards from '../components/MetricCards';
import AlertBanner from '../components/AlertBanner';
import FacilityCard from '../components/FacilityCard';
import RecommendationsView from '../components/RecommendationsView';
import FacilityInspector from '../components/FacilityInspector';
import Toast from '../components/Toast';
import { useApi } from '../contexts/ApiContext';
import type { Facility, Alert } from '../types';

export function AdminDashboard() {
  const { facilities, medicines, alerts, riskScores, getFacilitySummary, loading } = useApi();
  const { user, logout } = useAuth();
  
  // Filters
  const [district, setDistrict] = useState('ALL');
  const [criticality, setCriticality] = useState('ALL');
  const [risk, setRisk] = useState('ALL');
  
  // UI State
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedMedicineId, setSelectedMedicineId] = useState('MED-01');
  const [highlightedFacilities, setHighlightedFacilities] = useState<string[]>([]);
  const [toast, setToast] = useState({ title: '', body: '' });
  const [toastVisible, setToastVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const showToast = useCallback((title: string, body: string) => {
    setToast({ title, body });
    setToastVisible(true);
    window.setTimeout(() => setToastVisible(false), 3500);
  }, []);

  const openFacility = useCallback((facilityId: string, medicineId?: string) => {
    const fac = facilities.find((f) => f.facility_id === facilityId);
    if (!fac) return;
    setSelectedFacility(fac);
    if (medicineId) {
      setSelectedMedicineId(medicineId);
    } else {
      const scores = riskScores.filter((s) => s.facility_id === facilityId);
      const worst = scores.find((s) => s.risk_level === 'red') || scores.find((s) => s.risk_level === 'amber') || scores[0];
      setSelectedMedicineId(worst ? worst.medicine_id : medicines[0]?.medicine_id || 'MED-01');
    }
  }, [facilities, riskScores, medicines]);

  const handleAlertDetails = useCallback((alert: Alert) => {
    setHighlightedFacilities(alert.affected_facilities);
    openFacility(alert.affected_facilities[0], alert.medicine_id);
  }, [openFacility]);

  const handleSync = useCallback(() => {
    setSyncing(true);
    window.setTimeout(() => {
      setSyncing(false);
      showToast('Telemetry Synchronized', '18 facilities up to date.');
    }, 800);
  }, [showToast]);

  const handleApprove = useCallback((msg: string) => {
    showToast('Action Approved', msg);
  }, [showToast]);

  const handleDispatch = useCallback(() => {
    showToast('Triage Directive Dispatched', 'Emergency re-allocation order sent to regional supply coordinator.');
  }, [showToast]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((fac) => {
      if (district !== 'ALL' && fac.district !== district) return false;

      const summary = getFacilitySummary(fac.facility_id);
      if (risk === 'critical' && summary.worstRisk !== 'red') return false;
      if (risk === 'amber' && summary.worstRisk !== 'amber' && summary.worstRisk !== 'red') return false;
      if (risk === 'healthy' && summary.worstRisk !== 'green') return false;

      if (criticality !== 'ALL') {
        const categoryMedIds = medicines.filter((m) => m.category === criticality).map((m) => m.medicine_id);
        const hasMatchingScore = riskScores.some(
          (s) => s.facility_id === fac.facility_id && categoryMedIds.includes(s.medicine_id)
        );
        if (!hasMatchingScore) return false;
      }

      return true;
    });
  }, [district, criticality, risk, facilities, medicines, riskScores, getFacilitySummary]);

  const resetFilters = () => {
    setDistrict('ALL');
    setCriticality('ALL');
    setRisk('ALL');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 flex-col gap-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading AI Models & Inventory Data...</p>
      </div>
    );
  }

  // Cap alerts for dashboard cleanliness
  const topAlerts = alerts.slice(0, 3);
  const hiddenAlertsCount = alerts.length - topAlerts.length;

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-hidden bg-medical-theme text-slate-900">
      
      {/* Background Orbs (More visible) */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col flex-1">
        <Header
          district={district}
          setDistrict={setDistrict}
          criticality={criticality}
          setCriticality={setCriticality}
          risk={risk}
          setRisk={setRisk}
          onSync={handleSync}
          syncing={syncing}
        />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* User info row */}
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>Signed in as <span className="font-semibold text-slate-600">{user?.email}</span></span>
          <button onClick={logout} className="text-slate-400 hover:text-slate-700 underline transition">Sign out</button>
        </div>

        {/* Summary stats */}
        <MetricCards onRiskCardClick={() => {
          setRisk('amber');
          setTimeout(() => {
            document.getElementById('facility-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }} />

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start" id="facility-section">

          {/* Left Column: Facility list */}
          <div className="xl:col-span-7 2xl:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Facilities
                <span className="ml-2 font-mono bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                  {filteredFacilities.length}
                </span>
              </h2>
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Healthy</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />At-Risk</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />Critical</span>
              </div>
            </div>

            {filteredFacilities.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
                <SearchX className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm font-medium text-slate-700">No facilities match these filters</h3>
                <p className="text-xs text-slate-400 mt-1">Adjust the filters in the header to see results.</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFacilities.map((fac) => (
                  <FacilityCard
                    key={fac.facility_id}
                    facility={fac}
                    onClick={() => openFacility(fac.facility_id)}
                    highlighted={highlightedFacilities.includes(fac.facility_id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Action Center (Alerts + Recommendations) */}
          <div className="xl:col-span-5 2xl:col-span-4 space-y-8">
            
            {/* Active Alerts */}
            {alerts.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  <span>Priority Alerts</span>
                  <span className="text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">{alerts.length} Active</span>
                </h2>
                
                <div className="space-y-3">
                  {topAlerts.map((alert) => (
                    <AlertBanner key={alert.alert_id} alert={alert} onViewDetails={handleAlertDetails} />
                  ))}
                  
                  {hiddenAlertsCount > 0 && (
                    <div className="w-full py-2 text-center border border-dashed border-slate-300 rounded-xl bg-white shadow-sm text-xs font-medium text-slate-500">
                      +{hiddenAlertsCount} lower-priority alerts hidden
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Recommendations */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                AI Triage Actions
              </h2>
              <RecommendationsView onInspect={openFacility} onApprove={handleApprove} />
            </section>

          </div>
        </div>
      </main>

      {selectedFacility && (
        <FacilityInspector
          facility={selectedFacility}
          initialMedicineId={selectedMedicineId}
          onClose={() => {
            setSelectedFacility(null);
            setHighlightedFacilities([]);
          }}
          onDispatch={handleDispatch}
        />
      )}

      <Toast title={toast.title} body={toast.body} visible={toastVisible} />
      </div>
    </div>
  );
}

// export default App;
