'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Clock, Tag, MessageCircle, AlertCircle, RefreshCw, User, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function RequestListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nestc_token');
      
      const res = await axios.get(`${API_URL}/marketplace/listings`, {
        params: {
          type: 'Want',
          status: 'active'
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setListings(res.data);
    } catch (err: any) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredListings = listings.filter(listing => 
    listing.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0));

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Student Requests" 
        subtitle="Help out your peers" 
        action={
          <div className="flex items-center gap-2 sm:gap-3">
             <button onClick={fetchRequests} className="p-2 sm:p-3 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
             </button>
             <Link href="/marketplace/post" prefetch={false} className="btn-primary flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 border-none">
                <Plus size={18} /> <span className="hidden sm:inline">Post Request</span>
             </Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-12">
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search requested items..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          <AnimatePresence mode="popLayout">
            {loading ? (
               Array.from({ length: 6 }).map((_, i) => (
                 <div key={i} className="glass-card h-64 animate-pulse" />
               ))
            ) : filteredListings.map((listing, i) => (
              <motion.div 
                key={listing.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`glass-card relative group overflow-hidden flex flex-col transition-all border-white/5 hover:border-emerald-500/30 ${listing.is_urgent ? 'ring-1 ring-red-500/50' : ''}`}
              >
                {listing.is_urgent && (
                  <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-red-500/30 flex items-center justify-center">
                    URGENT
                  </div>
                )}
                
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">{listing.category}</span>
                    <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><Clock size={12} /> {new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight">{listing.title}</h3>
                  {listing.description && (
                    <p className="text-xs text-gray-400 mb-6 line-clamp-3 leading-relaxed">{listing.description}</p>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-6 mt-auto">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500"><User size={16} /></div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Requester</p>
                      <p className="text-sm font-bold text-white">{listing.seller_name || 'Anonymous Student'}</p>
                      {listing.seller_hostel && (
                        <p className="text-[10px] text-emerald-500 font-bold tracking-wider mt-0.5">{listing.seller_hostel}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <div>
                      {listing.price > 0 ? (
                        <>
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Max Budget</p>
                          <span className="text-xl font-black text-white">₹{listing.price}</span>
                        </>
                      ) : (
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-2">Budget not specified</p>
                      )}
                    </div>
                    
                    {currentUser?.id !== listing.seller_id ? (
                      <button 
                        onClick={() => router.push(`/chat?sellerId=${listing.seller_id}&listingId=${listing.id}`)}
                        className="p-3 bg-white/5 rounded-xl transition-all hover:bg-emerald-600 text-emerald-500 hover:text-white"
                      >
                         <MessageCircle size={22} />
                      </button>
                    ) : (
                      <Link href="/marketplace/my-listings" prefetch={false} className="text-[9px] font-black uppercase text-emerald-500 tracking-widest hover:underline transition-all">Manage</Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {!loading && filteredListings.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30">
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No requests found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
