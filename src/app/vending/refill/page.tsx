'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Camera, Upload, Package, RefreshCw, X, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';

const mockSlots = [
  { id: 1, name: "Lays Classic", slot: "A1", stock: 12, lastRefilled: "4h ago" },
  { id: 2, name: "Dairy Milk", slot: "A2", stock: 5, lastRefilled: "4h ago" },
  { id: 3, name: "Pepsi 500ml", slot: "B1", stock: 2, lastRefilled: "2h ago" },
];

export default function VendingRefillPage() {
  const router = useRouter();
  const [refilling, setRefilling] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const [photos, setPhotos] = useState<Record<number, string | null>>({});

  const handleRefill = (id: number) => {
    setRefilling(id);
    // Simulate API call
    setTimeout(() => {
      setRefilling(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 1500);
  };

  const handlePhotoUpload = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotos({ ...photos, [id]: URL.createObjectURL(file) });
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <PageHeader 
        title="Refill Panel" 
        subtitle="Staff Maintenance Mode" 
      />

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-[2rem] flex items-center gap-6">
          <div className="p-4 bg-yellow-500/20 text-yellow-500 rounded-2xl">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Staff Authorization Active</h3>
            <p className="text-sm text-gray-500 font-medium">Please ensure you photograph the machine shelves before and after refilling.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {mockSlots.map((item) => (
            <motion.div 
              key={item.id}
              layout
              className="glass-card p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 group"
            >
              <div className="flex gap-6 items-center flex-1">
                <div className="p-5 bg-white/5 rounded-2xl text-gray-400 group-hover:text-blue-500 transition-colors">
                  <Package size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-black text-gray-600 bg-white/5 px-2 py-1 rounded tracking-widest">SLOT {item.slot}</span>
                    <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded uppercase tracking-tighter">Stock Low</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Last refilled: {item.lastRefilled}</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                {/* Photo Upload for this slot */}
                <div className="relative group/photo">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    onChange={(e) => handlePhotoUpload(item.id, e)}
                  />
                  <div className={`flex items-center gap-2 px-6 py-4 rounded-2xl border font-bold transition-all ${photos[item.id] ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                    {photos[item.id] ? <CheckCircle2 size={18} /> : <Camera size={18} />}
                    {photos[item.id] ? 'Photo Captured' : 'Shelf Photo'}
                  </div>
                </div>

                <button 
                  onClick={() => handleRefill(item.id)}
                  disabled={refilling === item.id}
                  className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${refilling === item.id ? 'bg-gray-800 text-gray-500' : 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 hover:scale-105'}`}
                >
                  {refilling === item.id ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      Mark Refilled
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={() => router.push('/vending')}
          className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-gray-500 font-black uppercase tracking-widest hover:text-white transition-all"
        >
          Exit Maintenance Mode
        </button>
      </div>
    </div>
  );
}
