'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, CheckCircle, Clock, Tag, MessageCircle, AlertCircle, ShoppingCart, DollarSign, User, RefreshCw, LayoutGrid, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      fetchMyListings(user.id);
    }
  }, []);

  const fetchMyListings = async (userId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`http://localhost:5000/api/v1/marketplace/listings`, {
        params: {
          sellerId: userId,
          status: 'all'
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setListings(res.data);
    } catch (err: any) {
      console.error('Failed to fetch my listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSold = async (id: string) => {
    if (!confirm('Are you sure you want to mark this item as sold? It will be removed from your public shop.')) return;
    
    try {
      const token = localStorage.getItem('nestc_token');
      // FIXED: Use .patch() instead of .get() as required by the backend routes
      await axios.patch(`http://localhost:5000/api/v1/marketplace/listings/${id}/traded`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyListings(currentUser.id);
    } catch (err) {
      console.error('Failed to mark as sold:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('This will permanently remove the listing. This cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('nestc_token');
      await axios.delete(`http://localhost:5000/api/v1/marketplace/listings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyListings(currentUser.id);
    } catch (err) {
      console.error('Failed to delete listing:', err);
      alert('Failed to delete listing');
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="My Shop" 
        subtitle="Manage Your Listings" 
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-12">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
              <Link href="/marketplace" className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all">
                 <ArrowLeft size={20} />
              </Link>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Active & Past Items</h2>
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">Inventory Management</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
              <div className="px-4 py-2 bg-blue-600/10 rounded-xl text-blue-500 text-xs font-black uppercase tracking-widest">
                 {listings.filter(l => l.status === 'active').length} Active
              </div>
              <div className="px-4 py-2 bg-emerald-600/10 rounded-xl text-emerald-500 text-xs font-black uppercase tracking-widest">
                 {listings.filter(l => l.status === 'traded').length} Sold
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {loading ? (
               Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} className="glass-card h-[250px] animate-pulse" />
               ))
            ) : listings.map((listing) => {
              const isSold = listing.status === 'traded';
              return (
                <motion.div 
                  key={listing.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`glass-card overflow-hidden flex flex-col border-white/5 transition-all ${isSold ? 'opacity-60 grayscale-[0.5]' : 'hover:border-blue-500/30'}`}
                >
                  <div className="flex gap-6 p-6">
                    <div className="relative w-32 h-32 bg-white/5 rounded-2xl overflow-hidden shrink-0">
                      {listing.photos?.[0] ? (
                        <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 font-black text-xs uppercase tracking-widest text-center px-2">No Photo</div>
                      )}
                      {isSold && (
                        <div className="absolute inset-0 bg-emerald-600/80 backdrop-blur-sm flex items-center justify-center">
                           <span className="text-white font-black text-[10px] uppercase tracking-[0.3em] rotate-[-15deg] border-2 border-white px-2 py-1">SOLD</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{listing.category}</span>
                           <span className="text-[10px] text-gray-600 font-bold">{new Date(listing.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white truncate leading-tight">{listing.title}</h3>
                        <p className="text-xl font-black text-white mt-1">₹{listing.price}</p>
                      </div>

                      <div className="flex gap-2 mt-4">
                        {!isSold && (
                          <button 
                            onClick={() => handleMarkSold(listing.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600/10 text-emerald-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                          >
                            <CheckCircle size={14} /> Sold
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(listing.id)}
                          className={`flex items-center justify-center gap-2 p-3 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all ${isSold ? 'flex-1' : ''}`}
                        >
                          <Trash2 size={16} />
                          {isSold && <span className="text-[10px] font-black uppercase tracking-widest ml-1">Remove</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
