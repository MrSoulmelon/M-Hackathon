import type { Recommendation } from '../types';
import { useApi } from '../contexts/ApiContext';
import RecommendationCard from './RecommendationCard';

interface RecommendationsViewProps {
  onInspect: (facilityId: string, medicineId: string) => void;
  onApprove: (msg: string) => void;
}

export default function RecommendationsView({ onInspect, onApprove }: RecommendationsViewProps) {
  const { recommendations } = useApi();
  const sorted = [...recommendations].sort((a, b) => b.priority_score - a.priority_score).slice(0, 5);

  return (
    <div className="space-y-3">
      {sorted.map((rec: Recommendation) => (
        <RecommendationCard key={rec.recommendation_id} rec={rec} onInspect={onInspect} onApprove={onApprove} />
      ))}

      {/* AI info blurb */}
      <div className="rounded-xl bg-slate-800 p-4 text-xs text-slate-500 leading-relaxed">
        <span className="text-white font-semibold block mb-1">How are these ranked?</span>
        Recommendations are prioritised by stockout urgency, travel time, and available buffer stock — sorted highest risk first.
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700 text-[11px]">
          <span>Latency: <span className="font-mono text-slate-200">18ms</span></span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 99.4% uptime
          </span>
        </div>
      </div>
    </div>
  );
}
