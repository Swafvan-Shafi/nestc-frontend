'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, MapPin, Bell, CheckCircle2, AlertCircle, XCircle, Wrench, ChevronDown } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';

const allHostels = [
  { id: 'A Hostel', gender: 'male', location: 'Main Lobby, Ground Floor' },
  { id: 'B Hostel', gender: 'male', location: 'Mess Entrance' },
  { id: 'C Hostel', gender: 'male', location: 'Common Room Area' },
  { id: 'D Hostel', gender: 'male', location: 'Study Hall Wing' },
  { id: 'E Hostel', gender: 'male', location: 'Near Warden Office' },
  { id: 'F Hostel', gender: 'male', location: 'Entrance Gate' },
  { id: 'G Hostel', gender: 'male', location: 'Lobby' },
  { id: 'Old Mega', gender: 'male', location: 'Tower 1 Reception' },
  { id: 'LH 1', gender: 'female', location: 'Main Entrance' },
  { id: 'LH 2', gender: 'female', location: 'Dining Hall' },
  { id: 'MBH2', gender: 'female', location: 'Reception Lobby' },
];

const MAX_STOCK = 15;

const mockItems = [
  { id: 1, name: "Lays Classic (Blue)", price: 20, stock: 12, slot: "A1", lastRefilled: "4h ago", image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: 2, name: "Dairy Milk Silk", price: 60, stock: 4, slot: "A2", lastRefilled: "4h ago", image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: 3, name: "Pepsi 500ml", price: 40, stock: 2, slot: "B1", lastRefilled: "2h ago", image: "https://images.unsplash.com/photo-1629203851022-39c6f2546e10?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: 4, name: "Britannia Fruit Cake", price: 15, stock: 0, slot: "B2", lastRefilled: "1d ago", image: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: 5, name: "Good Day Cashew", price: 10, stock: 10, slot: "C1", lastRefilled: "4h ago", image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: 6, name: "Paper Boat Mango", price: 25, stock: 8, slot: "C2", lastRefilled: "2h ago", image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=200&h=200" },
];

export default function VendingPage() {
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [filteredHostels, setFilteredHostels] = useState<any[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      const gender = (parsedUser.gender || 'male').toLowerCase();
      const visible = allHostels.filter(h => h.gender === 'both' || h.gender === gender);
      setFilteredHostels(visible);
      setSelectedHostelId(visible[0]?.id || '');
    }
  }, []);

  const currentHostel = allHostels.find(h => h.id === selectedHostelId);
  
  // Show all items to show the empty slots as well
  const availableItems = mockItems;

  return (
    <div className="min-h-screen pb-20 relative">
      <PageHeader 
        title="Vending" 
        subtitle="Live Machine Status" 
        action={
          <div className="flex gap-4">
            {user?.role === 'admin' && (
              <Link 
                href="/vending/refill" 
                className="btn-outline flex items-center gap-2 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
              >
                <Wrench size={18} />
                Refill Panel
              </Link>
            )}
            <button 
              onClick={() => setSubscribed(!subscribed)}
              className={`btn-primary flex items-center gap-2 ${subscribed ? 'bg-emerald-600 shadow-emerald-600/20' : ''}`}
            >
              <Bell size={18} />
              {subscribed ? `Subscribed to ${selectedHostelId}` : 'Notify for Refills'}
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-12 space-y-16">
        <section className="space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-tight">
              Campus <br/> <span className="text-blue-500">Vending</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl leading-relaxed">
              Real-time stock tracking for machines across NITC. Choose your hostel to see what's currently available.
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            {/* Hostel Dropdown */}
            <div className="relative w-full md:w-96 z-50">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 block">Select Machine</label>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-white font-bold hover:border-blue-500 transition-all shadow-xl"
              >
                <span className="flex items-center gap-3">
                  <MapPin size={18} className="text-blue-500" />
                  {selectedHostelId}
                </span>
                <ChevronDown className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-[#0d0d0d] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl z-[60] backdrop-blur-xl"
                  >
                    {filteredHostels.map((hostel) => (
                      <button 
                        key={hostel.id}
                        onClick={() => {
                          setSelectedHostelId(hostel.id);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-8 py-5 text-gray-400 hover:text-white hover:bg-white/5 transition-all font-bold border-b border-white/5 last:border-0"
                      >
                        {hostel.id}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Location Info */}
            <div className="flex items-center gap-4 text-gray-400 bg-white/5 px-8 py-5 rounded-[2rem] border border-white/5 shadow-lg">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Location</p>
                <p className="text-sm font-bold text-white">{currentHostel?.location || 'Select a hostel'}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex justify-between items-end">
             <h2 className="text-3xl font-bold text-white tracking-tight">Available Items</h2>
             <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">{availableItems.length} Products Available</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-20">
            {mockItems.map((item) => (
              <div 
                key={item.id} 
                className={`glass-card p-4 flex flex-col items-center text-center relative border-white/10 ${item.stock === 0 ? 'opacity-50 grayscale' : 'hover:border-blue-500/30'} transition-all`}
              >
                <span className="absolute top-2 left-3 text-[10px] font-black text-gray-500">{item.slot}</span>
                <img src={item.image} alt={item.name} className="w-16 h-16 object-contain mb-3 mt-4" />
                <h3 className="text-xs sm:text-sm font-bold text-white leading-tight mb-1">{item.name}</h3>
                <p className="text-xs text-blue-400 font-black mb-3">₹{item.price}</p>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${item.stock > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {item.stock} left
                </span>
              </div>
            ))}
          </div>
          
          {availableItems.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-white/5">
              <Package size={48} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest">This machine is currently empty</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
