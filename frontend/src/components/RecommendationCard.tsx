import { useState } from 'react';
import { ArrowRightLeft, Clock, Flag, ArrowRight, Navigation, Check, Loader2 } from 'lucide-react';
import type { Recommendation } from '../types';
import { useApi } from '../contexts/ApiContext';

interface RecommendationCardProps {
  rec: Recommendation;
  onInspect: (facilityId: string, medicineId: string) => void;
  onApprove: (msg: string) => void; // kept for toast notification
}

export default function RecommendationCard({ rec, onInspect, onApprove }: RecommendationCardProps) {
  const { getFacility, approveRecommendation } = useApi();
  const [loading, setLoading] = useState(false);

  let tagBg = 'bg-slate-900 text-sky-400';
  let tagLabel = 'Redistribute';
  let TagIcon = ArrowRightLeft;

  if (rec.type === 'expedite') {
    TagIcon = Clock;
    tagBg = 'bg-amber-950 text-amber-700';
    tagLabel = 'Expedite Order';
  } else if (rec.type === 'escalate') {
    TagIcon = Flag;
    tagBg = 'bg-rose-950 text-rose-300';
    tagLabel = 'Escalate';
  }

  const fromFac = rec.from_facility_id ? getFacility(rec.from_facility_id)?.name.split(' ')[0] ?? 'Hub' : '';
  const toFac = getFacility(rec.to_facility_id)?.name.split(' ')[0] ?? 'Target';

  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    await approveRecommendation(rec); // removes card + calls backend
    onApprove(`${tagLabel}: ${rec.medicine_name}`); // triggers toast
    // no need to setLoading(false) — card unmounts after approve
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      {/* Header bar (Criticality / Urgency) */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${tagBg}`}>
          <TagIcon className="w-3 h-3" />
          {tagLabel}
        </span>
        {/* Urgency bar */}
        <div
          className="flex items-center gap-1.5 cursor-help"
          title={`Urgency score: ${rec.priority_score}/100. Higher = closer to stockout.`}
        >
          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${rec.priority_score > 90 ? 'bg-rose-500' : 'bg-sky-400'}`}
              style={{ width: `${rec.priority_score}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-500">{rec.priority_score}</span>
        </div>
      </div>

      {/* Medicine + reason */}
      <p className="text-sm font-semibold text-white">{rec.medicine_name}</p>
      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{rec.priority_reason}</p>

      {/* Transfer details */}
      {rec.type === 'redistribution' && (
        <div className="mt-3 flex items-center justify-between px-3 py-2 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <span className="font-medium text-slate-200">
            {rec.suggested_quantity} units · {fromFac} → {toFac}
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <Navigation className="w-3 h-3" />
            {rec.travel_time_minutes}m
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 pt-3 flex items-center justify-between border-t border-slate-800">
        <button
          onClick={(e) => { e.stopPropagation(); onInspect(rec.to_facility_id, rec.medicine_id); }}
          className="text-xs font-medium text-slate-500 hover:text-slate-200 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition"
        >
          View Facility
        </button>

        <button
          onClick={handleApprove}
          disabled={loading}
          className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-60 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
        >
          {loading ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Approving…</>
          ) : (
            <><Check className="w-3 h-3" /> Approve</>
          )}
        </button>
      </div>
    </div>
  );
}
