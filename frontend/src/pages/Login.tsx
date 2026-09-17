import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Map, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (loginEmail = email, loginPassword = password) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
      
      const data = await response.json();
      const token = data.access_token;
      
      // Decode JWT to get role
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;
      const user = {
        id: '',
        email: loginEmail,
        role,
        reference_id: ''
      };
      
      login(token, user);
      
      if (role === 'consumer') navigate('/consumer');
      else if (role === 'supplier') navigate('/supplier');
      else navigate('/');
      
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen flex bg-medical-theme relative overflow-hidden font-sans">
      {/* Animated background orbs covering the whole page */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-[pulse_5s_ease-in-out_infinite] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-400 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-[pulse_6s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-cyan-400 rounded-full mix-blend-screen filter blur-[90px] opacity-30 animate-[pulse_7s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-35 animate-[pulse_4s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-[50%] left-[50%] w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-[pulse_8s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: '1.5s' }}></div>

      {/* Centered Login Pane */}
      <div className="w-full flex flex-col justify-center items-center px-4 sm:px-8 relative z-10">
        
        {/* Brand Header */}
        <div className="flex items-center justify-center mb-8">
          <span 
            className="text-5xl font-serif italic font-bold uppercase"
            style={{
              color: '#ffffff',
              textShadow: '-3px 0px 0px rgba(56,189,248,0.9), 3px 0px 0px rgba(192,38,211,0.9)',
              letterSpacing: '0.02em'
            }}
          >
            Beacon
          </span>
        </div>

        <div className="max-w-md w-full bg-slate-900/70 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-slate-700/50 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight text-center">Welcome back</h2>
          <p className="text-slate-400 mb-8 text-center text-sm font-medium">Sign in to your account to continue.</p>

          {/* Hackathon Demo Logins */}
          <div className="mb-8 pb-8 border-b border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4 text-center">Quick Demo Access</p>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleLogin('admin@beacon.com', 'password')}
                disabled={isLoading}
                className="flex flex-col items-center p-3 bg-slate-950/80 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition group text-center"
              >
                <span className="text-sm font-semibold text-white">Admin</span>
                <span className="text-[10px] text-slate-500 font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-full">System</span>
              </button>
              <button 
                onClick={() => handleLogin('staff@fac-001.com', 'password')}
                disabled={isLoading}
                className="flex flex-col items-center p-3 bg-slate-950/80 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition group text-center"
              >
                <span className="text-sm font-semibold text-white">Clinic</span>
                <span className="text-[10px] text-slate-500 font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-full">FAC-001</span>
              </button>
              <button 
                onClick={() => handleLogin('admin@sup-01.com', 'password')}
                disabled={isLoading}
                className="flex flex-col items-center p-3 bg-slate-950/80 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition group text-center"
              >
                <span className="text-sm font-semibold text-white">Supplier</span>
                <span className="text-[10px] text-slate-500 font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-full">SUP-01</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-fuchsia-950 border border-fuchsia-800 text-fuchsia-400 text-sm rounded-lg font-medium text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Email address</label>
              <input 
                type="email" 
                required
                className="block w-full rounded-xl border-slate-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3.5 bg-slate-950/80 text-white sm:text-sm transition placeholder-slate-600 outline-none" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <input 
                type="password" 
                required
                className="block w-full rounded-xl border-slate-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3.5 bg-slate-950/80 text-white sm:text-sm transition placeholder-slate-600 outline-none" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="mt-2 w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg shadow-blue-900/20 text-sm font-bold uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
