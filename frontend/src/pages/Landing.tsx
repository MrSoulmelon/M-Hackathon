import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Map, Activity, LogIn } from 'lucide-react';

export const Landing = () => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // After 2.5 seconds, reveal the rest of the landing page
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Generate some random particles for the beacon beam
  const particles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: `${45 + Math.random() * 10}%`, // 45% to 55%, tightly grouped around the center
    animationDuration: `${1.5 + Math.random() * 2}s`,
    animationDelay: `${Math.random() * 2.5}s`,
    size: `${2 + Math.random() * 5}px`,
  })), []);

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] font-sans overflow-hidden relative">
      
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          70% { opacity: 0.8; }
          100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
        }
        @keyframes beamPulse {
          0%, 100% { opacity: 0.6; filter: blur(25px); }
          50% { opacity: 0.9; filter: blur(35px); }
        }
        @keyframes revealUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .reveal-element {
          opacity: 0;
          animation: revealUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Premium Dark Animation Background - The Beacon */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        {/* Base dark radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] opacity-90"></div>
        
        {/* Deep background glow */}
        <div className="absolute w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite]"></div>

        {/* The Vertical Beacon Beam */}
        <div 
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-[120vh] bg-gradient-to-t from-blue-600 via-cyan-500/20 to-transparent transition-all duration-1000 ${
            isAnimating ? 'opacity-100' : 'opacity-40'
          }`}
          style={{
            animation: 'beamPulse 4s ease-in-out infinite',
            boxShadow: '0 0 120px 30px rgba(59,130,246, 0.3)'
          }}
        ></div>
        
        {/* Intense Inner Core of the Beam */}
        <div 
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[100vh] bg-gradient-to-t from-white via-cyan-200 to-transparent blur-md transition-all duration-1000 ${
            isAnimating ? 'opacity-90' : 'opacity-20'
          }`}
        ></div>

        {/* Emitter Base */}
        <div className={`absolute bottom-[-2rem] left-1/2 -translate-x-1/2 w-80 h-24 bg-slate-900 rounded-[100%] border-t-[8px] border-cyan-400 flex flex-col items-center justify-start pt-3 transition-all duration-1000 ${
          isAnimating ? 'shadow-[0_-30px_80px_rgba(34,211,238,0.7)]' : 'shadow-[0_-10px_40px_rgba(34,211,238,0.3)]'
        }`}>
          <div className="w-32 h-6 bg-white rounded-[100%] blur-lg opacity-90"></div>
        </div>

        {/* Particles Stream */}
        <div className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-1000 ${isAnimating ? 'opacity-100' : 'opacity-30'}`}>
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute bottom-[-10px] rounded-full bg-white"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                boxShadow: '0 0 15px 4px rgba(34,211,238,1)',
                animation: `floatUp ${p.animationDuration} linear infinite`,
                animationDelay: p.animationDelay,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center mt-[-5vh]">
        
        {/* The Beacon Text - Starts center, slides up */}
        <h1 
          className={`text-7xl md:text-8xl lg:text-[10rem] font-serif italic font-bold uppercase transition-all duration-1000 ease-in-out z-20 ${
            isAnimating ? 'translate-y-[25vh] scale-110' : 'translate-y-0 scale-100 mb-4'
          }`}
          style={{
            color: 'rgba(167, 139, 250, 0.7)',
            textShadow: '-6px 0px 0px rgba(56,189,248,0.9), 6px 0px 0px rgba(192,38,211,0.9)',
            letterSpacing: '0.02em'
          }}
        >
          Beacon
        </h1>
        
        {/* Elements that reveal after animation */}
        {!isAnimating && (
          <>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-6 text-white mt-4 reveal-element" style={{ animationDelay: '0.1s' }}>
              AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Supply Chain Triage</span>
            </h2>
            
            <p className="text-sm md:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto mb-16 leading-relaxed font-medium reveal-element" style={{ animationDelay: '0.2s' }}>
              Detect systemic medicine shortages before they happen. Predict local demand spikes, reroute critical stock, and keep health systems running smoothly.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left reveal-element" style={{ animationDelay: '0.4s' }}>
              
              <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all shadow-xl group">
                <div className="bg-blue-950/80 p-3.5 rounded-xl border border-blue-900/50 group-hover:bg-blue-600/20 transition-colors">
                  <Map className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider mb-1">District-wide Tracking</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Monitor thousands of facilities in real-time with zero latency.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 hover:border-teal-500/50 hover:bg-slate-800/80 transition-all shadow-xl group">
                <div className="bg-teal-950/80 p-3.5 rounded-xl border border-teal-900/50 group-hover:bg-teal-600/20 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider mb-1">Automated Redistribution</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Instantly route surplus to critical shortages via AI.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all shadow-xl group">
                <div className="bg-indigo-950/80 p-3.5 rounded-xl border border-indigo-900/50 group-hover:bg-indigo-600/20 transition-colors">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider mb-1">Predictive Analytics</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Forecast shortages weeks in advance using machine learning.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all shadow-xl group">
                <div className="bg-emerald-950/80 p-3.5 rounded-xl border border-emerald-900/50 group-hover:bg-emerald-600/20 transition-colors">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider mb-1">Supplier Integration</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Seamlessly coordinate with regional suppliers to expedite.</p>
                </div>
              </div>

            </div>
            
            <div className="mt-12 reveal-element" style={{ animationDelay: '0.6s' }}>
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_50px_rgba(37,99,235,0.7)] transition-all"
              >
                Sign In <LogIn className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </>
        )}

        {/* Hidden placeholders to perfectly preserve the flex layout during animation so BEACON doesn't jump */}
        {isAnimating && (
          <div className="opacity-0 pointer-events-none select-none" aria-hidden="true">
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-6 mt-4">AI-Powered</h2>
            <p className="text-sm md:text-base lg:text-lg max-w-2xl mx-auto mb-16">Detect systemic medicine shortages before they happen.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-[200px]"></div>
            <div className="mt-12"><button className="px-10 py-4">Sign In</button></div>
          </div>
        )}

      </main>
    </div>
  );
};
