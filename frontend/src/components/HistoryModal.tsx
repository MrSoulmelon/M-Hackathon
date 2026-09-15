import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface HistoryModalProps {
  facilityId: string;
  medicineId: string;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ facilityId, medicineId, onClose }) => {
  const { token } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:8000/inventory/history?facility_id=${facilityId}&medicine_id=${medicineId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setHistory(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchHistory();
  }, [token, facilityId, medicineId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h3 className="font-semibold text-slate-800">Inventory History</h3>
            <p className="text-xs text-slate-500">{facilityId} • {medicineId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-medium">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No stock updates recorded for this pair.</div>
          ) : (
            <div className="space-y-4">
              {history.map(item => (
                <div key={item.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex gap-4">
                  <div className="shrink-0 flex flex-col items-center justify-center w-12 h-12 bg-slate-50 rounded-full border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mt-1">QTY</span>
                    <span className="text-sm font-bold text-slate-700 leading-none">{item.new_qty}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-medium text-slate-800 text-sm">Update from {item.old_qty} &rarr; {item.new_qty}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                          item.source === 'Facility-Reported' ? 'bg-blue-100 text-blue-700' :
                          item.source === 'Supplier-Confirmed' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>{item.source}</span>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    
                    <p className="text-xs text-slate-600 mb-2">Note: <span className="italic text-slate-500">{item.note}</span></p>
                    <p className="text-[10px] text-slate-400">By User: {item.user_id} ({item.role})</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
