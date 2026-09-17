import { Check, AlertTriangle, AlertOctagon, ChevronRight } from 'lucide-react';
import type { Facility, RiskScore } from '../types';
import { useApi } from '../contexts/ApiContext';

interface FacilityCardProps {
  facility: Facility;
  onClick: () => void;
  highlighted: boolean;
}

export default function FacilityCard({ facility, onClick, highlighted = false }: FacilityCardProps) {
  const { getFacilitySummary, riskScores, medicines } = useApi();
  const summary = getFacilitySummary(facility.facility_id);

  let borderClass = 'border-l-4 border-l-sky-500 hover:border-sky-600';
  let badgeClass = 'bg-sky-950 text-sky-400 border-sky-800';
  let badgeText = 'Stable';
  let StatusIcon = Check;

  if (summary.worstRisk === 'red') {
    borderClass = 'border-l-4 border-l-fuchsia-500 hover:border-fuchsia-600 ring-1 ring-fuchsia-200/50';
    badgeClass = 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-800 font-semibold';
    badgeText = `${summary.atRiskCount} at risk`;
    StatusIcon = AlertOctagon;
  } else if (summary.worstRisk === 'amber') {
    borderClass = 'border-l-4 border-l-violet-500 hover:border-violet-600';
    badgeClass = 'bg-violet-950 text-violet-400 border-violet-800 font-medium';
    badgeText = `${summary.atRiskCount} at risk`;
    StatusIcon = AlertTriangle;
  }

  const riskItem: RiskScore | undefined = riskScores.find(
    (s) => s.facility_id === facility.facility_id && (s.risk_level === 'red' || s.risk_level === 'amber')
  );

  const highlightRing = highlighted ? 'ring-2 ring-blue-500 shadow-md' : 'shadow-sm';

  return (
    <div
      onClick={onClick}
      className={`group bg-slate-900 rounded-2xl p-4 border border-slate-800 hover:shadow-md transition-all cursor-pointer ${borderClass} ${highlightRing}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{facility.type}</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-white/70 font-semibold">{facility.district}</span>
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors">{facility.name}</h3>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${badgeClass}`}>
          <StatusIcon className="w-3 h-3" />
          {badgeText}
        </span>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
        <div className="overflow-hidden mr-2">
          {riskItem ? (
            <span className="text-[11px] text-slate-500 truncate block">
              Critical: <strong className={riskItem.risk_level === 'red' ? 'text-fuchsia-400' : 'text-violet-400'}>{(medicines.find(m => m.medicine_id === riskItem.medicine_id)?.name || riskItem.medicine_name || 'Unknown').split(' ')[0]}</strong> ({riskItem.days_of_supply}d supply left)
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 block">All 8 monitored medicines stable</span>
          )}
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-800 bg-slate-950 group-hover:bg-slate-900 group-hover:border-sky-800 group-hover:text-sky-400 text-slate-500 text-[11px] font-medium shrink-0 transition-colors">
          <span>Inspect</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
