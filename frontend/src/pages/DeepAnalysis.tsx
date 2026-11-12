import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, Server, Zap, Globe, FileText, ChevronDown, ChevronUp, Download, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const DeepAnalysis = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/deep/full', { url }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
    } catch (err: any) {
      alert('Analysis failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!url) return;
    setIsGeneratingPdf(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/deep/report/pdf', { url }, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `optiweb-report-${Date.now()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert('PDF generation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getScoreColor = (score: number) => score > 80 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500';
  const getScoreBg = (score: number) => score > 80 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-red-500';
  const getImpactColor = (impact: string) => {
    const map: Record<string, string> = { critical: 'text-red-500 bg-red-500/10', high: 'text-orange-500 bg-orange-500/10', medium: 'text-yellow-500 bg-yellow-500/10', low: 'text-green-500 bg-green-500/10' };
    return map[impact] || 'text-gray-500 bg-gray-500/10';
  };
  const categoryIcons: Record<string, React.ReactNode> = {
    'Compression': <Server size={20} />, 'Caching': <Shield size={20} />, 'CDN': <Globe size={20} />,
    'Render Blocking': <Zap size={20} />, 'Resource Efficiency': <FileText size={20} />
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-neon-blue/15 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-neon-purple/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <header className="mb-12 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold mb-2 tracking-tight flex items-center gap-3">
                <Shield className="text-neon-purple" size={28} />
                Deep Performance Analysis
              </h2>
              <p className="text-gray-400">Comprehensive analysis: Compression, Caching, CDN, Render-blocking, Features & PDF Reports.</p>
            </div>
            {result && (
              <button onClick={handleDownloadPdf} disabled={isGeneratingPdf}
                className="flex items-center gap-2 bg-neon-purple text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-neon-purple/20">
                {isGeneratingPdf ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                {isGeneratingPdf ? 'Generating...' : 'Export PDF Report'}
              </button>
            )}
          </header>

          <form onSubmit={handleAnalyze} className="mb-12 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-blue rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
            <div className="relative flex bg-dark-card border border-dark-border rounded-2xl p-2 items-center">
              <Search className="text-gray-400 ml-4" />
              <input type="url" placeholder="https://your-website.com" value={url} onChange={e => setUrl(e.target.value)} required
                className="w-full bg-transparent border-none outline-none text-white px-4 py-3 placeholder-gray-500 font-medium" />
              <button type="submit" disabled={isAnalyzing}
                className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-neon-purple hover:text-white transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                {isAnalyzing ? <><Loader2 className="animate-spin" size={18} /> Running...</> : 'Deep Audit'}
              </button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-dark-border border-t-neon-purple rounded-full animate-spin"></div>
                  <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-purple animate-pulse" size={32} />
                </div>
                <h3 className="mt-8 text-xl font-bold">Running Deep Analysis...</h3>
                <p className="text-gray-500 mt-2">Inspecting compression, caching, CDN, render-blocking resources & more</p>
              </motion.div>
            ) : result && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                {/* Overall Score */}
                <div className="bg-dark-card border border-dark-border rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="relative w-40 h-40 flex-shrink-0">
                    <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#27272a" strokeWidth="8" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke={result.overall > 80 ? '#22c55e' : result.overall > 50 ? '#eab308' : '#ef4444'}
                        strokeWidth="8" strokeDasharray={`${(result.overall / 100) * 327} 327`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className={`text-4xl font-bold ${getScoreColor(result.overall)}`}>{result.overall}</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Score</span>
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold mb-2">Optimization Score</h3>
                    <p className="text-gray-400 mb-4">{result.summary}</p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      {result.categories.map((cat: any) => (
                        <span key={cat.name} className={`text-xs font-bold px-3 py-1 rounded-full ${getScoreBg(cat.score)}/10 ${getScoreColor(cat.score)}`}>
                          {cat.name}: {cat.score}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {result.categories.map((cat: any) => (
                    <button key={cat.name} onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
                      className={`bg-dark-card border ${expandedCategory === cat.name ? 'border-neon-purple' : 'border-dark-border'} rounded-2xl p-5 text-left hover:border-neon-purple/40 transition-all`}>
                      <div className="flex items-center gap-2 mb-3 text-gray-400">{categoryIcons[cat.name] || <Zap size={20} />}</div>
                      <span className={`text-2xl font-bold ${getScoreColor(cat.score)}`}>{cat.score}</span>
                      <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-wider">{cat.name}</p>
                      <p className="text-[10px] text-gray-600 mt-2 line-clamp-2">{cat.details}</p>
                    </button>
                  ))}
                </div>

                {/* Expanded Category Details */}
                <AnimatePresence>
                  {expandedCategory && result.details && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="bg-dark-card border border-dark-border rounded-3xl p-8 overflow-hidden">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-neon-purple">
                        {categoryIcons[expandedCategory]} {expandedCategory} — Detailed Report
                      </h3>
                      <DetailPanel category={expandedCategory} data={result.details} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Prioritized Actions */}
                {result.prioritizedActions && result.prioritizedActions.length > 0 && (
                  <div className="bg-dark-card border border-dark-border rounded-3xl p-8">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                      <Zap className="text-neon-purple" size={24} />
                      Prioritized Action Plan
                    </h3>
                    <div className="space-y-4">
                      {result.prioritizedActions.map((action: any) => (
                        <div key={action.priority} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-neon-purple/10 flex items-center justify-center text-neon-purple font-bold flex-shrink-0">
                            #{action.priority}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-bold text-white">{action.action}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getImpactColor(action.impact)}`}>{action.impact}</span>
                            </div>
                            <p className="text-sm text-gray-500">
                              <span className="text-gray-400">Effort:</span> {action.effort} · <span className="text-gray-400">Gain:</span> {action.estimatedGain}
                            </p>
                          </div>
                        </div>
                      ))}
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

/** Renders expanded detail panel for a category */
const DetailPanel = ({ category, data }: { category: string; data: any }) => {
  if (category === 'Compression' && data.compression) {
    const c = data.compression;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusBadge label="Gzip" value={c.gzip} />
          <StatusBadge label="Brotli" value={c.brotli} />
          <StatDisplay label="Encoding" value={c.contentEncoding || 'None'} />
          <StatDisplay label="Compression Ratio" value={c.compressionRatio !== null ? `${c.compressionRatio}%` : 'N/A'} />
        </div>
        {c.recommendations?.length > 0 && <RecList items={c.recommendations} />}
      </div>
    );
  }
  if (category === 'Caching' && data.caching) {
    const c = data.caching;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatDisplay label="Cache-Control" value={c.cacheControl || 'Missing'} />
          <StatusBadge label="ETag" value={c.etag} />
          <StatusBadge label="Last-Modified" value={c.lastModified} />
          <StatDisplay label="CDN Cache" value={c.cdnCache || 'None'} />
        </div>
        {c.policies?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-400">Cache Policies</h4>
            {c.policies.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm p-3 rounded-xl bg-white/[0.02]">
                {p.status === 'good' ? <CheckCircle size={14} className="text-green-500" /> : p.status === 'bad' ? <XCircle size={14} className="text-red-500" /> : <AlertTriangle size={14} className="text-yellow-500" />}
                <span className="font-mono text-gray-300">{p.directive}: {p.value}</span>
                <span className="text-gray-500 text-xs ml-auto">{p.explanation}</span>
              </div>
            ))}
          </div>
        )}
        {c.recommendations?.length > 0 && <RecList items={c.recommendations} />}
      </div>
    );
  }
  if (category === 'CDN' && data.cdn) {
    const c = data.cdn;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatusBadge label="CDN Detected" value={c.detected} />
          <StatDisplay label="Provider" value={c.provider || 'None'} />
          <StatDisplay label="Score" value={`${c.score}/100`} />
        </div>
        {c.features?.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {c.features.map((f: any, i: number) => (
              <div key={i} className={`p-3 rounded-xl border ${f.detected ? 'border-green-500/20 bg-green-500/5' : 'border-dark-border bg-white/[0.02]'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {f.detected ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-gray-600" />}
                  <span className="text-sm font-bold">{f.name}</span>
                </div>
                <p className="text-[10px] text-gray-500">{f.details}</p>
              </div>
            ))}
          </div>
        )}
        {c.recommendations?.length > 0 && <RecList items={c.recommendations} />}
      </div>
    );
  }
  if (category === 'Render Blocking' && data.renderBlocking) {
    const r = data.renderBlocking;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatDisplay label="Blocking Scripts" value={`${r.blockingScripts?.length || 0}`} />
          <StatDisplay label="Blocking CSS" value={`${r.blockingStylesheets?.length || 0}`} />
          <StatDisplay label="Total Blocking" value={`${r.totalBlockingResources}`} />
          <StatDisplay label="Est. Blocking Time" value={`${r.estimatedBlockingTime}ms`} />
        </div>
        {r.blockingScripts?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-red-400">Blocking Scripts</h4>
            {r.blockingScripts.map((s: any, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-sm">
                <p className="font-mono text-gray-300 truncate">{s.url}</p>
                <p className="text-xs text-gray-500 mt-1">{s.recommendation}</p>
              </div>
            ))}
          </div>
        )}
        {r.recommendations?.length > 0 && <RecList items={r.recommendations} />}
      </div>
    );
  }
  if (category === 'Resource Efficiency' && data.features) {
    const f = data.features;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatDisplay label="Scripts" value={`${f.resources?.totalScripts || 0}`} />
          <StatDisplay label="Stylesheets" value={`${f.resources?.totalStylesheets || 0}`} />
          <StatDisplay label="Images" value={`${f.resources?.totalImages || 0}`} />
          <StatDisplay label="3rd Party Domains" value={`${f.resources?.thirdPartyDomains?.length || 0}`} />
        </div>
        {f.technology && (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-dark-border">
            <h4 className="text-sm font-bold text-gray-400 mb-2">Detected Technology</h4>
            <div className="flex flex-wrap gap-2">
              {[...(f.technology.frameworks || []), ...(f.technology.libraries || []), ...(f.technology.analytics || [])].map((t: string, i: number) => (
                <span key={i} className="text-xs px-2 py-1 rounded-lg bg-neon-blue/10 text-neon-blue font-bold">{t}</span>
              ))}
              {f.technology.cms && <span className="text-xs px-2 py-1 rounded-lg bg-neon-purple/10 text-neon-purple font-bold">CMS: {f.technology.cms}</span>}
            </div>
          </div>
        )}
        {f.resources?.thirdPartyDomains?.length > 0 && (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-dark-border">
            <h4 className="text-sm font-bold text-gray-400 mb-2">Third-Party Domains</h4>
            <div className="flex flex-wrap gap-2">
              {f.resources.thirdPartyDomains.map((d: string, i: number) => (
                <span key={i} className="text-[11px] px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 font-mono">{d}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return <p className="text-gray-500">No detailed data available.</p>;
};

const StatusBadge = ({ label, value }: { label: string; value: boolean }) => (
  <div className={`p-3 rounded-xl border ${value ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
    <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">{label}</span>
    <div className="flex items-center gap-2">
      {value ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
      <span className={`font-bold ${value ? 'text-green-500' : 'text-red-500'}`}>{value ? 'Enabled' : 'Missing'}</span>
    </div>
  </div>
);

const StatDisplay = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 rounded-xl bg-white/[0.02] border border-dark-border">
    <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">{label}</span>
    <span className="text-sm font-mono text-gray-300 break-all">{value}</span>
  </div>
);

const RecList = ({ items }: { items: string[] }) => (
  <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
    <h4 className="text-sm font-bold text-yellow-500 mb-2 flex items-center gap-2"><AlertTriangle size={14} /> Recommendations</h4>
    <ul className="space-y-2">
      {items.map((r, i) => <li key={i} className="text-sm text-gray-400 flex gap-2"><span className="text-yellow-500 flex-shrink-0">→</span>{r}</li>)}
    </ul>
  </div>
);

export default DeepAnalysis;
