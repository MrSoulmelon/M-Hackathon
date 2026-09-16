import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../contexts/ApiContext';
import { StockUpdateModal } from '../components/StockUpdateModal';
import { Search } from 'lucide-react';

export const ConsumerDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { medicines } = useApi();
  const [facility, setFacility] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMed, setSelectedMed] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const facRes = await fetch('http://localhost:8000/my-facility', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (facRes.ok) setFacility(await facRes.json());

        // Get latest inventory
        const invRes = await fetch(`http://localhost:8000/inventory?facility_id=${user?.reference_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (invRes.ok) {
          const invData = await invRes.json();
          // Group by medicine_id to get latest date
          const latestInv: Record<string, any> = {};
          invData.forEach((item: any) => {
            if (!latestInv[item.medicine_id] || item.date > latestInv[item.medicine_id].date) {
              latestInv[item.medicine_id] = item;
            }
          });
          setInventory(Object.values(latestInv));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token, user]);

  const handleUpdateStock = async (medicineId: string, newQty: number, note: string) => {
    try {
      const res = await fetch('http://localhost:8000/inventory/manual-update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ medicine_id: medicineId, new_quantity: newQty, note }),
      });
      if (res.ok) {
        // Refresh inventory
        setInventory(prev => prev.map(item => 
          item.medicine_id === medicineId 
            ? { ...item, quantity_on_hand: newQty, date: new Date().toISOString().split('T')[0] } 
            : item
        ));
        setSelectedMed(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (!searchQuery.trim()) return true;
    const med = medicines.find(m => m.medicine_id === item.medicine_id);
    const name = med?.name || item.medicine_id;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-hidden bg-medical-theme text-slate-900">
      
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col flex-1">
        <header className="bg-sky-100 border-b border-sky-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-sky-200 flex items-center justify-center text-sky-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{facility?.name || 'Clinic Portal'}</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={logout} className="text-sm font-semibold text-slate-600 hover:text-slate-900 border border-sky-200 bg-white hover:bg-sky-50 px-4 py-2 rounded-xl transition shadow-sm">
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto p-6 mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Current Inventory</h2>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                {filteredInventory.length} Items Tracked
              </div>
            </div>
            <div className="flex flex-col gap-0.5 w-full sm:w-72">
              <span className="text-[10px] font-semibold text-sky-600 uppercase tracking-widest pl-0.5">Search Inventory</span>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 pointer-events-none text-sky-400"><Search className="w-3.5 h-3.5" /></span>
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-medium pl-8 pr-3 py-1.5 bg-white border border-sky-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-colors shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider font-semibold text-slate-500">
                  <th className="p-4 px-6">Medicine</th>
                  <th className="p-4 px-6">Current Stock</th>
                  <th className="p-4 px-6">Last Updated</th>
                  <th className="p-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {filteredInventory.map(item => {
                  const med = medicines.find(m => m.medicine_id === item.medicine_id);
                  return (
                    <tr key={item.medicine_id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 px-6 font-semibold text-slate-900">{med?.name || item.medicine_id}</td>
                      <td className="p-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                          {item.quantity_on_hand} <span className="text-[10px] uppercase opacity-70">{med?.unit || 'units'}</span>
                        </span>
                      </td>
                      <td className="p-4 px-6 text-slate-500">{item.date}</td>
                      <td className="p-4 px-6 text-right">
                        <button 
                          onClick={() => setSelectedMed({ id: item.medicine_id, name: med?.name, qty: item.quantity_on_hand })}
                          className="text-blue-600 hover:text-white font-semibold text-xs px-4 py-2 border border-blue-200 hover:border-blue-600 bg-white hover:bg-blue-600 rounded-xl transition shadow-sm"
                        >
                          Update Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredInventory.length === 0 && (
              <div className="p-12 text-center text-slate-500 bg-slate-50/50">
                <p className="font-medium">No inventory records found.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedMed && (
        <StockUpdateModal 
          medicineId={selectedMed.id}
          medicineName={selectedMed.name}
          currentQty={selectedMed.qty}
          onClose={() => setSelectedMed(null)}
          onUpdate={handleUpdateStock}
        />
      )}
    </div>
  );
};
