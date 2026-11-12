import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, FileText, ChevronRight, Download, Activity, Calendar, Globe, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

interface SavedReport {
  _id: string;
  url: string;
  score: number;
  createdAt: string;
  metrics: {
    lcp: number;
    fcp: number;
    cls: number;
    ttfb: number;
  };
}

const Reports = () => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/analysis/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (err: any) {
      console.error('Failed to fetch history', err);
      // Mock data fallback if backend is down or no db
      setReports([
        { _id: '1', url: 'https://example.com', score: 85, createdAt: new Date().toISOString(), metrics: { lcp: 1200, fcp: 800, cls: 0.05, ttfb: 200 } },
        { _id: '2', url: 'https://slow-site.com', score: 45, createdAt: new Date(Date.now() - 86400000).toISOString(), metrics: { lcp: 3500, fcp: 2000, cls: 0.3, ttfb: 1200 } }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPdf = async (url: string) => {
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
    } catch (err) {
      alert('Failed to generate PDF. Make sure backend is running.');
    }
  };

  const getScoreColor = (score: number) => score > 80 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-[20%] right-[-100px] w-96 h-96 bg-neon-purple/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <FileText className="text-neon-purple" size={28} />
                My Reports & History
              </h2>
              <p className="text-gray-400 mt-2">Access your past performance audits and download detailed PDF reports.</p>
            </div>
            <button onClick={fetchHistory} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 border border-white/10">
              <History size={16} /> Refresh
            </button>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-dark-border border-t-neon-blue rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Loading your reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-dark-card border border-dark-border rounded-3xl p-16 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity size={32} className="text-gray-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">No reports found</h3>
              <p className="text-gray-400 mb-6">You haven't run any performance audits yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {reports.map((report) => (
                  <motion.div 
                    key={report._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-dark-card border border-dark-border rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 hover:border-neon-purple/30 transition-colors"
                  >
                    <div className="flex-shrink-0 w-16 h-16 rounded-full border-4 border-dark-bg flex items-center justify-center relative overflow-hidden">
                      <div className={`absolute inset-0 opacity-20 ${report.score > 80 ? 'bg-green-500' : report.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      <span className={`text-xl font-black ${getScoreColor(report.score)} z-10`}>{report.score}</span>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2 mb-1">
                        <Globe size={16} className="text-gray-500" />
                        {report.url}
                      </h4>
                      <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-gray-400 font-medium">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(report.createdAt).toLocaleDateString()}</span>
                        <span>LCP: {(report.metrics.lcp / 1000).toFixed(1)}s</span>
                        <span>TTFB: {Math.round(report.metrics.ttfb)}ms</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => downloadPdf(report.url)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-neon-purple/10 text-neon-purple border border-neon-purple/20 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-neon-purple hover:text-white transition-all"
                      >
                        <Download size={16} /> PDF
                      </button>
                      <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-neon-blue transition-all">
                        View <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reports;
