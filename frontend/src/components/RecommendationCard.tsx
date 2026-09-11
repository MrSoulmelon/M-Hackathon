import { ArrowRightLeft, Clock, Flag, ArrowRight, Navigation } from 'lucide-react';
import type { Recommendation } from '../types';
import { useApi } from '../contexts/ApiContext';

interface RecommendationCardProps {
  rec: Recommendation;
  onInspect: (facilityId: string, medicineId: string) => void;
  onApprove: (msg: string) => void;
}

export default function RecommendationCard({ rec, onInspect, onApprove }: RecommendationCardProps) {
  const { getFacility } = useApi();
  let TagIcon = ArrowRightLeft;
  let tagClass = 'bg-sky-50 text-sky-700 border-sky-200';
  let tagLabel = 'Redistribute';

  if (rec.type === 'expedite') {
    TagIcon = Clock;
    tagClass = 'bg-amber-50 text-amber-700 border-amber-200';
    tagLabel = 'Expedite Order';
  } else if (rec.type === 'escalate') {
    TagIcon = Flag;
    tagClass = 'bg-rose-50 text-rose-700 border-rose-200';
    tagLabel = 'Escalate to Ministry';
  }

  const fromFac = rec.from_facility_id ? getFacility(rec.from_facility_id)?.name.split(' ')[0] ?? 'Hub' : '';
  const toFac = getFacility(rec.to_facility_id)?.name.split(' ')[0] ?? 'Target';

  return (
    <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:border-slate-300 transition group">
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tagClass}`}>
          <TagIcon className="w-3 h-3" />
          {tagLabel}
        </span>

        <div className="flex items-center gap-1.5" title={`Priority ranking score: ${rec.priority_score}/100`}>
          <span className="text-[11px] font-mono font-semibold text-slate-700">P-{rec.priority_score}</span>
          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${rec.priority_score > 90 ? 'bg-rose-500' : 'bg-sky-500'}`}
              style={{ width: `${rec.priority_score}%` }}
            />
          </div>
        </div>
      </div>

      <h4 className="text-xs font-semibold text-slate-900 mt-2">{rec.medicine_name}</h4>
      <p className="text-xs text-slate-600 mt-1 leading-snug">{rec.priority_reason}</p>

      {rec.type === 'redistribution' && (
        <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-1 text-slate-700">
            <span className="font-semibold text-slate-900">{rec.suggested_quantity} units</span>
            <span className="text-slate-400">•</span>
            <span>{fromFac} → {toFac}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
            <Navigation className="w-2.5 h-2.5 text-sky-600" /> {rec.travel_time_minutes}m drive
          </span>
        </div>
      )}

      <div className="mt-2.5 pt-2 flex items-center justify-between border-t border-slate-100">
        <button
          onClick={() => onInspect(rec.to_facility_id, rec.medicine_id)}
          className="text-[11px] text-slate-500 hover:text-slate-800 font-medium transition"
        >
          Inspect Target
        </button>
        <button
          onClick={() => onApprove(`${tagLabel}: ${rec.medicine_name}`)}
          className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
        >
          Approve Action <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
