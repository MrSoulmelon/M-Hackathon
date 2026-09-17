import React, { useEffect, useState, useMemo } from 'react';

export const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, 2500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Generate some random particles, keeping them within the beam width
  const particles = useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${46 + Math.random() * 8}%`, // 46% to 54%, tightly grouped around the center
    animationDuration: `${1 + Math.random() * 1.5}s`,
    animationDelay: `${Math.random() * 2}s`,
    size: `${2 + Math.random() * 4}px`,
  })), []);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-end bg-[#020617] transition-opacity duration-700 overflow-hidden ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          70% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) scale(0.3);
            opacity: 0;
          }
        }
        @keyframes beamPulse {
          0%, 100% {
            opacity: 0.8;
            filter: blur(20px);
          }
          50% {
            opacity: 1;
            filter: blur(30px);
          }
        }
      `}</style>

      {/* Main Wide Glow Beam */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 h-[120vh] bg-gradient-to-t from-blue-600 via-cyan-500/30 to-transparent"
        style={{
          animation: 'beamPulse 3s ease-in-out infinite',
          boxShadow: '0 0 120px 30px rgba(59,130,246, 0.4)'
        }}
      ></div>
      
      {/* Intense Inner Core of the Beam */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[100vh] bg-gradient-to-t from-white via-cyan-200 to-transparent blur-md opacity-90"
      ></div>

      {/* Particles Stream */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
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

      {/* Emitter Base */}
      <div className="relative z-10 w-80 h-24 mb-[-3.5rem] bg-slate-900 rounded-[100%] border-t-[8px] border-cyan-400 shadow-[0_-30px_80px_rgba(34,211,238,0.7)] flex flex-col items-center justify-start pt-3">
        <div className="w-32 h-6 bg-white rounded-[100%] blur-lg opacity-90"></div>
      </div>

      {/* Text overlay matching Landing page layout perfectly */}
      <div className="absolute inset-0 flex flex-col z-20 pointer-events-none">
        {/* Invisible header spacer to perfectly match the header offset in Landing.tsx */}
        <div className="w-full p-6 sm:px-10 h-[88px] invisible"></div>
        
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 w-full text-center mt-[-5vh]">
          <h1 
            className="text-7xl md:text-8xl lg:text-[10rem] font-serif italic font-bold uppercase translate-y-[25vh] scale-110"
            style={{
              color: '#ffffff',
              textShadow: '-6px 0px 0px rgba(56,189,248,0.9), 6px 0px 0px rgba(192,38,211,0.9)',
              letterSpacing: '0.02em'
            }}
          >
            Beacon
          </h1>
        </div>
      </div>
    </div>
  );
};
