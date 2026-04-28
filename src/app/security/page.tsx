'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, Car, MapPin, RefreshCw, AlertCircle } from 'lucide-react';

const mockPasses = [
  { id: 1, name: "Arjun Menon", type: "Auto", vehicle: "KL 11 AB 1234", timeLeft: "14:32", status: "Active", color: "text-green-500", bg: "bg-green-500/10" },
  { id: 2, name: "Sneha R.", type: "Taxi", vehicle: "KL 12 CD 5678", timeLeft: "Pending", status: "Incoming", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { id: 3, name: "Rahul Das", type: "Auto", vehicle: "KL 11 ZZ 9999", timeLeft: "03:15", status: "Expiring", color: "text-red-500", bg: "bg-red-500/10" },
];

export default function SecurityPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    setIsRefreshing(true);
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white p-8">
      <header className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#0f4c81] rounded-xl">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Security Gate Control</h1>
            <p className="text-gray-500 uppercase tracking-widest text-xs mt-1 font-bold">NITC Main Gate Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-gray-500 uppercase tracking-wider">Last Sync</p>
            <p className="text-lg font-mono font-bold">{lastUpdated.toLocaleTimeString()}</p>
          </div>
          <button 
            onClick={refreshData}
            className={`p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={24} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-6 px-8 mb-4 text-gray-500 text-xs font-bold uppercase tracking-widest">
          <div className="col-span-2">Student Information</div>
          <div>Vehicle Type</div>
          <div>Vehicle Number</div>
          <div>Status</div>
          <div className="text-right">Time Remaining</div>
        </div>

        <AnimatePresence>
          {mockPasses.map((pass, i) => (
            <motion.div 
              key={pass.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`grid grid-cols-6 items-center px-8 py-6 glass-card border-l-4 ${pass.bg} border-l-current ${pass.color}`}
            >
              <div className="col-span-2 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white font-bold text-xl">
                  {pass.name[0]}
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{pass.name}</p>
                  <p className="text-sm text-gray-500">Student ID: NITC-{pass.id}458</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-white">
                <Car size={20} className="text-gray-500" />
                <span className="font-semibold">{pass.type}</span>
              </div>

              <div className="font-mono text-2xl font-bold text-[#2E75B6]">
                {pass.vehicle}
              </div>

              <div>
                <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/5 ${pass.color}`}>
                  {pass.status}
                </span>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-2 text-3xl font-mono font-bold text-white">
                  {pass.timeLeft !== 'Pending' && <Clock size={24} className="text-gray-500" />}
                  {pass.timeLeft}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-8 flex justify-between items-center text-gray-600 text-xs font-bold uppercase tracking-[0.3em]">
        <span>Live Feed Active</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>System Healthy</span>
        </div>
        <span>NestC Central Hub</span>
      </footer>
    </main>
  );
}
