import { ShieldAlert, MapPin, Pill, Filter, ChevronDown, RefreshCw, Search } from 'lucide-react';

interface HeaderProps {
  district: string;
  setDistrict: (v: string) => void;
  criticality: string;
  setCriticality: (v: string) => void;
  risk: string;
  setRisk: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
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
      <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-widest pl-0.5">{label}</span>
      <div className="relative flex items-center">
        <span className="absolute left-2.5 pointer-events-none text-sky-500">{icon}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs font-medium pl-8 pr-7 py-1.5 bg-slate-900 border border-sky-800 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-colors appearance-none cursor-pointer hover:border-sky-700 shadow-sm"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-sky-400 absolute right-2 pointer-events-none" />
      </div>
    </div>
  );
}

export default function Header({ district, setDistrict, criticality, setCriticality, risk, setRisk, searchQuery, setSearchQuery, onSync, syncing }: HeaderProps) {
  return (
    <header className="bg-slate-950 border-b border-sky-800 sticky top-0 z-50 shadow-sm">
      {/* Top bar: brand + live status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-900/50 flex items-center justify-center text-sky-400">
            <ShieldAlert className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span 
                className="text-2xl font-serif italic font-bold uppercase"
                style={{
                  color: '#ffffff',
                  textShadow: '-2px 0px 0px rgba(56,189,248,0.9), 2px 0px 0px rgba(192,38,211,0.9)',
                  letterSpacing: '0.02em'
                }}
              >
                Beacon
              </span>
              <span className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-blue-900/50 text-sky-300 border border-sky-700 rounded-full mt-1">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5 leading-none">
              Regional medicine stock monitoring & supply alerts
            </p>
          </div>
        </div>

        <button
          onClick={onSync}
          title="Refresh live telemetry"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-800 bg-slate-900 hover:bg-slate-900 text-xs font-medium text-slate-500 transition shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <span className="hidden sm:inline text-slate-500 font-mono text-[11px]">Live</span>
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-slate-900/80 border-t border-sky-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-end gap-4 flex-wrap">
          <div className="flex flex-col gap-0.5 flex-1 min-w-[200px]">
            <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-widest pl-0.5">Search</span>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 pointer-events-none text-sky-400"><Search className="w-3.5 h-3.5" /></span>
              <input
                type="text"
                placeholder="Search facilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-medium pl-8 pr-3 py-1.5 bg-slate-900 border border-sky-800 rounded-lg text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-colors shadow-sm"
              />
            </div>
          </div>
          <SelectWrap
            icon={<MapPin className="w-3.5 h-3.5" />}
            label="District"
            value={district}
            onChange={setDistrict}
            options={[
              { value: 'ALL', label: 'All Districts' },
              { value: 'Central', label: 'Central' },
              { value: 'North', label: 'North' },
              { value: 'Highland', label: 'Highland' },
              { value: 'South', label: 'South' },
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
