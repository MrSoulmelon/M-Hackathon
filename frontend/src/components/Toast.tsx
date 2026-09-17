import { CheckCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ToastProps {
  title: string;
  body: string;
  visible: boolean;
}

export default function Toast({ title, body, visible }: ToastProps) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed whenever a new toast appears
  useEffect(() => {
    if (visible) setDismissed(false);
  }, [visible, title]);

  const show = visible && !dismissed;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-[9999] flex items-start gap-3 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-xl px-4 py-3.5 transform transition-all duration-300 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="p-1.5 rounded-lg bg-emerald-900 text-emerald-600 shrink-0 mt-0.5">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        {body && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{body}</p>}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-300 hover:text-slate-500 shrink-0 mt-0.5 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
