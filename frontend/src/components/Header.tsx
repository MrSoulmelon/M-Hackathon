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
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <div className="relative flex items-center">
        <span className="absolute left-2.5 pointer-events-none text-slate-400">{icon}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs font-medium pl-8 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors appearance-none cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
      </div>
    </div>
  );
}

export default function Header({ district, setDistrict, criticality, setCriticality, risk, setRisk, onSync, syncing }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm ring-1 ring-slate-800">
            <ShieldAlert className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 tracking-tight text-lg">ShortageWatch</span>
              <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase bg-sky-50 text-sky-700 border border-sky-200 rounded-full">
                Early Warning Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Predictive Regional Supply Chain & Clinical Triage</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SelectWrap
            icon={<MapPin className="w-3.5 h-3.5" />}
            value={district}
            onChange={setDistrict}
            options={[
              { value: 'ALL', label: 'All Districts (4)' },
              { value: 'Central Metro', label: 'Central Metro' },
              { value: 'Northern Highland', label: 'Northern Highland' },
              { value: 'Eastern Valley', label: 'Eastern Valley' },
              { value: 'Coastal Delta', label: 'Coastal Delta' },
            ]}
          />
          <SelectWrap
            icon={<Pill className="w-3.5 h-3.5" />}
            value={criticality}
            onChange={setCriticality}
            options={[
              { value: 'ALL', label: 'All Medicines (8)' },
              { value: 'essential', label: 'Essential Medicines Only' },
              { value: 'routine', label: 'Routine Medicines Only' },
            ]}
          />
          <div className="hidden md:block">
            <SelectWrap
              icon={<Filter className="w-3.5 h-3.5" />}
              value={risk}
              onChange={setRisk}
              options={[
                { value: 'ALL', label: 'All Risk Levels' },
                { value: 'critical', label: 'Critical (Red) Only' },
                { value: 'amber', label: 'At Risk (Amber)' },
                { value: 'healthy', label: 'Healthy (Green)' },
              ]}
            />
          </div>

          <div className="h-5 w-px bg-slate-200" />

          <button
            onClick={onSync}
            title="Refresh live telemetry stream"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-500">Live API</span>
            <RefreshCw className={`w-3 h-3 ml-0.5 text-slate-400 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
