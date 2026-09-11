import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  title: string;
  body: string;
  visible: boolean;
}

export default function Toast({ title, body, visible }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] transform transition-all duration-300 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-3 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[11px] text-slate-400">{body}</p>
      </div>
    </div>
  );
}
