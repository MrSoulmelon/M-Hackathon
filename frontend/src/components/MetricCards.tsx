import { Building2, AlertTriangle, Radio, GitPullRequest, Clock, Truck, ArrowRightLeft } from 'lucide-react';
import { useApi } from '../contexts/ApiContext';

interface MetricCardsProps {
  onRiskCardClick?: () => void;
}

export default function MetricCards({ onRiskCardClick }: MetricCardsProps) {
  const { facilities, alerts, recommendations, getFacilitySummary } = useApi();

  const totalFacilities = facilities.length;
  
  // Calculate distinct districts
  const districts = new Set(facilities.map(f => f.district)).size;
  // Calculate total catchment population
  const totalPop = facilities.reduce((sum, f) => sum + (f.catchment_population || 0), 0);
  const popStr = totalPop > 1000 ? `${Math.round(totalPop / 1000)}k` : totalPop;

  let atRiskCount = 0;
  let criticalCount = 0;
  
  facilities.forEach(f => {
    const sum = getFacilitySummary(f.facility_id);
    if (sum.worstRisk === 'amber' || sum.worstRisk === 'red') atRiskCount++;
    if (sum.worstRisk === 'red') criticalCount++;
  });

  const totalAlerts = alerts.length;
  const localAnomalies = alerts.filter(a => a.scope === 'local').length;
  
  const totalRecommendations = recommendations.length;
  const redistributions = recommendations.filter(r => r.type === 'redistribution').length;

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="System Metrics">

      {/* Monitored Facilities */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-500">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-500">Monitored Facilities</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 font-mono">{totalFacilities}</span>
        <p className="text-[11px] text-slate-400 mt-1.5">Across {districts} districts · {popStr} pop.</p>
      </div>

      {/* Clickable — Facilities At Risk */}
      <button
        onClick={onRiskCardClick}
        className="bg-white rounded-xl p-4 border-2 border-amber-300 text-left hover:border-amber-400 hover:shadow-md transition-all group"
        title="Click to view at-risk facilities"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-amber-800">Facilities At Risk</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-amber-700 font-mono">{atRiskCount}</span>
          <span className="text-xs font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">{criticalCount} critical</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-amber-600">
          <Clock className="w-3 h-3" />
          <span>Real-time tracking active</span>
        </div>
      </button>

      {/* Systemic Alerts */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-rose-50 text-rose-500">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-medium text-slate-500">Active Alerts</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-800 font-mono">{totalAlerts}</span>
          {localAnomalies > 0 && <span className="text-xs text-slate-400">+ {localAnomalies} local anomaly</span>}
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-400">
          <Truck className="w-3 h-3" />
          <span>Monitoring supply chain</span>
        </div>
      </div>

      {/* Triage Directives */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-sky-50 text-sky-500">
            <GitPullRequest className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-500">AI Recommendations</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-800 font-mono">{totalRecommendations}</span>
          <span className="text-xs text-sky-600 font-medium bg-sky-50 px-1.5 py-0.5 rounded-full border border-sky-200">Actionable</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-400">
          <ArrowRightLeft className="w-3 h-3" />
          <span>{redistributions} redistributions ready</span>
        </div>
      </div>

    </section>
  );
}
