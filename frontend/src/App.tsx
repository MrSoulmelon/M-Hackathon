import { useState, useMemo, useCallback } from 'react';
import { SearchX, ArrowRightLeft } from 'lucide-react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import AlertBanner from './components/AlertBanner';
import FacilityCard from './components/FacilityCard';
import RecommendationsView from './components/RecommendationsView';
import FacilityInspector from './components/FacilityInspector';
import Toast from './components/Toast';
import { useApi } from './contexts/ApiContext';
import type { Facility, Alert } from './types';

type View = 'dashboard' | 'recommendations';

function App() {
  const { facilities, medicines, alerts, riskScores, getFacilitySummary, loading, error } = useApi();
  const [view, setView] = useState<View>('dashboard');
  const [district, setDistrict] = useState('ALL');
  const [criticality, setCriticality] = useState('ALL');
  const [risk, setRisk] = useState('ALL');
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
      if (risk === 'amber' && summary.worstRisk !== 'amber') return false;
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
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading telemetry and risk data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col antialiased text-slate-800">
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <MetricCards />

        {/* View Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setView('dashboard')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
              view === 'dashboard'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView('recommendations')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              view === 'recommendations'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Recommendations
          </button>
        </div>

        {view === 'dashboard' ? (
          <>
            {/* Alert Banners */}
            <section className="space-y-3" aria-label="Systemic Early Warnings">
              {alerts.map((alert) => (
                <AlertBanner key={alert.alert_id} alert={alert} onViewDetails={handleAlertDetails} />
              ))}
            </section>

            {/* Dashboard Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Facility Grid */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Facility Network Status</h2>
                    <span className="text-xs bg-slate-200 text-slate-700 font-mono font-medium px-2 py-0.5 rounded-full">
                      {filteredFacilities.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> At-Risk
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical
                    </span>
                  </div>
                </div>

                {filteredFacilities.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                    <SearchX className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <h3 className="text-sm font-medium text-slate-800">No facilities match current filter criteria</h3>
                    <p className="text-xs text-slate-500 mt-1">Try resetting the district or criticality filters in the top toolbar.</p>
                    <button onClick={resetFilters} className="mt-3 text-xs text-sky-600 font-medium hover:underline">
                      Reset all filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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

              {/* Right: Triage Panel */}
              <div className="lg:col-span-4">
                <RecommendationsView onInspect={openFacility} onApprove={handleApprove} />
              </div>
            </div>
          </>
        ) : (
          /* Recommendations View */
          <div className="max-w-3xl mx-auto">
            <RecommendationsView onInspect={openFacility} onApprove={handleApprove} />
          </div>
        )}
      </main>

      {/* Facility Detail Inspector */}
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

      {/* Toast */}
      <Toast title={toast.title} body={toast.body} visible={toastVisible} />
    </div>
  );
}

export default App;
