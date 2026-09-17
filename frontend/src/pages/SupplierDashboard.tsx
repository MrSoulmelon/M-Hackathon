import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search } from 'lucide-react';

export const SupplierDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/my-shipments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setShipments(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  const handleUpdateStatus = async (shipmentId: number, targetStatus: string, expectedDate: string) => {
    // For demo, if delayed, add 3 days to expected date
    let newExpected = expectedDate;
    if (targetStatus === 'delayed') {
      const d = new Date(expectedDate);
      d.setDate(d.getDate() + 3);
      newExpected = d.toISOString().split('T')[0];
    }

    try {
      const res = await fetch(`http://localhost:8000/replenishment/${shipmentId}/update-status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: targetStatus, expected_date: newExpected }),
      });
      
      if (res.ok) {
        setShipments(prev => prev.map(s => 
          s.id === shipmentId ? { ...s, status: targetStatus, expected_date: newExpected, actual_received_date: targetStatus === 'delivered' ? new Date().toISOString().split('T')[0] : s.actual_received_date } : s
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredShipments = shipments.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.facility_id.toLowerCase().includes(q) || item.medicine_id.toLowerCase().includes(q);
  });

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-hidden bg-medical-theme text-white">
      
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-screen filter blur-[128px] opacity-40 pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-400 rounded-full mix-blend-screen filter blur-[128px] opacity-40 pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col flex-1">
        <header className="bg-slate-950 border-b border-sky-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-900/50 flex items-center justify-center text-sky-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Supplier Dashboard</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{user?.reference_id} • {user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={logout} className="text-sm font-semibold text-slate-500 hover:text-white border border-sky-800 bg-slate-900 hover:bg-slate-900 px-4 py-2 rounded-xl transition shadow-sm">
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-6 mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Active Shipments</h2>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                {filteredShipments.length} Deliveries Tracked
              </div>
            </div>
            <div className="flex flex-col gap-0.5 w-full sm:w-72">
              <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-widest pl-0.5">Search Shipments</span>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 pointer-events-none text-sky-400"><Search className="w-3.5 h-3.5" /></span>
                <input
                  type="text"
                  placeholder="Search facility or medicine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-medium pl-8 pr-3 py-1.5 bg-slate-900 border border-sky-800 rounded-lg text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-colors shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-xs uppercase tracking-wider font-semibold text-slate-500">
                  <th className="p-4 px-6">Facility</th>
                  <th className="p-4 px-6">Medicine</th>
                  <th className="p-4 px-6">Qty</th>
                  <th className="p-4 px-6">Order Date</th>
                  <th className="p-4 px-6">Expected</th>
                  <th className="p-4 px-6">Status</th>
                  <th className="p-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-300 divide-y divide-slate-800">
                {filteredShipments.map(item => (
                  <tr key={item.id} className="hover:bg-slate-950/50 transition">
                    <td className="p-4 px-6 font-semibold text-white">{item.facility_id}</td>
                    <td className="p-4 px-6">{item.medicine_id}</td>
                    <td className="p-4 px-6">
                      <span className="font-semibold">{item.quantity}</span>
                    </td>
                    <td className="p-4 px-6 text-slate-500">{item.order_date}</td>
                    <td className="p-4 px-6 font-medium">{item.expected_date}</td>
                    <td className="p-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] uppercase tracking-wider font-bold border ${
                        item.status === 'delivered' ? 'bg-sky-950 text-emerald-700 border-sky-800' :
                        item.status === 'delayed' ? 'bg-violet-950 text-violet-700 border-violet-800' :
                        'bg-blue-950 text-blue-400 border-blue-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-right">
                      {item.status !== 'delivered' && (
                        <div className="flex justify-end gap-2">
                          {item.status !== 'delayed' && (
                            <button 
                              onClick={() => handleUpdateStatus(item.id, 'delayed', item.expected_date)}
                              className="text-violet-700 hover:text-white font-semibold text-[11px] uppercase tracking-wider px-3 py-1.5 border border-violet-800 hover:border-violet-600 bg-slate-900 hover:bg-violet-600 rounded-lg transition shadow-sm"
                            >
                              Report Delay
                            </button>
                          )}
                          <button 
                            onClick={() => handleUpdateStatus(item.id, 'delivered', item.expected_date)}
                            className="text-emerald-700 hover:text-white font-semibold text-[11px] uppercase tracking-wider px-3 py-1.5 border border-sky-800 hover:border-sky-600 bg-slate-900 hover:bg-sky-600 rounded-lg transition shadow-sm"
                          >
                            Delivered
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredShipments.length === 0 && (
              <div className="p-12 text-center text-slate-500 bg-slate-950/50">
                <p className="font-medium">No active shipments found.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
