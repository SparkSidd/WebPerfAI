import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Shield } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { username: name, email, password };
      
      const res = await axios.post(`http://localhost:5000${endpoint}`, payload);
      
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050505]">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-blue/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-neon-purple/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_30px_rgba(188,19,254,0.5)] mb-6">
            <Activity size={32} color="white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">OptiWeb AI</h1>
          <p className="text-gray-400 text-center">Sign in to your performance dashboard</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">{error}</div>}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111113] border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-blue transition-colors"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111113] border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-blue transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111113] border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-blue transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button disabled={isLoading} type="submit" className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-50">
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')} <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-dark-border/50 text-center">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-3">Development Mode</p>
            <button 
              onClick={() => {
                localStorage.setItem('token', 'developer-token');
                navigate('/dashboard');
              }}
              className="w-full bg-white/5 border border-white/10 text-gray-300 font-medium py-3 rounded-xl hover:bg-white/10 transition-all flex justify-center items-center gap-2"
            >
              Developer Quick Start <Shield size={16} className="text-neon-blue" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
