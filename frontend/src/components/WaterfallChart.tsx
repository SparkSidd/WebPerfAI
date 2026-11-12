import React from 'react';
import { motion } from 'framer-motion';

interface NetworkRequest {
  url: string;
  resourceType: string;
  startTime: number;
  endTime: number;
  transferSize: number;
}

const WaterfallChart = ({ requests }: { requests: NetworkRequest[] }) => {
  if (!requests || requests.length === 0) return null;

  // Find max end time to scale the chart
  const maxEndTime = Math.max(...requests.map(r => r.endTime));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getColor = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('document')) return 'bg-blue-500';
    if (typeLower.includes('script')) return 'bg-yellow-500';
    if (typeLower.includes('stylesheet') || typeLower.includes('css')) return 'bg-green-500';
    if (typeLower.includes('image')) return 'bg-purple-500';
    if (typeLower.includes('font')) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-3xl p-8 mt-8">
      <h3 className="text-2xl font-bold mb-6">Network Waterfall</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-dark-border pb-2">
            <div className="col-span-4">Resource</div>
            <div className="col-span-1">Size</div>
            <div className="col-span-7">Timeline ({maxEndTime.toFixed(0)}ms)</div>
          </div>

          {/* Rows */}
          <div className="space-y-3">
            {requests.map((req, idx) => {
              const startPercent = (req.startTime / maxEndTime) * 100;
              const widthPercent = Math.max(0.5, ((req.endTime - req.startTime) / maxEndTime) * 100);
              
              // Get simple filename
              let fileName = req.url.split('/').pop()?.split('?')[0] || req.url;
              if (fileName.length > 40) fileName = fileName.substring(0, 40) + '...';

              return (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center group hover:bg-white/[0.02] p-1 rounded transition-colors">
                  <div className="col-span-4 flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className={`w-2 h-2 rounded-full ${getColor(req.resourceType)}`} title={req.resourceType}></span>
                    <span className="text-sm text-gray-300" title={req.url}>{fileName}</span>
                  </div>
                  <div className="col-span-1 text-xs text-gray-500">
                    {formatSize(req.transferSize)}
                  </div>
                  <div className="col-span-7 relative h-6 bg-black/50 rounded flex items-center">
                    {/* Tick marks background */}
                    {[0, 25, 50, 75].map(tick => (
                      <div key={tick} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: `${tick}%` }}></div>
                    ))}
                    
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: `${widthPercent}%`, opacity: 1 }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className={`h-3 rounded-sm ${getColor(req.resourceType)} shadow-sm relative group-hover:h-4 transition-all`}
                      style={{ marginLeft: `${startPercent}%` }}
                    >
                      <div className="absolute top-[-24px] left-1/2 transform -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none border border-dark-border">
                        {(req.endTime - req.startTime).toFixed(0)}ms
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterfallChart;
