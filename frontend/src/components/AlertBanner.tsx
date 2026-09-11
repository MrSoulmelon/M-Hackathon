import { Radio, AlertCircle, ArrowUpRight } from 'lucide-react';
import type { Alert } from '../types';

interface AlertBannerProps {
  alert: Alert;
  onViewDetails: (alert: Alert) => void;
}

export default function AlertBanner({ alert, onViewDetails }: AlertBannerProps) {
  const isSystemic = alert.scope === 'systemic';
  const borderColor = isSystemic ? 'border-rose-300' : 'border-amber-300';
  const bgColor = isSystemic
    ? 'bg-gradient-to-r from-rose-50/70 via-white to-amber-50/40'
    : 'bg-gradient-to-r from-amber-50/70 via-white to-slate-50';
  const badgeColor = isSystemic
    ? 'bg-rose-100 text-rose-800 border-rose-200'
    : 'bg-amber-100 text-amber-800 border-amber-200';

  return (
    <div className={`p-4 rounded-xl border ${borderColor} ${bgColor} shadow-sm transition hover:shadow-md`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-lg ${isSystemic ? 'bg-rose-600' : 'bg-amber-500'} text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5`}
          >
            {isSystemic ? <Radio className="w-5 h-5 animate-pulse" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                {isSystemic ? 'Systemic Multi-Facility Alert' : 'Isolated Anomaly Alert'}
              </span>
              <span className="text-xs font-semibold text-slate-900">{alert.medicine_name}</span>
              <span className="text-xs text-slate-500">• {alert.district}</span>
            </div>
            <p className="text-xs text-slate-700 font-normal leading-relaxed max-w-3xl">{alert.summary}</p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
              <span>
                Diagnosis:{' '}
                <strong className="capitalize text-slate-700 font-medium">
                  {alert.diagnosis.replace('_', ' ')}
                </strong>
              </span>
              <span>
                Supplier: <code className="font-mono text-slate-700 bg-slate-100 px-1 rounded">{alert.supplier_id}</code>
              </span>
              <span>
                Affected Sites: <strong className="text-rose-700">{alert.affected_facilities.length} facilities</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex sm:flex-col items-end justify-center">
          <button
            onClick={() => onViewDetails(alert)}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition shadow-xs flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
