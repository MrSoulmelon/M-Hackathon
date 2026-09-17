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
      <div className="bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
          <div>
            <h3 className="font-semibold text-slate-200">Inventory History</h3>
            <p className="text-xs text-slate-500">{facilityId} • {medicineId}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-500 text-xl font-medium">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No stock updates recorded for this pair.</div>
          ) : (
            <div className="space-y-4">
              {history.map(item => (
                <div key={item.id} className="border border-slate-800 rounded-lg p-4 bg-slate-900 shadow-sm flex gap-4">
                  <div className="shrink-0 flex flex-col items-center justify-center w-12 h-12 bg-slate-950 rounded-full border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase leading-none mt-1">QTY</span>
                    <span className="text-sm font-bold text-slate-300 leading-none">{item.new_qty}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-medium text-slate-200 text-sm">Update from {item.old_qty} &rarr; {item.new_qty}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                          item.source === 'Facility-Reported' ? 'bg-blue-900 text-blue-400' :
                          item.source === 'Supplier-Confirmed' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-800 text-slate-300'
                        }`}>{item.source}</span>
                      </div>
                      <span className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    
                    <p className="text-xs text-slate-500 mb-2">Note: <span className="italic text-slate-500">{item.note}</span></p>
                    <p className="text-[10px] text-slate-500">By User: {item.user_id} ({item.role})</p>
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
