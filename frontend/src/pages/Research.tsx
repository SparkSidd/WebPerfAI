import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Sparkles, ArrowRight, Loader2, Info, Zap } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const Research = () => {
  const [query, setQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchData, setResearchData] = useState<any>(null);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setIsResearching(true);
    setResearchData(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/research/query', { query }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResearchData(res.data);
    } catch (err: any) {
      console.error(err);
      alert('Research failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-neon-blue/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <header className="mb-12">
            <h2 className="text-4xl font-black mb-3 tracking-tight flex items-center gap-3">
              <BookOpen className="text-neon-blue" size={32} />
              Performance Research
            </h2>
            <p className="text-gray-400 text-lg">Query the AI for deep insights into modern web performance trends, protocols, and best practices.</p>
          </header>

          <form onSubmit={handleResearch} className="mb-12 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
            <div className="relative flex bg-dark-card border border-dark-border rounded-2xl p-2 items-center">
              <Search className="text-gray-400 ml-4" />
              <input 
                type="text" 
                placeholder="e.g., How does HTTP/3 impact LCP? or Best practices for font loading..." 
                className="w-full bg-transparent border-none outline-none text-white px-4 py-4 placeholder-gray-500 font-medium"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
              <button 
                type="submit" 
                disabled={isResearching}
                className="bg-neon-blue text-black px-8 py-4 rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isResearching ? <Loader2 className="animate-spin" /> : "Consult AI"}
              </button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {isResearching ? (
              <motion.div 
                key="loading" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="flex flex-col items-center justify-center py-20 bg-dark-card/50 border border-dark-border rounded-3xl"
              >
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-dark-border border-t-neon-blue rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-purple animate-pulse" size={32} />
                </div>
                <h3 className="mt-8 text-xl font-bold">Scanning Web Standards...</h3>
                <p className="text-gray-500 mt-2">Aggregating latest research and performance benchmarks.</p>
              </motion.div>
            ) : researchData ? (
              <motion.div 
                key="result" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-8"
              >
                <div className="bg-dark-card border border-dark-border rounded-3xl p-8 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4">
                      <Sparkles className="text-neon-purple opacity-20 group-hover:opacity-100 transition-opacity" size={24} />
                   </div>
                   <h3 className="text-2xl font-bold mb-6 text-neon-blue">Analysis Summary</h3>
                   <div className="prose prose-invert max-w-none">
                      {researchData.answer.split('\n').map((para: string, i: number) => (
                        <p key={i} className="text-gray-300 leading-relaxed mb-4">{para}</p>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                         <Info size={18} className="text-neon-blue" />
                         Key Takeaways
                      </h4>
                      <ul className="space-y-3">
                         {researchData.takeaways.map((item: string, i: number) => (
                           <li key={i} className="flex gap-3 text-sm text-gray-400">
                              <ArrowRight size={16} className="text-neon-purple flex-shrink-0 mt-1" />
                              {item}
                           </li>
                         ))}
                      </ul>
                   </div>
                   <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                         <Sparkles size={18} className="text-neon-purple" />
                         Next Steps
                      </h4>
                      <ul className="space-y-3">
                         {researchData.nextSteps.map((item: string, i: number) => (
                           <li key={i} className="flex gap-3 text-sm text-gray-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-neon-blue mt-2 flex-shrink-0"></div>
                              {item}
                           </li>
                         ))}
                      </ul>
                   </div>
                </div>
              </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <SuggestionCard icon={<Zap className="text-yellow-500" />} title="LCP Optimizations" query="Best practices for improving Largest Contentful Paint in 2024" onClick={setQuery} />
                   <SuggestionCard icon={<Search className="text-neon-blue" />} title="Font Loading" query="How to optimize font loading for zero CLS" onClick={setQuery} />
                   <SuggestionCard icon={<BookOpen className="text-neon-purple" />} title="Edge Computing" query="Impact of Edge Computing on TTFB" onClick={setQuery} />
                </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const SuggestionCard = ({ icon, title, query, onClick }: any) => (
    <button 
        onClick={() => onClick(query)}
        className="bg-dark-card border border-dark-border p-6 rounded-2xl text-left hover:border-neon-blue/40 transition-all hover:-translate-y-1"
    >
        <div className="mb-4">{icon}</div>
        <h4 className="font-bold mb-2">{title}</h4>
        <p className="text-xs text-gray-500 line-clamp-2">{query}</p>
    </button>
);

export default Research;
