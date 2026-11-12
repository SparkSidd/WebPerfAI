import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Zap, Copy, Check, Info, Loader2, RotateCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const CodeOptimizer = () => {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'javascript' | 'css' | 'html'>('javascript');
  const [stats, setStats] = useState<any>(null);

  const handleOptimize = async () => {
    if (!inputCode) return;
    setIsOptimizing(true);
    setStats(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/optimize/code', { 
        code: inputCode, 
        type: mode 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOutputCode(res.data.optimizedCode);
      setStats(res.data.stats);
    } catch (err: any) {
      console.error(err);
      alert('Optimization failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-neon-blue/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <header className="mb-10 flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black mb-2 tracking-tight flex items-center gap-3">
                <Code className="text-neon-blue" size={32} />
                Code Laboratory
              </h2>
              <p className="text-gray-400">Enterprise-grade minification and code refactoring engine.</p>
            </div>
            
            <div className="flex bg-dark-card border border-dark-border rounded-xl p-1">
                {(['javascript', 'css', 'html'] as const).map(m => (
                    <button 
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${mode === m ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        {m}
                    </button>
                ))}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3 px-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Info size={14} /> Source Code
                    </span>
                    <button onClick={() => setInputCode('')} className="text-gray-500 hover:text-white transition-colors">
                        <RotateCcw size={16} />
                    </button>
                </div>
                <div className="flex-1 bg-dark-card border border-dark-border rounded-3xl p-6 relative group">
                    <textarea 
                        className="w-full h-full bg-transparent border-none outline-none text-gray-300 font-mono text-sm resize-none scrollbar-hide"
                        placeholder={`// Paste your ${mode} code here...`}
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                    />
                    <div className="absolute bottom-6 right-6">
                        <button 
                            onClick={handleOptimize}
                            disabled={!inputCode || isOptimizing}
                            className="bg-neon-blue text-black p-4 rounded-2xl font-bold shadow-lg shadow-neon-blue/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isOptimizing ? <Loader2 className="animate-spin" /> : <Zap size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3 px-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} className="text-neon-purple" /> Optimized Result
                    </span>
                    {outputCode && (
                        <button onClick={handleCopy} className="flex items-center gap-2 text-xs font-bold text-neon-blue hover:brightness-110 transition-all">
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? "COPIED" : "COPY CODE"}
                        </button>
                    )}
                </div>
                <div className="flex-1 bg-black border border-dark-border rounded-3xl p-6 relative overflow-hidden">
                    {!outputCode && !isOptimizing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                            <Code size={48} className="mb-4 opacity-10" />
                            <p className="text-sm font-medium">Waiting for input...</p>
                        </div>
                    )}
                    {isOptimizing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                            <Loader2 size={32} className="text-neon-blue animate-spin mb-4" />
                            <p className="text-neon-blue font-bold animate-pulse">Running Terser Engine...</p>
                        </div>
                    )}
                    <pre className="w-full h-full text-gray-400 font-mono text-sm overflow-auto scrollbar-hide">
                        {outputCode}
                    </pre>
                </div>
            </div>
          </div>

          <AnimatePresence>
            {stats && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatBox title="Original Size" value={`${stats.originalSize} B`} />
                    <StatBox title="Optimized Size" value={`${stats.optimizedSize} B`} color="text-green-400" />
                    <StatBox title="Reduction" value={`${stats.reduction}%`} color="text-neon-blue" />
                    <StatBox title="Execution" value={`${stats.time}ms`} />
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const StatBox = ({ title, value, color = "text-white" }: any) => (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">{title}</span>
        <span className={`text-2xl font-mono font-bold ${color}`}>{value}</span>
    </div>
);

export default CodeOptimizer;
