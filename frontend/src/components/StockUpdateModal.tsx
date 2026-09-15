import React, { useState } from 'react';

interface StockUpdateModalProps {
  medicineId: string;
  medicineName: string;
  currentQty: number;
  onClose: () => void;
  onUpdate: (medicineId: string, newQty: number, note: string) => void;
}

export const StockUpdateModal: React.FC<StockUpdateModalProps> = ({ 
  medicineId, medicineName, currentQty, onClose, onUpdate 
}) => {
  const [newQty, setNewQty] = useState(currentQty.toString());
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(medicineId, parseInt(newQty, 10), note);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">Log Stock Update</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-600 mb-1">Medicine: <span className="font-semibold text-slate-800">{medicineName}</span></p>
            <p className="text-sm text-slate-600">Current Qty: <span className="font-semibold text-slate-800">{currentQty}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Quantity</label>
            <input 
              type="number" 
              required
              min="0"
              className="w-full rounded-md border-slate-300 shadow-sm p-2 border" 
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note / Reason</label>
            <input 
              type="text" 
              required
              placeholder="e.g. physical count"
              className="w-full rounded-md border-slate-300 shadow-sm p-2 border" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">Update Stock</button>
          </div>
        </form>
      </div>
    </div>
  );
};
