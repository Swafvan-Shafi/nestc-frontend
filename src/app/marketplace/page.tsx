'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Clock, Tag, MessageCircle, AlertCircle, ShoppingCart, DollarSign, User, RefreshCw, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const categories = ['All', 'Books', 'Electronics', 'Stationery', 'Lab', 'Cycles', 'Other'];

export default function MarketplacePage() {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<'buy' | 'sell'>('buy');
  const [activeCategory, setActiveCategory] = useState('All');
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
    setLoading(true);
    try {
      const token = localStorage.getItem('nestc_token');
      const type = activeMode === 'buy' ? 'Have' : 'Want';
      
      const res = await axios.get(`http://localhost:5000/api/v1/marketplace/listings`, {
        params: {
          type,
          category: activeCategory,
          urgent: showUrgentOnly,
          status: 'active' // Ensure public shop only shows active
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setListings(res.data);
    } catch (err: any) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [activeMode, activeCategory, showUrgentOnly]);

  const filteredListings = listings.filter(listing => 
    listing.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Marketplace" 
        subtitle="Live Campus Trade" 
        action={
          <div className="flex items-center gap-3">
             <Link href="/marketplace/my-listings" className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <LayoutGrid size={18} /> My Shop
             </Link>
             <button onClick={fetchListings} className="p-3 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
             </button>
             <Link href="/marketplace/post" className="btn-primary flex items-center gap-2 px-6 py-3 text-xs">
                <Plus size={18} /> Post
             </Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-12">
        <div className="flex p-1.5 bg-white/5 rounded-2xl w-full md:w-fit border border-white/5 mx-auto shadow-2xl">
          <button 
            onClick={() => setActiveMode('buy')}
            className={`flex-1 md:w-48 flex items-center justify-center gap-3 py-4 rounded-xl font-black uppercase tracking-widest transition-all ${activeMode === 'buy' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-gray-500 hover:text-white'}`}
          >
            <ShoppingCart size={20} />
            Buy Items
          </button>
          <button 
            onClick={() => setActiveMode('sell')}
            className={`flex-1 md:w-48 flex items-center justify-center gap-3 py-4 rounded-xl font-black uppercase tracking-widest transition-all ${activeMode === 'sell' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30' : 'text-gray-500 hover:text-white'}`}
          >
            <DollarSign size={20} />
            Sell Stuff
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-[4]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder={activeMode === 'buy' ? "Search for things to buy..." : "Search for things students need..."}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setShowUrgentOnly(!showUrgentOnly)}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border font-bold transition-all whitespace-nowrap ${showUrgentOnly ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/10' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
          >
            <AlertCircle size={20} />
            Urgent Only
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-white/5">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-2xl transition-all whitespace-nowrap text-sm font-bold ${activeCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
          <AnimatePresence mode="popLayout">
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
                className="glass-card group overflow-hidden flex flex-col border-white/5 hover:border-blue-500/30 transition-all"
              >
                {listing.photos?.[0] && (
                  <div className="relative h-48 bg-white/5 overflow-hidden">
                    <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-contain p-2" />
                  </div>
                )}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeMode === 'buy' ? 'text-blue-500' : 'text-emerald-500'}`}>{listing.category}</span>
                    <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><Clock size={12} /> {new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-6 line-clamp-2 leading-tight">{listing.title}</h3>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-6">
                    <div className={`p-2 rounded-lg ${activeMode === 'buy' ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'}`}><User size={16} /></div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{activeMode === 'buy' ? 'Seller' : 'Buyer'}</p>
                      <p className="text-sm font-bold text-white">{listing.seller_name || 'Anonymous Student'}</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-2xl font-black text-white">₹{listing.price}</span>
                    
                    {currentUser?.id !== listing.seller_id ? (
                      <button 
                        onClick={() => router.push(`/chat?sellerId=${listing.seller_id}&listingId=${listing.id}`)}
                        className={`p-3 bg-white/5 rounded-xl transition-all ${activeMode === 'buy' ? 'hover:bg-blue-600 text-blue-500 hover:text-white' : 'hover:bg-emerald-600 text-emerald-500 hover:text-white'}`}
                      >
                        <MessageCircle size={22} />
                      </button>
                    ) : (
                      <Link href="/marketplace/my-listings" className="text-[9px] font-black uppercase text-blue-500 tracking-widest hover:underline transition-all">Edit Listing</Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {!loading && filteredListings.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30">
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No items found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
