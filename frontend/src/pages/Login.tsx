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
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Pane - Branding & Value Prop */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Subtle background glow/gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-16">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ShortageWatch</span>
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            AI-Powered <br/>
            <span className="text-blue-400">Supply Chain Triage</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-md leading-relaxed mb-12">
            Detect systemic medicine shortages before they happen. Predict local demand spikes, reroute critical stock, and keep health systems running smoothly.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <Map className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">District-wide Tracking</h3>
                <p className="text-sm text-slate-400">Monitor thousands of facilities in real-time.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <ShieldCheck className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Automated Redistribution</h3>
                <p className="text-sm text-slate-400">Instantly route surplus to critical shortages.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 relative">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ShortageWatch</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Welcome back</h2>
          <p className="text-slate-500 mb-8">Sign in to your account to continue.</p>

          {/* Hackathon Demo Logins */}
          <div className="mb-10 pb-8 border-b border-slate-200">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleLogin('admin@shortagewatch.com', 'password')}
                disabled={isLoading}
                className="flex flex-col items-start p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition group text-left"
              >
                <span className="text-sm font-semibold text-slate-900">Admin Dashboard</span>
                <span className="text-xs text-slate-500">System oversight</span>
              </button>
              <button 
                onClick={() => handleLogin('staff@fac-001.com', 'password')}
                disabled={isLoading}
                className="flex flex-col items-start p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition group text-left"
              >
                <span className="text-sm font-semibold text-slate-900">Clinic Portal</span>
                <span className="text-xs text-slate-500">FAC-001 (Downtown)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg font-medium">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">Email address</label>
              <input 
                type="email" 
                required
                className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 bg-slate-50 sm:text-sm transition" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">Password</label>
              <input 
                type="password" 
                required
                className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 bg-slate-50 sm:text-sm transition" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <span className="text-sm text-slate-500">Don't have an account? </span>
            <a href="/register" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
              Contact administrator
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
