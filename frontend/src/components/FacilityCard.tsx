import { Check, AlertTriangle, AlertOctagon, ChevronRight } from 'lucide-react';
import type { Facility, RiskScore } from '../types';
import { useApi } from '../contexts/ApiContext';

interface FacilityCardProps {
  facility: Facility;
  onClick: () => void;
  highlighted: boolean;
}

export default function FacilityCard({ facility, onClick, highlighted }: FacilityCardProps) {
  const { getFacilitySummary, riskScores, medicines } = useApi();
  const summary = getFacilitySummary(facility.facility_id);

  let borderClass = 'border-l-4 border-l-emerald-500 hover:border-emerald-600';
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let badgeText = 'Stable';
  let StatusIcon = Check;

  if (summary.worstRisk === 'red') {
    borderClass = 'border-l-4 border-l-rose-500 hover:border-rose-600 ring-1 ring-rose-200/50';
    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
    badgeText = `${summary.atRiskCount} at risk`;
    StatusIcon = AlertOctagon;
  } else if (summary.worstRisk === 'amber') {
    borderClass = 'border-l-4 border-l-amber-500 hover:border-amber-600';
    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
    badgeText = `${summary.atRiskCount} at risk`;
    StatusIcon = AlertTriangle;
  }

  const riskItem: RiskScore | undefined = riskScores.find(
    (s) => s.facility_id === facility.facility_id && (s.risk_level === 'red' || s.risk_level === 'amber')
  );

  const highlightRing = highlighted ? 'ring-2 ring-sky-400 ring-offset-1' : '';

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer ${borderClass} ${highlightRing}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{facility.type}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">{facility.district}</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{facility.name}</h3>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${badgeClass}`}>
          <StatusIcon className="w-3 h-3" />
          {badgeText}
        </span>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div className="overflow-hidden mr-2">
          {riskItem ? (
            <span className="text-[11px] text-slate-500 truncate block">
              Critical: <strong className={riskItem.risk_level === 'red' ? 'text-rose-600' : 'text-amber-600'}>{(medicines.find(m => m.medicine_id === riskItem.medicine_id)?.name || riskItem.medicine_name || 'Unknown').split(' ')[0]}</strong> ({riskItem.days_of_supply}d supply left)
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 block">All 8 monitored medicines stable</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-400 group-hover:text-sky-600 text-xs font-medium shrink-0 transition-colors">
          <span>Inspect</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
