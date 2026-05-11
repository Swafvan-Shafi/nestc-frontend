'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Clock, Tag, MessageCircle, AlertCircle, ShoppingCart, DollarSign, User, RefreshCw, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const categories = ['All', 'Books', 'Electronics', 'Stationery', 'Lab', 'Cycles', 'Other'];

export default function MarketplacePage() {
  const router = useRouter();
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
      
      const res = await axios.get(`${API_URL}/marketplace/listings`, {
        params: {
          type: 'Have',
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
  }, [activeCategory, showUrgentOnly]);

  const filteredListings = listings.filter(listing => 
    listing.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0));

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Marketplace" 
        subtitle="Live Campus Trade" 
        action={
          <div className="flex items-center">
             <Link href="/marketplace/post" className="p-3 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-lg flex items-center justify-center">
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
            onClick={() => setShowUrgentOnly(!showUrgentOnly)}
            title="Filter by Urgent"
            className={`p-4 rounded-2xl border transition-all flex items-center justify-center shrink-0 ${showUrgentOnly ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/10' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
          >
            <AlertCircle size={20} />
          </button>

          <Link 
             href="/marketplace/my-listings" 
             title="Manage My Shop"
             className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all flex items-center justify-center shrink-0 shadow-lg"
          >
             <LayoutGrid size={20} />
          </Link>
        </div>

        <div className="flex mb-6">
          <Link href="/marketplace/requests" className="w-full p-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-2xl text-emerald-500 transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/5">
             <Tag size={18} /> View Request List
          </Link>
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
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">{listing.category}</span>
                    <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><Clock size={12} /> {new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-6 line-clamp-2 leading-tight">{listing.title}</h3>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-6">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500"><User size={16} /></div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Seller</p>
                      <p className="text-sm font-bold text-white">{listing.seller_name || 'Anonymous Student'}</p>
                      {listing.seller_hostel && (
                        <p className="text-[10px] text-blue-500 font-bold tracking-wider mt-0.5">{listing.seller_hostel}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-2xl font-black text-white">₹{listing.price}</span>
                    
                    {currentUser?.id !== listing.seller_id ? (
                      <button 
                        onClick={() => router.push(`/chat?sellerId=${listing.seller_id}&listingId=${listing.id}`)}
                        className="p-3 bg-white/5 rounded-xl transition-all hover:bg-blue-600 text-blue-500 hover:text-white"
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
