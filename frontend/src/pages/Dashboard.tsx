import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, AlertTriangle, XCircle, Code, Info, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import WaterfallChart from '../components/WaterfallChart';
import { PieChart, Pie, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [expandedRec, setExpandedRec] = useState<number | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/analysis/analyze', { url }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult({
        ...res.data,
        predictedScore: Math.min(100, res.data.score + (res.data.recommendations.reduce((acc: number, r: any) => acc + (r.predictedImprovement || 0), 0)))
      });
    } catch (err: any) {
      console.error(err);
      alert('Analysis failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-neon-purple/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <header className="mb-12 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold mb-2 tracking-tight">AI Performance Dashboard</h2>
              <p className="text-gray-400">Enterprise-grade performance auditing for the modern web.</p>
            </div>
            <div className="hidden md:flex gap-4">
              <div className="bg-dark-card border border-dark-border px-4 py-2 rounded-xl text-xs font-medium text-gray-400">
                PRO PLAN ACTIVE
              </div>
            </div>
          </header>

          <form onSubmit={handleAnalyze} className="mb-12 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
            <div className="relative flex bg-dark-card border border-dark-border rounded-2xl p-2 items-center">
              <Search className="text-gray-400 ml-4" />
              <input 
                type="url" 
                placeholder="https://your-website.com" 
                className="w-full bg-transparent border-none outline-none text-white px-4 py-3 placeholder-gray-500 font-medium"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button 
                type="submit" 
                disabled={isAnalyzing}
                className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-neon-blue hover:text-black transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isAnalyzing ? "Analyzing..." : "Run Audit"}
              </button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 border-4 border-dark-border border-t-neon-blue rounded-full animate-spin mb-6"></div>
                <div className="flex gap-2">
                   <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}>Inspecting network layers...</motion.span>
                </div>
              </motion.div>
            ) : result && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Performance Gauge */}
                  <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-3xl p-8 flex items-center gap-8 relative overflow-hidden">
                    <div className="w-40 h-40 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { value: result.score, fill: result.score > 80 ? '#22c55e' : result.score > 50 ? '#eab308' : '#ef4444' },
                              { value: 100 - result.score, fill: '#27272a' }
                            ]}
                            innerRadius={55}
                            outerRadius={75}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-4xl font-bold">{result.score}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Score</span>
                      </div>
                    </div>
                    <div className="flex-1">
                       <h3 className="text-xl font-bold mb-1">Optimization Potential</h3>
                       <p className="text-gray-400 text-sm mb-4">Fixing the top 3 issues can boost your score to <span className="text-neon-blue font-bold">{result.predictedScore}</span>.</p>
                       <div className="h-2 w-full bg-dark-border rounded-full overflow-hidden">
                          <div className="h-full bg-neon-blue" style={{ width: '72%' }}></div>
                       </div>
                    </div>
                  </div>

                  <StatCard title="LCP" value={`${(result.metrics.lcp / 1000).toFixed(2)}s`} sub="Ideal < 2.5s" status={result.metrics.lcp < 2500 ? 'good' : result.metrics.lcp < 4000 ? 'warning' : 'poor'} />
                  <StatCard title="TTFB" value={`${result.metrics.ttfb.toFixed(0)}ms`} sub="Ideal < 800ms" status={result.metrics.ttfb < 800 ? 'good' : result.metrics.ttfb < 1800 ? 'warning' : 'poor'} />
                </div>

                {/* Extended Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="FCP" value={`${(result.metrics.fcp / 1000).toFixed(2)}s`} sub="Ideal < 1.8s" status={result.metrics.fcp < 1800 ? 'good' : result.metrics.fcp < 3000 ? 'warning' : 'poor'} />
                  <StatCard title="CLS" value={result.metrics.cls.toFixed(3)} sub="Ideal < 0.1" status={result.metrics.cls < 0.1 ? 'good' : result.metrics.cls < 0.25 ? 'warning' : 'poor'} />
                  {result.metrics.tbt !== undefined && <StatCard title="TBT" value={`${result.metrics.tbt.toFixed(0)}ms`} sub="Ideal < 200ms" status={result.metrics.tbt < 200 ? 'good' : result.metrics.tbt < 600 ? 'warning' : 'poor'} />}
                  {result.metrics.si !== undefined && <StatCard title="Speed Index" value={`${(result.metrics.si / 1000).toFixed(2)}s`} sub="Ideal < 3.4s" status={result.metrics.si < 3400 ? 'good' : result.metrics.si < 5800 ? 'warning' : 'poor'} />}
                </div>

                {/* AI Recommendations */}
                <div className="bg-dark-card border border-dark-border rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Zap className="text-neon-purple" size={24} />
                      <h3 className="text-2xl font-bold">Smart Optimization Plan</h3>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">PRIORITIZED BY IMPACT</div>
                  </div>
                  
                  <div className="space-y-4">
                    {result.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="border border-dark-border rounded-2xl overflow-hidden bg-[#0a0a0c]">
                        <button 
                          onClick={() => setExpandedRec(expandedRec === idx ? null : idx)}
                          className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
                        >
                          <div className={`p-2 rounded-lg ${rec.impact === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            {rec.impact === 'High' ? <XCircle size={20} /> : <AlertTriangle size={20} />}
                          </div>
                          <div className="flex-1">
                             <div className="flex items-center gap-3">
                                <h4 className="font-bold">{rec.issue}</h4>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-400 font-bold uppercase tracking-wider">Impact: {rec.impactScore}</span>
                             </div>
                          </div>
                          {expandedRec === idx ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                        </button>

                        <AnimatePresence>
                          {expandedRec === idx && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-dark-border">
                               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div>
                                     <div className="flex items-center gap-2 mb-2 text-neon-blue">
                                        <Info size={16} />
                                        <span className="text-sm font-bold uppercase">AI Insight</span>
                                     </div>
                                     <p className="text-gray-400 text-sm leading-relaxed mb-4">{rec.explanation}</p>
                                     <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                                        <span className="text-xs font-bold text-green-500 uppercase tracking-widest block mb-1">Expected Gain</span>
                                        <p className="text-sm font-medium text-green-400">+12% Performance Score</p>
                                     </div>
                                  </div>
                                  <div>
                                     <div className="flex items-center gap-2 mb-2 text-neon-purple">
                                        <Code size={16} />
                                        <span className="text-sm font-bold uppercase">Implementation</span>
                                     </div>
                                     <pre className="p-4 rounded-xl bg-black border border-dark-border overflow-x-auto text-[13px] text-gray-300 font-mono">
                                        {rec.codeSnippet}
                                     </pre>
                                  </div>
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Network Waterfall */}
                {result.networkRequests && result.networkRequests.length > 0 && (
                  <WaterfallChart requests={result.networkRequests} />
                )}

                {/* Additional Audits */}
                {result.additionalChecks && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div className="bg-dark-card border border-dark-border rounded-3xl p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                           <Zap className="text-neon-blue" size={20} />
                           Security Audit
                        </h3>
                        <div className="space-y-4">
                           <CheckItem label="Content Security Policy" status={result.additionalChecks.security?.csp} />
                           <CheckItem label="HSTS Enabled" status={result.additionalChecks.security?.hsts} />
                           <CheckItem label="X-Frame-Options" status={result.additionalChecks.security?.xframe} />
                           <CheckItem label="X-Content-Type-Options" status={result.additionalChecks.security?.nosniff} />
                        </div>
                     </div>
                     <div className="bg-dark-card border border-dark-border rounded-3xl p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                           <Search className="text-neon-purple" size={20} />
                           SEO Baseline
                        </h3>
                        <div className="space-y-4">
                           <CheckItem label="Title Tag Present" status={result.additionalChecks.seo?.hasTitle} />
                           <CheckItem label="Meta Description" status={result.additionalChecks.seo?.hasMetaDesc} />
                           <CheckItem label="H1 Header Found" status={result.additionalChecks.seo?.hasH1} />
                           <CheckItem label="Canonical URL" status={result.additionalChecks.seo?.hasCanonical} />
                           <CheckItem label="Open Graph Tags" status={result.additionalChecks.seo?.hasOpenGraph} />
                        </div>
                     </div>
                     <div className="bg-dark-card border border-dark-border rounded-3xl p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                           <Zap className="text-neon-purple" size={20} />
                           Delivery & Caching
                        </h3>
                        <div className="space-y-4">
                           <CheckItem label="Gzip Compression" status={result.additionalChecks.compression?.gzip} />
                           <CheckItem label="Brotli Compression" status={result.additionalChecks.compression?.brotli} />
                           <CheckItem label="Cache-Control Headers" status={result.additionalChecks.caching?.cacheControl} />
                           <CheckItem label="ETag Validation" status={result.additionalChecks.caching?.hasEtag} />
                           {result.additionalChecks.performance?.hasPreconnect !== undefined && <CheckItem label="Preconnect Hints" status={result.additionalChecks.performance.hasPreconnect} />}
                           {result.additionalChecks.performance?.hasPreload !== undefined && <CheckItem label="Preload Hints" status={result.additionalChecks.performance.hasPreload} />}
                        </div>
                     </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, sub, status }: { title: string, value: string, sub: string, status: 'good' | 'warning' | 'poor' }) => {
  const colors = {
    good: 'text-green-500',
    warning: 'text-yellow-500',
    poor: 'text-red-500',
  };
  return (
    <div className="bg-dark-card border border-dark-border rounded-3xl p-6 flex flex-col justify-between">
       <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">{title}</span>
       <div className="my-2">
          <span className={`text-3xl font-bold ${colors[status]}`}>{value}</span>
       </div>
       <span className="text-[10px] text-gray-500 font-medium">{sub}</span>
    </div>
  );
}

const CheckItem = ({ label, status }: { label: string, status: boolean }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
       <span className="text-sm font-medium text-gray-300">{label}</span>
       {status ? (
          <div className="flex items-center gap-2 text-green-500 text-xs font-bold">
             <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle size={14} />
             </div>
             PASSED
          </div>
       ) : (
          <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
             <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle size={14} />
             </div>
             MISSING
          </div>
       )}
    </div>
);

export default Dashboard;
