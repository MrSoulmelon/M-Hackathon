import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../contexts/ApiContext';
import { StockUpdateModal } from '../components/StockUpdateModal';

export const ConsumerDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { medicines } = useApi();
  const [facility, setFacility] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMed, setSelectedMed] = useState<any>(null);

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

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{facility?.name || 'My Facility'}</h1>
          <p className="text-sm text-slate-500">Consumer Dashboard • {user?.email}</p>
        </div>
        <button onClick={logout} className="text-sm text-slate-600 hover:text-slate-900 border px-3 py-1.5 rounded">Logout</button>
      </header>

      <main className="max-w-5xl mx-auto p-6 mt-4">
        <h2 className="text-lg font-semibold mb-4">My Stock</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                <th className="p-4">Medicine</th>
                <th className="p-4">Current Qty</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {inventory.map(item => {
                const med = medicines.find(m => m.medicine_id === item.medicine_id);
                return (
                  <tr key={item.medicine_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="p-4 font-medium">{med?.name || item.medicine_id}</td>
                    <td className="p-4">{item.quantity_on_hand} {med?.unit}</td>
                    <td className="p-4">{item.date}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedMed({ id: item.medicine_id, name: med?.name, qty: item.quantity_on_hand })}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-full transition"
                      >
                        Update Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {inventory.length === 0 && (
            <div className="p-8 text-center text-slate-500">No inventory records found.</div>
          )}
        </div>
      </main>

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
