import { AlertTriangle, AlertOctagon, ArrowUpRight } from 'lucide-react';
import type { Alert } from '../types';

interface AlertBannerProps {
  alert: Alert;
  onViewDetails: (alert: Alert) => void;
}

export default function AlertBanner({ alert, onViewDetails }: AlertBannerProps) {
  const isSystemic = alert.scope === 'systemic';

  return (
    <div
      className={`rounded-2xl border ${
        isSystemic
          ? 'border-rose-200 bg-rose-50/90 shadow-sm'
          : 'border-amber-200 bg-amber-50/90 shadow-sm'
      } p-3 transition-shadow hover:shadow-md`}
    >
      <div className="flex flex-col gap-2">
        {/* Top: Icon + Title */}
        <div className="flex items-center gap-3">
          <div
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
              isSystemic ? 'bg-rose-600' : 'bg-amber-500'
            } text-white`}
          >
            {isSystemic ? (
              <AlertOctagon className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
          
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {alert.medicine_name || alert.medicine_id}
              </h3>
              {isSystemic && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-200/50 text-rose-800">
                  Systemic
                </span>
              )}
              {!isSystemic && alert.medicine_ids && alert.medicine_ids.length > 1 && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-200/50 text-amber-800">
                  +{alert.medicine_ids.length - 1} More
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-slate-500 truncate">{alert.district}</p>
          </div>
        </div>

        {/* Bottom: Cause & Action (Removed summary block to reduce clutter) */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200/50">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Cause</span>
            <span className="text-xs font-semibold text-slate-700 capitalize">
              {alert.diagnosis.replace(/_/g, ' ')}
            </span>
          </div>
          <button
            onClick={() => onViewDetails(alert)}
            className={`flex items-center gap-1 px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold rounded-lg transition ${
              isSystemic
                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            Review <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
