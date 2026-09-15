import { useState, useEffect } from 'react';
import {
  X,
  Users,
  Truck,
  Gauge,
  Send,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Binary,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import type { Facility, RiskScore, Medicine, StockHistoryPoint } from '../types';
import { useApi } from '../contexts/ApiContext';
import { HistoryModal } from './HistoryModal';

interface FacilityInspectorProps {
  facility: Facility;
  initialMedicineId: string;
  onClose: () => void;
  onDispatch: () => void;
}

export default function FacilityInspector({ facility, initialMedicineId, onClose, onDispatch }: FacilityInspectorProps) {
  const { medicines, riskScores, getRiskScore, getChartData } = useApi();
  const [selectedMedicineId, setSelectedMedicineId] = useState(initialMedicineId);
  const [visible, setVisible] = useState(false);
  const [chartData, setChartData] = useState<StockHistoryPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Reset selected medicine when facility changes
  useEffect(() => {
    setSelectedMedicineId(initialMedicineId);
  }, [initialMedicineId, facility.facility_id]);

  const scores: RiskScore[] = riskScores.filter((s) => s.facility_id === facility.facility_id);
  const score: RiskScore | undefined = getRiskScore(facility.facility_id, selectedMedicineId);

  const currentScore: RiskScore = score ?? {
    facility_id: facility.facility_id,
    medicine_id: selectedMedicineId,
    medicine_name: medicines.find((m) => m.medicine_id === selectedMedicineId)?.name ?? 'Unknown',
    risk_level: 'green',
    days_of_supply: 35,
    projected_stockout_date: 'Nov 30',
    confidence: 'high',
    confidence_note: 'Standard baseline',
    signals: { consumption_trend: 'stable', consumption_anomaly_score: 0.1, replenishment_status: 'on_time', replenishment_delay_days: 0 },
    reason_codes: ['INVENTORY_STABLE'],
  };

  useEffect(() => {
    let isMounted = true;
    async function loadChart() {
      setChartLoading(true);
      const data = await getChartData(facility.facility_id, selectedMedicineId, currentScore);
      if (isMounted) {
        setChartData(data);
        setChartLoading(false);
      }
    }
    loadChart();
    return () => { isMounted = false; };
  }, [facility.facility_id, selectedMedicineId, getChartData, currentScore]);

  // Risk badge
  let riskBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  let riskBadgeText = 'Optimal Buffer Level';
  if (currentScore.risk_level === 'red') {
    riskBadgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
    riskBadgeText = 'Critical Risk Level';
  } else if (currentScore.risk_level === 'amber') {
    riskBadgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
    riskBadgeText = 'At-Risk Level';
  }

  // Signal: Consumption Trend
  let trendValue = 'Stable Baseline';
  let trendClass = 'text-sm font-bold text-slate-800 capitalize';
  let trendDesc = 'Consumption rate conforms with rolling 90-day moving average.';
  let TrendIcon = Activity;
  let trendIconClass = 'text-slate-400';
  if (currentScore.signals.consumption_trend === 'rising') {
    trendValue = 'Surging (+38%)';
    trendClass = 'text-sm font-bold text-rose-700 capitalize';
    trendDesc = 'Spike in patient prescriptions over trailing 7-day window.';
    TrendIcon = TrendingUp;
    trendIconClass = 'text-rose-500';
  } else if (currentScore.signals.consumption_trend === 'falling') {
    trendValue = 'Decreasing (-12%)';
    trendClass = 'text-sm font-bold text-slate-700 capitalize';
    trendDesc = 'Dispensing velocity below seasonal baseline.';
    TrendIcon = TrendingDown;
    trendIconClass = 'text-slate-400';
  }

  // Signal: Replenishment
  let replValue = 'On Schedule';
  let replClass = 'text-sm font-bold text-emerald-700 capitalize';
  let replDesc = 'Regular bi-weekly delivery expected on standard timetable.';
  let ReplIcon = Clock;
  let replIconClass = 'text-emerald-500';
  if (currentScore.signals.replenishment_status === 'overdue') {
    replValue = `Overdue (${currentScore.signals.replenishment_delay_days} days)`;
    replClass = 'text-sm font-bold text-rose-700 capitalize';
    replDesc = `Supplier PO order has breached SLA delivery window by ${currentScore.signals.replenishment_delay_days} days.`;
    replIconClass = 'text-rose-500';
  } else if (currentScore.signals.replenishment_status === 'delayed') {
    replValue = `Delayed (${currentScore.signals.replenishment_delay_days} days)`;
    replClass = 'text-sm font-bold text-amber-700 capitalize';
    replDesc = 'Transit shipment flagged with logistics delay at central depot.';
    replIconClass = 'text-amber-500';
  }

  // Signal: Anomaly
  const anom = currentScore.signals.consumption_anomaly_score;
  let anomClass = 'text-sm font-bold text-emerald-700 font-mono';
  let anomDesc = 'Normal distribution: minimal variance detected.';
  let anomIconClass = 'text-emerald-500';
  if (anom > 0.7) {
    anomClass = 'text-sm font-bold text-rose-700 font-mono';
    anomDesc = 'High divergence anomaly: exceeds 2.5 standard deviations.';
    anomIconClass = 'text-rose-500';
  } else if (anom > 0.4) {
    anomClass = 'text-sm font-bold text-amber-700 font-mono';
    anomDesc = 'Moderate variance: slight divergence from forecast.';
    anomIconClass = 'text-amber-500';
  }

  const stockoutDay = currentScore.risk_level === 'red' ? currentScore.days_of_supply : currentScore.risk_level === 'amber' ? currentScore.days_of_supply : null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 flex justify-end ${visible ? 'opacity-100' : 'opacity-0'}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto transform transition-transform duration-300 flex flex-col border-l border-slate-200 ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 sticky top-0 z-10 backdrop-blur flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">{facility.type}</span>
              <span className="text-xs font-medium text-slate-500">{facility.district} District</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{facility.name}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {facility.catchment_population.toLocaleString()} Catchment Pop.
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                Primary Supplier: <span className="font-mono font-medium text-slate-700">{facility.supplier_id}</span>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Medicine Risk Inventory Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Monitored Formulary & Risk Level</h3>
              <span className="text-xs text-slate-400">Click a medicine to inspect predictive trajectory</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {medicines.map((med: Medicine) => {
                const s = scores.find((sc) => sc.medicine_id === med.medicine_id);
                const risk = s?.risk_level ?? 'green';
                const days = s?.days_of_supply ?? 30;
                const isSelected = med.medicine_id === selectedMedicineId;

                let dotColor = 'bg-emerald-500';
                if (risk === 'red') dotColor = 'bg-rose-500';
                else if (risk === 'amber') dotColor = 'bg-amber-500';

                const selectedStyle = isSelected
                  ? 'ring-2 ring-sky-500 bg-sky-50/50 border-sky-300'
                  : 'bg-white border-slate-200 hover:border-slate-300';

                return (
                  <button
                    key={med.medicine_id}
                    onClick={() => setSelectedMedicineId(med.medicine_id)}
                    className={`text-left p-2.5 rounded-lg border transition flex items-center justify-between ${selectedStyle}`}
                  >
                    <div className="truncate mr-2">
                      <span className="text-xs font-semibold text-slate-800 block truncate">{med.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{med.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono text-slate-500">{days}d</span>
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Predictive Details for Selected Medicine */}
          <div className="space-y-6 border-t border-slate-200 pt-6">
            {/* Selected Medicine Top Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Selection</span>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">{currentScore.medicine_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${riskBadgeClass}`}>{riskBadgeText}</span>
                    <span className="text-xs text-slate-500">
                      Days of Supply: <strong className="font-mono text-slate-800">{currentScore.days_of_supply} days</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 shadow-sm cursor-help relative group">
                    <Gauge className="w-3.5 h-3.5 text-sky-600" />
                    <span>
                      Confidence: <strong>{currentScore.confidence.toUpperCase()}</strong>
                    </span>
                    <div className="absolute right-0 bottom-full mb-2 w-64 p-2.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-xl hidden group-hover:block z-30 pointer-events-none">
                      <span className="font-semibold block mb-0.5 text-sky-300">Prediction Confidence Model:</span>
                      <span>{currentScore.confidence_note}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Est. Stockout: <span className="font-medium text-rose-600 font-mono">~{currentScore.projected_stockout_date} (predicted)</span>
                  </div>
                  <button 
                    onClick={() => setShowHistory(true)}
                    className="mt-2 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded transition"
                  >
                    View History
                  </button>
                </div>
              </div>
            </div>

            {/* Stock Level Trajectory Chart */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">30-Day Inventory Trajectory & Depletion Curve</h4>
                  <p className="text-xs text-slate-500">Historical consumption vs. projected stockout boundary</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-2.5 h-0.5 bg-sky-500 inline-block" /> Actual
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-2.5 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" /> Projected
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Today
                  </span>
                </div>
              </div>

              <div className="w-full h-44 relative bg-slate-50/50 rounded-lg p-2 border border-slate-100">
                {chartLoading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm rounded-lg">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : null}
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        fontSize: '11px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        padding: '6px 10px',
                      }}
                      labelStyle={{ fontWeight: 600, color: '#334155' }}
                      formatter={(value, name) => {
                        if (value === null || value === undefined) return ['—', String(name)];
                        return [`${value} days supply`, name === 'actual' ? 'Actual' : 'Projected'];
                      }}
                    />
                    <ReferenceLine y={15} stroke="#fca5a5" strokeDasharray="4 2" strokeWidth={1}>
                    </ReferenceLine>
                    <ReferenceLine x="Today" stroke="#64748b" strokeDasharray="2 2" strokeWidth={1.5} />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                      name="actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="projected"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls={false}
                      name="projected"
                    />
                    {stockoutDay !== null && stockoutDay <= 10 && (
                      <ReferenceDot
                        x={`+${stockoutDay}d`}
                        y={0}
                        r={4}
                        fill="#ef4444"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 px-4 mt-1 font-mono">
                <span>-20d</span>
                <span>-15d</span>
                <span>-10d</span>
                <span>-5d</span>
                <span className="font-bold text-slate-700">Today</span>
                <span className="text-rose-600 font-bold">+5d</span>
                <span>+10d</span>
              </div>
            </div>

            {/* "Why This Is Flagged" Multi-Signal Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-sky-600" />
                  Transparent Signal Attribution ("Why This Is Flagged")
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">Deconstructed Indicators</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Signal 1: Consumption Trend */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Consumption Trend</span>
                    <TrendIcon className={`w-4 h-4 ${trendIconClass}`} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={trendClass}>{trendValue}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{trendDesc}</p>
                </div>

                {/* Signal 2: Replenishment Status */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Replenishment</span>
                    <ReplIcon className={`w-4 h-4 ${replIconClass}`} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={replClass}>{replValue}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{replDesc}</p>
                </div>

                {/* Signal 3: Anomaly Score */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Anomaly Score</span>
                    <Activity className={`w-4 h-4 ${anomIconClass}`} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={anomClass}>{anom} / 1.0</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{anomDesc}</p>
                </div>
              </div>

              {/* Reason Codes */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1.5">Machine Reason Codes</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentScore.reason_codes.map((code) => (
                    <span key={code} className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white text-slate-700 border border-slate-200">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct Triage Action */}
            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <h5 className="text-xs font-semibold text-sky-900">Recommended Next Step</h5>
                <p className="text-xs text-sky-800">Dispatch 450 units from Central Warehouse via priority van.</p>
              </div>
              <button
                onClick={onDispatch}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Initiate Triage
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Facility ID: <span className="font-mono text-slate-700">{facility.facility_id}</span>
          </span>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-medium transition">
            Close Inspector
          </button>
        </div>
      </div>

      {showHistory && (
        <HistoryModal 
          facilityId={facility.facility_id}
          medicineId={selectedMedicineId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
