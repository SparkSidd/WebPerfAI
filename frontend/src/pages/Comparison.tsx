import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const Comparison = () => {
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url1 || !url2) return;
    setIsComparing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/analysis/compare', { url1, url2 }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setResult({
        site1: { name: url1, score: data.site1.score, lcp: `${(data.site1.metrics.lcp / 1000).toFixed(2)}s`, ttfb: `${(data.site1.metrics.ttfb).toFixed(0)}ms` },
        site2: { name: url2, score: data.site2.score, lcp: `${(data.site2.metrics.lcp / 1000).toFixed(2)}s`, ttfb: `${(data.site2.metrics.ttfb).toFixed(0)}ms` },
        winner: data.site1.score >= data.site2.score ? 'site1' : 'site2'
      });
    } catch (err: any) {
      console.error(err);
      alert('Comparison failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12">
            <h2 className="text-3xl font-bold mb-2">Competitive Benchmarking</h2>
            <p className="text-gray-400">See how you stack up against the competition.</p>
          </header>

          <form onSubmit={handleCompare} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-dark-card border border-dark-border p-4 rounded-2xl">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Your Website</label>
               <input 
                type="url" 
                className="w-full bg-transparent border-none outline-none text-white px-2 py-2" 
                placeholder="https://yoursite.com"
                value={url1}
                onChange={e => setUrl1(e.target.value)}
                required
               />
            </div>
            <div className="bg-dark-card border border-dark-border p-4 rounded-2xl">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Competitor Website</label>
               <input 
                type="url" 
                className="w-full bg-transparent border-none outline-none text-white px-2 py-2" 
                placeholder="https://competitor.com"
                value={url2}
                onChange={e => setUrl2(e.target.value)}
                required
               />
            </div>
            <div className="md:col-span-2 flex justify-center">
               <button 
                type="submit" 
                className="bg-neon-blue text-black px-12 py-4 rounded-xl font-bold hover:scale-105 transition-transform"
                disabled={isComparing}
               >
                {isComparing ? 'Running Side-by-Side Audit...' : 'Compare Now'}
               </button>
            </div>
          </form>

          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white text-black rounded-full flex items-center justify-center font-bold text-xl z-20 border-4 border-[#050505] shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  <ArrowLeftRight size={24} />
               </div>
               
               <CompareCard data={result.site1} isWinner={result.winner === 'site1'} />
               <CompareCard data={result.site2} isWinner={result.winner === 'site2'} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const CompareCard = ({ data, isWinner }: { data: any, isWinner?: boolean }) => (
  <motion.div initial={{ opacity: 0, x: isWinner ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`bg-dark-card border ${isWinner ? 'border-neon-blue' : 'border-dark-border'} rounded-3xl p-8 relative overflow-hidden`}>
    {isWinner && <div className="absolute top-4 right-4 bg-neon-blue text-black px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Winning</div>}
    <h3 className="text-xl font-bold mb-8">{data.name}</h3>
    
    <div className="space-y-6">
       <div className="flex justify-between items-center border-b border-dark-border pb-4">
          <span className="text-gray-400 font-medium">Performance Score</span>
          <span className={`text-2xl font-bold ${data.score > 80 ? 'text-green-500' : 'text-yellow-500'}`}>{data.score}</span>
       </div>
       <div className="flex justify-between items-center border-b border-dark-border pb-4">
          <span className="text-gray-400 font-medium">LCP</span>
          <span className="font-mono">{data.lcp}</span>
       </div>
       <div className="flex justify-between items-center border-b border-dark-border pb-4">
          <span className="text-gray-400 font-medium">TTFB</span>
          <span className="font-mono">{data.ttfb}</span>
       </div>
    </div>
  </motion.div>
);

export default Comparison;
