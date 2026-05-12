'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Clock, Tag, MessageCircle, AlertCircle, ShoppingCart, DollarSign, User, RefreshCw, LayoutGrid, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { BASE_URL } from '@/lib/api';

const API_URL = BASE_URL;
const categories = ['All', 'Books', 'Electronics', 'Calculator', 'Cycles', 'Stationery', 'Lab Coat', 'Clothing', 'Other'];

export default function MarketplacePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchListings = async () => {
    if (listings.length === 0) setLoading(true);
    try {
      const token = localStorage.getItem('nestc_token');
      
      const res = await axios.get(`${API_URL}/marketplace/listings`, {
        params: {
          type: 'Have',
          status: 'active' // Ensure public shop only shows active
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setListings(res.data);
    } catch (err: any) {
      console.error('Failed to fetch listings:', err);
      let msg = 'Network issue. Check your connection.';
      if (err.response) {
        const status = err.response.status;
        if (status === 401) msg = 'Please login again.';
        else if (status === 500) msg = 'Server error. Please try again.';
      }
      // Optional: Add alert or toast for listing fetch failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []); // Fetch once on mount

  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || (() => {
        const cat = listing.category?.toLowerCase();
        const active = activeCategory.toLowerCase();
        if (active === 'clothing' && cat === 'clothes') return true;
        return cat === active;
      })();
      const matchesUrgent = !showUrgentOnly || listing.is_urgent;
      return matchesSearch && matchesCategory && matchesUrgent;
    }).sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0));
  }, [listings, searchQuery, activeCategory, showUrgentOnly]);

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Marketplace" 
        subtitle="Live Campus Trade" 
        action={
          <div className="flex items-center gap-3">
             <Link 
               href="/chat" 
               prefetch={false} 
               title="View Chat History"
               className="p-3 bg-white/5 text-gray-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-lg flex items-center justify-center border border-white/10"
             >
                <MessageCircle size={20} />
             </Link>
             <Link href="/marketplace/post" prefetch={false} className="p-3 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-lg flex items-center justify-center">
                <Plus size={20} />
             </Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-12">

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Search for items to buy..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            type="button"
            onClick={() => setShowUrgentOnly(!showUrgentOnly)}
            title="Filter by Urgent"
            className={`p-4 rounded-2xl border transition-all flex items-center justify-center shrink-0 ${showUrgentOnly ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/10' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
          >
            <AlertCircle size={20} />
          </button>

          <Link 
             href="/marketplace/my-listings" 
             prefetch={false}
             title="Manage My Shop"
             className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all flex items-center justify-center shrink-0 shadow-lg"
          >
             <LayoutGrid size={20} />
          </Link>
        </div>

        <div className="flex mb-6">
          <Link href="/marketplace/requests" prefetch={false} className="w-full p-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-2xl text-emerald-500 transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/5">
             <Tag size={18} /> View Request List
          </Link>
        </div>

        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Category Selection</h2>
            <div className="relative group">
              <button 
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-4 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all min-w-[200px]"
              >
                <Tag size={18} className="text-blue-500" />
                <span className="font-bold flex-1 text-left">{activeCategory}</span>
                <ChevronDown size={18} className={`text-gray-600 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showCategoryDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 top-full mt-3 w-64 bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl p-2"
                    >
                      <div className="grid grid-cols-1 gap-1">
                        {categories.map((cat) => (
                          <button 
                            key={cat}
                            onClick={() => { setActiveCategory(cat); setShowCategoryDropdown(false); }}
                            className={`w-full px-4 py-3 rounded-2xl text-left text-sm font-bold transition-all ${activeCategory === cat ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Inventory Stats</h2>
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{filteredListings.length} Active Items</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 pb-20">
          <AnimatePresence mode="wait">
            {loading ? (
               Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="glass-card h-[400px] animate-pulse" />
               ))
            ) : filteredListings.map((listing, i) => (
              <motion.div 
                key={listing.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`glass-card relative group overflow-hidden flex flex-col transition-all border-white/5 hover:border-blue-500/30 ${listing.is_urgent ? 'ring-1 ring-red-500/50' : ''}`}
              >
                {listing.is_urgent && (
                  <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-red-500/30 flex items-center justify-center">
                    URGENT
                  </div>
                )}
                {listing.photos?.[0] && (
                  <div className="relative h-48 bg-white/5 overflow-hidden">
                    <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-contain p-2" />
                  </div>
                )}
                <div className="p-3 sm:p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2 sm:mb-4">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">{listing.category}</span>
                    <span className="hidden sm:flex text-[10px] text-gray-500 font-bold items-center gap-1"><Clock size={12} /> {new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2 line-clamp-2 leading-tight">{listing.title}</h3>
                  {listing.description && (
                    <p className="hidden sm:block text-xs text-gray-400 mb-6 line-clamp-3 leading-relaxed">{listing.description}</p>
                  )}
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-xl mb-4 sm:mb-6 mt-auto">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/20 text-blue-500"><User size={12} className="sm:hidden" /><User size={16} className="hidden sm:block" /></div>
                    <div className="min-w-0">
                      <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest hidden sm:block">Seller</p>
                      <p className="text-[10px] sm:text-sm font-bold text-white truncate">{listing.seller_name?.split(' ')[0] || 'Student'}</p>
                      {listing.seller_hostel && (
                        <p className="text-[8px] sm:text-[10px] text-blue-500 font-bold tracking-wider mt-0.5 truncate">{listing.seller_hostel}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto pt-3 sm:pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-base sm:text-2xl font-black text-white">₹{listing.price}</span>
                    
                    {currentUser?.id !== listing.seller_id ? (
                      <button 
                        type="button"
                        onClick={() => {
                          const imgParam = listing.photos?.[0] ? `&img=${encodeURIComponent(listing.photos[0])}` : '';
                          router.push(`/chat?sellerId=${listing.seller_id}&listingId=${listing.id}&title=${encodeURIComponent(listing.title)}&price=${listing.price}&sellerName=${encodeURIComponent(listing.seller_name || 'Student')}${imgParam}`);
                        }}
                        className="p-2 sm:p-3 bg-white/5 rounded-xl transition-all hover:bg-blue-600 text-blue-500 hover:text-white"
                      >
                        <MessageCircle size={18} className="sm:hidden" /><MessageCircle size={22} className="hidden sm:block" />
                      </button>
                    ) : (
                      <Link href="/marketplace/my-listings" prefetch={false} className="text-[8px] sm:text-[9px] font-black uppercase text-blue-500 tracking-widest hover:underline transition-all">Edit</Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {!loading && filteredListings.length === 0 && (
            <div className="col-span-full py-32 text-center opacity-30">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Tag size={32} className="text-gray-600" />
              </div>
              <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-sm">No products posted yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
