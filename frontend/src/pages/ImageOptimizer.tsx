import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Download, CheckCircle, Loader2, Zap } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const ImageOptimizer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState<any>(null);
  const [selectedFormat, setSelectedFormat] = useState('webp');
  const [quality, setQuality] = useState(80);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setOptimizedResult(null);
    }
  };

  const handleOptimize = async () => {
    if (!file) return;
    setIsOptimizing(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('format', selectedFormat);
    formData.append('quality', String(quality));

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/optimize/image', formData, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
      });
      setOptimizedResult(res.data);
    } catch (err: any) {
      console.error(err);
      alert('Optimization failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-neon-purple/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <header className="mb-12 text-center">
            <h2 className="text-4xl font-black mb-3 tracking-tight">Smart Image Optimizer</h2>
            <p className="text-gray-400 text-lg">Compress and convert images to next-gen formats (WebP/AVIF) without losing quality.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-dark-border rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-neon-blue transition-colors bg-dark-card/30 group"
                >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="text-gray-400 group-hover:text-neon-blue" />
                    </div>
                    <p className="font-bold text-gray-300">Drop your image here</p>
                    <p className="text-xs text-gray-500 mt-2 text-center">Supports PNG, JPG, WebP, TIFF. Max 10MB.</p>
                </div>

                {preview && (
                    <div className="bg-dark-card border border-dark-border rounded-3xl p-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Original Preview</h3>
                        <div className="aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                            <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="mt-4 flex justify-between items-center text-sm">
                            <span className="text-gray-400">{file?.name}</span>
                            <span className="font-mono text-gray-500">{(file!.size / 1024).toFixed(1)} KB</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className="bg-dark-card border border-dark-border rounded-3xl p-8 h-full flex flex-col">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <ImageIcon size={20} className="text-neon-purple" />
                        Optimization Settings
                    </h3>
                    
                    <div className="space-y-6 flex-grow">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Format Output</label>
                            <div className="grid grid-cols-4 gap-3">
                                {[{ label: 'WebP', value: 'webp' }, { label: 'AVIF', value: 'avif' }, { label: 'JPEG', value: 'jpeg' }, { label: 'PNG', value: 'png' }].map(f => (
                                    <button key={f.value} onClick={() => setSelectedFormat(f.value)}
                                        className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${selectedFormat === f.value ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                            {selectedFormat === 'avif' && (
                              <p className="text-[10px] text-neon-purple mt-2">⚡ AVIF offers ~50% smaller files than JPEG at similar quality</p>
                            )}
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Quality ({quality}%)</label>
                            <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))}
                              className="w-full h-1.5 bg-dark-border rounded-lg appearance-none cursor-pointer accent-neon-blue" />
                            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                              <span>Smaller file</span>
                              <span>Higher quality</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.02] border border-dark-border">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Format Comparison</h4>
                          <div className="space-y-1.5 text-xs text-gray-400">
                            <p><span className="text-neon-blue font-bold">WebP</span> — 25-35% smaller than JPEG, great browser support</p>
                            <p><span className="text-neon-purple font-bold">AVIF</span> — 50% smaller than JPEG, newer format, growing support</p>
                            <p><span className="text-gray-300 font-bold">JPEG</span> — Universal support, MozJPEG optimization</p>
                            <p><span className="text-gray-300 font-bold">PNG</span> — Lossless, best for graphics with transparency</p>
                          </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleOptimize}
                        disabled={!file || isOptimizing}
                        className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg hover:bg-neon-blue transition-all disabled:opacity-50 mt-8 flex items-center justify-center gap-3 shadow-lg shadow-white/5"
                    >
                        {isOptimizing ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                        {isOptimizing ? "Optimizing Assets..." : "Execute Optimization"}
                    </button>
                </div>
            </div>
          </div>

          <AnimatePresence>
            {optimizedResult && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                        <CheckCircle size={48} className="text-green-500 opacity-20" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold text-white mb-2">Optimization Complete!</h3>
                        <p className="text-gray-400 mb-8">Your image has been compressed and converted to <span className="text-neon-blue font-bold uppercase">{optimizedResult.format}</span>.</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                            <div>
                                <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Old Size</span>
                                <span className="text-xl font-mono text-gray-400">{(optimizedResult.oldSize / 1024).toFixed(1)} KB</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 font-bold uppercase block mb-1">New Size</span>
                                <span className="text-xl font-mono text-green-400">{(optimizedResult.newSize / 1024).toFixed(1)} KB</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Savings</span>
                                <span className="text-xl font-bold text-neon-blue">{optimizedResult.savings}%</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Dimensions</span>
                                <span className="text-xl font-mono text-gray-400">{optimizedResult.dimensions?.width}×{optimizedResult.dimensions?.height}</span>
                            </div>
                        </div>

                        <a 
                            href={`http://localhost:5000/api/optimize/download/${optimizedResult.filename}`}
                            download
                            className="inline-flex items-center gap-2 bg-green-500 text-black px-8 py-3 rounded-xl font-bold hover:brightness-110 transition-all"
                        >
                            <Download size={20} />
                            Download Optimized Image
                        </a>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ImageOptimizer;
