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
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-slate-800 text-slate-500">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-500">Monitored Facilities</span>
        </div>
        <span className="text-3xl font-bold text-slate-200 font-mono">{totalFacilities}</span>
        <p className="text-[11px] text-slate-500 mt-1.5">Across {districts} districts · {popStr} pop.</p>
      </div>

      {/* Clickable — Facilities At Risk */}
      <button
        onClick={onRiskCardClick}
        className="bg-slate-900 rounded-xl p-4 border-2 border-amber-900/50 text-left hover:border-amber-600 hover:shadow-md transition-all group"
        title="Click to view at-risk facilities"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-amber-950 text-amber-500 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-amber-400">Facilities At Risk</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-amber-400 font-mono">{atRiskCount}</span>
          <span className="text-xs font-medium text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded-full border border-rose-800">{criticalCount} critical</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-amber-500">
          <Clock className="w-3 h-3" />
          <span>Real-time tracking active</span>
        </div>
      </button>

      {/* Systemic Alerts */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-rose-950 text-rose-500">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-medium text-slate-500">Active Alerts</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-200 font-mono">{totalAlerts}</span>
          {localAnomalies > 0 && <span className="text-xs text-slate-500">+ {localAnomalies} local anomaly</span>}
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-500">
          <Truck className="w-3 h-3" />
          <span>Monitoring supply chain</span>
        </div>
      </div>

      {/* Triage Directives */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-slate-900 text-sky-500">
            <GitPullRequest className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-500">AI Recommendations</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-200 font-mono">{totalRecommendations}</span>
          <span className="text-xs text-sky-400 font-medium bg-slate-900 px-1.5 py-0.5 rounded-full border border-sky-800">Actionable</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-500">
          <ArrowRightLeft className="w-3 h-3" />
          <span>{redistributions} redistributions ready</span>
        </div>
      </div>

    </section>
  );
}
