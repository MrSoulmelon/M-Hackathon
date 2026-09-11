import { Building2, AlertTriangle, Radio, GitPullRequest, Clock, Truck, ArrowRightLeft } from 'lucide-react';

export default function MetricCards() {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="System Metrics">
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Monitored Facilities</span>
          <div className="p-1.5 rounded-md bg-slate-50 text-slate-600">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">18</span>
          <span className="text-xs text-slate-500">across 4 districts</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px]">342,000 catchment pop. covered</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/20 shadow-sm hover:border-amber-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Facilities At Risk</span>
          <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-700 font-mono">5</span>
          <span className="text-xs font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">2 Critical</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-700">
          <Clock className="w-3 h-3 text-amber-500" />
          <span className="text-[11px] font-medium">3 impending stockouts &lt; 14 days</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-rose-200/80 bg-gradient-to-br from-white to-rose-50/20 shadow-sm hover:border-rose-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Systemic Alerts</span>
          <div className="p-1.5 rounded-md bg-rose-50 text-rose-600">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-rose-700 font-mono">1</span>
          <span className="text-xs font-medium text-slate-500">+1 Local Anomaly</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-700">
          <Truck className="w-3 h-3 text-rose-500" />
          <span className="text-[11px] font-medium">PharmaDirect Hub delay detected</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Triage Directives</span>
          <div className="p-1.5 rounded-md bg-sky-50 text-sky-600">
            <GitPullRequest className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">5</span>
          <span className="text-xs text-sky-700 font-medium bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">Actionable</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
          <ArrowRightLeft className="w-3 h-3 text-sky-500" />
          <span className="text-[11px]">2 mutual redistributions ready</span>
        </div>
      </div>
    </section>
  );
}
