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
  { id: 'F Hostel', gender: 'female', location: 'Entrance Gate' },
  { id: 'G Hostel', gender: 'female', location: 'Lobby' },
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
    let userHostels = allHostels;
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      const gender = parsedUser.gender?.toLowerCase();
      if (gender === 'male' || gender === 'm') {
        userHostels = allHostels.filter(h => h.gender !== 'female');
      } else if (gender === 'female' || gender === 'f') {
        userHostels = allHostels.filter(h => h.gender === 'female');
      }
    }
    
    setFilteredHostels(userHostels);
    setSelectedHostelId(userHostels[0]?.id || '');
  }, []);

  const currentHostel = filteredHostels.find(h => h.id === selectedHostelId);
  
  // Show all items to show the empty slots as well
  const availableItems = mockItems;

  return (
    <div className="min-h-screen pb-20 relative">
      <PageHeader 
        title="Vending" 
        subtitle="Live Machine Status" 
        action={
          <>
            {user?.role === 'admin' && (
              <Link 
                href="/vending/refill" 
                className="btn-outline flex items-center gap-2 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-xs px-3 py-2"
              >
                <Wrench size={14} />
                Refill Panel
              </Link>
            )}
          </>
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
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex justify-between items-end">
             <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Available Items</h2>
          </div>
          {availableItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 pb-20 w-full">
              {mockItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`glass-card p-3 sm:p-4 flex flex-col items-center justify-between text-center border-white/10 ${item.stock === 0 ? 'opacity-60' : 'hover:border-blue-500/30'} transition-all w-full`}
                >
                  <img src={item.image} alt={item.name} className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-3" />
                  <h3 className="text-xs font-bold text-white leading-tight mb-1 line-clamp-2">{item.name}</h3>
                  <p className="text-xs text-blue-400 font-black mb-2">₹{item.price}</p>
                  
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-[10px] text-gray-400 font-bold">{item.stock} left</span>
                  </div>
                  
                  <button className="w-full py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1">
                    <Bell size={12} /> Notify
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-white/5">
              <Package size={48} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest">No vending stock available currently.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
