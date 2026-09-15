import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const SupplierDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Supplier Dashboard</h1>
          <p className="text-sm text-slate-500">{user?.reference_id} • {user?.email}</p>
        </div>
        <button onClick={logout} className="text-sm text-slate-600 hover:text-slate-900 border px-3 py-1.5 rounded">Logout</button>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-4">
        <h2 className="text-lg font-semibold mb-4">Active Shipments</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                <th className="p-4">Facility</th>
                <th className="p-4">Medicine</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Order Date</th>
                <th className="p-4">Expected</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {shipments.map(item => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="p-4 font-medium">{item.facility_id}</td>
                  <td className="p-4">{item.medicine_id}</td>
                  <td className="p-4">{item.quantity}</td>
                  <td className="p-4">{item.order_date}</td>
                  <td className="p-4">{item.expected_date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      item.status === 'delayed' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {item.status !== 'delivered' && (
                      <div className="flex justify-end gap-2">
                        {item.status !== 'delayed' && (
                          <button 
                            onClick={() => handleUpdateStatus(item.id, 'delayed', item.expected_date)}
                            className="text-amber-600 hover:text-amber-800 font-medium text-xs px-3 py-1 border border-amber-200 hover:border-amber-300 bg-amber-50 rounded transition"
                          >
                            Mark Delayed
                          </button>
                        )}
                        <button 
                          onClick={() => handleUpdateStatus(item.id, 'delivered', item.expected_date)}
                          className="text-emerald-600 hover:text-emerald-800 font-medium text-xs px-3 py-1 border border-emerald-200 hover:border-emerald-300 bg-emerald-50 rounded transition"
                        >
                          Mark Delivered
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shipments.length === 0 && (
            <div className="p-8 text-center text-slate-500">No active shipments found.</div>
          )}
        </div>
      </main>
    </div>
  );
};
