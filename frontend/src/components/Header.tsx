import { ShieldAlert, MapPin, Pill, Filter, ChevronDown, RefreshCw } from 'lucide-react';

interface HeaderProps {
  district: string;
  setDistrict: (v: string) => void;
  criticality: string;
  setCriticality: (v: string) => void;
  risk: string;
  setRisk: (v: string) => void;
  onSync: () => void;
  syncing: boolean;
}

function SelectWrap({
  icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-0.5">{label}</span>
      <div className="relative flex items-center">
        <span className="absolute left-2.5 pointer-events-none text-slate-400">{icon}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs font-medium pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-colors appearance-none cursor-pointer hover:border-slate-300"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
      </div>
    </div>
  );
}

export default function Header({ district, setDistrict, criticality, setCriticality, risk, setRisk, onSync, syncing }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      {/* Top bar: brand + live status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <ShieldAlert className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">ShortageWatch</span>
              <span className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-sky-50 text-sky-600 border border-sky-200 rounded-full">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5 leading-none">
              Regional medicine stock monitoring & supply alerts
            </p>
          </div>
        </div>

        <button
          onClick={onSync}
          title="Refresh live telemetry"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 transition"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline text-slate-500 font-mono text-[11px]">Live</span>
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-end gap-4 flex-wrap">
          <SelectWrap
            icon={<MapPin className="w-3.5 h-3.5" />}
            label="District"
            value={district}
            onChange={setDistrict}
            options={[
              { value: 'ALL', label: 'All Districts' },
              { value: 'Central Metro', label: 'Central Metro' },
              { value: 'Northern Highland', label: 'Northern Highland' },
              { value: 'Eastern Valley', label: 'Eastern Valley' },
              { value: 'Coastal Delta', label: 'Coastal Delta' },
            ]}
          />
          <SelectWrap
            icon={<Pill className="w-3.5 h-3.5" />}
            label="Medicine Type"
            value={criticality}
            onChange={setCriticality}
            options={[
              { value: 'ALL', label: 'All Medicines' },
              { value: 'essential', label: 'Essential Only' },
              { value: 'routine', label: 'Routine Only' },
            ]}
          />
          <SelectWrap
            icon={<Filter className="w-3.5 h-3.5" />}
            label="Risk Level"
            value={risk}
            onChange={setRisk}
            options={[
              { value: 'ALL', label: 'All Levels' },
              { value: 'critical', label: 'Critical' },
              { value: 'amber', label: 'At Risk' },
              { value: 'healthy', label: 'Healthy' },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
