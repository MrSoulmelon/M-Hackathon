import { Building2, AlertTriangle, Radio, GitPullRequest, Clock, Truck, ArrowRightLeft } from 'lucide-react';

interface MetricCardsProps {
  onRiskCardClick?: () => void;
}

export default function MetricCards({ onRiskCardClick }: MetricCardsProps) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="System Metrics">

      {/* Static — Monitored Facilities */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-500">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-500">Monitored Facilities</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 font-mono">18</span>
        <p className="text-[11px] text-slate-400 mt-1.5">Across 4 districts · 342k pop.</p>
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
          <span className="text-3xl font-bold text-amber-700 font-mono">5</span>
          <span className="text-xs font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">2 critical</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-amber-600">
          <Clock className="w-3 h-3" />
          <span>3 stockouts within 14 days</span>
        </div>
      </button>

      {/* Static — Systemic Alerts */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-rose-50 text-rose-500">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-medium text-slate-500">Active Alerts</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-800 font-mono">1</span>
          <span className="text-xs text-slate-400">+ 1 local anomaly</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-400">
          <Truck className="w-3 h-3" />
          <span>Supplier delay detected</span>
        </div>
      </div>

      {/* Static — Triage Directives */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-sky-50 text-sky-500">
            <GitPullRequest className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-500">AI Recommendations</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-800 font-mono">5</span>
          <span className="text-xs text-sky-600 font-medium bg-sky-50 px-1.5 py-0.5 rounded-full border border-sky-200">Actionable</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-400">
          <ArrowRightLeft className="w-3 h-3" />
          <span>2 redistributions ready</span>
        </div>
      </div>

    </section>
  );
}
