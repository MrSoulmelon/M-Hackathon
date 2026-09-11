import { ArrowRightLeft, Cpu } from 'lucide-react';
import type { Recommendation } from '../types';
import { useApi } from '../contexts/ApiContext';
import RecommendationCard from './RecommendationCard';

interface RecommendationsViewProps {
  onInspect: (facilityId: string, medicineId: string) => void;
  onApprove: (msg: string) => void;
}

export default function RecommendationsView({ onInspect, onApprove }: RecommendationsViewProps) {
  const { recommendations } = useApi();
  const sorted = [...recommendations].sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Automated Triage Plan</h2>
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">Ranked</span>
        </div>
        <span className="text-xs text-slate-400">Heuristic Optimizer</span>
      </div>

      <div className="space-y-3">
        {sorted.map((rec: Recommendation) => (
          <RecommendationCard key={rec.recommendation_id} rec={rec} onInspect={onInspect} onApprove={onApprove} />
        ))}
      </div>

      <div className="bg-slate-900 rounded-xl p-4 text-slate-300 border border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-md bg-slate-800 text-sky-400 shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-white block">Shortage Predictive Algorithm</span>
            <p className="text-slate-400 leading-relaxed">
              ShortageWatch flags stocks <span className="text-sky-300">before depletion</span> by correlating supplier replenishment latencies, consumption anomaly velocity, and peer buffer stocks.
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 mt-2">
              <span>
                Model Latency: <span className="font-mono text-slate-200">18ms</span>
              </span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 99.4% Uptime
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
