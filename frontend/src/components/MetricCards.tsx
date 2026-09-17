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
          <span className="text-xs font-semibold text-white">Monitored Facilities</span>
        </div>
        <span className="text-3xl font-bold text-white font-mono">{totalFacilities}</span>
        <p className="text-[11px] text-white/70 font-medium mt-1.5">Across {districts} districts · {popStr} pop.</p>
      </div>

      {/* Clickable — Facilities At Risk */}
      <button
        onClick={onRiskCardClick}
        className="bg-slate-900 rounded-xl p-4 border-2 border-violet-900/50 text-left hover:border-violet-600 hover:shadow-md transition-all group"
        title="Click to view at-risk facilities"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-violet-950 text-violet-500 group-hover:bg-violet-600 group-hover:text-white transition-colors">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white">Facilities At Risk</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white font-mono">{atRiskCount}</span>
          <span className="text-xs font-medium text-fuchsia-400 bg-fuchsia-950 px-1.5 py-0.5 rounded-full border border-fuchsia-800">{criticalCount} critical</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-white/70 font-medium">
          <Clock className="w-3 h-3 text-violet-500" />
          <span>Real-time tracking active</span>
        </div>
      </button>

      {/* Systemic Alerts */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-fuchsia-950 text-fuchsia-500">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-semibold text-white">Active Alerts</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white font-mono">{totalAlerts}</span>
          {localAnomalies > 0 && <span className="text-xs text-white/70 font-medium">+ {localAnomalies} local anomaly</span>}
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-white/70 font-medium">
          <Truck className="w-3 h-3 text-fuchsia-500" />
          <span>Monitoring supply chain</span>
        </div>
      </div>

      {/* Triage Directives */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-slate-900 text-sky-500">
            <GitPullRequest className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white">AI Recommendations</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white font-mono">{totalRecommendations}</span>
          <span className="text-xs text-sky-400 font-medium bg-slate-900 px-1.5 py-0.5 rounded-full border border-sky-800">Actionable</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-white/70 font-medium">
          <ArrowRightLeft className="w-3 h-3 text-sky-500" />
          <span>{redistributions} redistributions ready</span>
        </div>
      </div>

    </section>
  );
}
