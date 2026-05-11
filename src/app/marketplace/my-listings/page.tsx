'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, CheckCircle, Clock, Tag, MessageCircle, AlertCircle, ShoppingCart, DollarSign, User, RefreshCw, LayoutGrid, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'selling' | 'requested' | 'past'>('selling');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      const res = await axios.get(`${API_URL}/marketplace/listings`, {
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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this item as ${newStatus}?`)) return;
    
    setActionLoading(id);
    try {
      const token = localStorage.getItem('nestc_token');
      await axios.patch(`${API_URL}/marketplace/listings/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    setActionLoading(id);
    try {
      const token = localStorage.getItem('nestc_token');
      await axios.delete(`${API_URL}/marketplace/listings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to delete listing:', err);
      alert('Failed to delete listing');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="My Shop" 
        subtitle="Manage Your Listings" 
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-12">
        <div className="flex border-b border-white/10 mb-8 sticky top-[80px] z-[90] bg-[#0a0a0b]/90 backdrop-blur-md pt-4 overflow-x-auto no-scrollbar">
           <button 
             onClick={() => setActiveTab('selling')}
             className={`flex-1 min-w-[120px] pb-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap px-4 ${activeTab === 'selling' ? 'border-b-2 border-blue-500 text-blue-500' : 'border-b-2 border-transparent text-gray-500 hover:text-white'}`}
           >
             Selling ({listings.filter(l => l.type === 'have' && l.status === 'active').length})
           </button>
           <button 
             onClick={() => setActiveTab('requested')}
             className={`flex-1 min-w-[120px] pb-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap px-4 ${activeTab === 'requested' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'border-b-2 border-transparent text-gray-500 hover:text-white'}`}
           >
             Requested ({listings.filter(l => l.type === 'want' && l.status === 'active').length})
           </button>
           <button 
             onClick={() => setActiveTab('past')}
             className={`flex-1 min-w-[120px] pb-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap px-4 ${activeTab === 'past' ? 'border-b-2 border-gray-400 text-white' : 'border-b-2 border-transparent text-gray-500 hover:text-white'}`}
           >
             Past ({listings.filter(l => ['sold', 'purchased', 'traded'].includes(l.status)).length})
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {loading ? (
               Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} className="glass-card h-[250px] animate-pulse" />
               ))
            ) : listings.filter(l => {
              if (activeTab === 'selling') return l.type === 'have' && l.status === 'active';
              if (activeTab === 'requested') return l.type === 'want' && l.status === 'active';
              if (activeTab === 'past') return ['sold', 'purchased', 'traded'].includes(l.status);
              return false;
            }).map((listing) => {
              const isCompleted = ['sold', 'purchased', 'traded'].includes(listing.status);
              return (
                <motion.div 
                  key={listing.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`glass-card overflow-hidden flex flex-col border-white/5 transition-all ${isCompleted ? 'opacity-60 grayscale-[0.5]' : 'hover:border-blue-500/30'}`}
                >
                  <div className="flex gap-6 p-6">
                    {listing.type === 'have' && (
                      <div className="relative w-32 h-32 bg-white/5 rounded-2xl overflow-hidden shrink-0">
                        {listing.photos?.[0] ? (
                          <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700 font-black text-xs uppercase tracking-widest text-center px-2">No Photo</div>
                        )}
                        {isCompleted && (
                          <div className="absolute inset-0 bg-emerald-600/80 backdrop-blur-sm flex items-center justify-center">
                             <span className="text-white font-black text-[10px] uppercase tracking-[0.3em] rotate-[-15deg] border-2 border-white px-2 py-1">{listing.type === 'have' ? 'SOLD' : 'PURCHASED'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{listing.category}</span>
                           <span className="text-[10px] text-gray-600 font-bold">{new Date(listing.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white truncate leading-tight">{listing.title}</h3>
                        <p className="text-xl font-black text-white mt-1">
                          {listing.price > 0 ? `₹${listing.price}` : (listing.type === 'want' ? 'Budget not specified' : 'Free')}
                        </p>
                      </div>

                      <div className="flex gap-2 mt-4">
                        {listing.type === 'have' && !isCompleted && (
                          <button 
                            disabled={actionLoading !== null}
                            onClick={() => handleUpdateStatus(listing.id, 'sold')}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600/10 text-emerald-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                          >
                            <CheckCircle size={14} /> {actionLoading === listing.id ? 'Updating...' : 'Mark Sold'}
                          </button>
                        )}
                        {listing.type === 'want' && !isCompleted && (
                          <button 
                            disabled={actionLoading !== null}
                            onClick={() => handleUpdateStatus(listing.id, 'purchased')}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600/10 text-emerald-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                          >
                            <CheckCircle size={14} /> {actionLoading === listing.id ? 'Updating...' : 'Mark Purchased'}
                          </button>
                        )}
                        <button 
                          disabled={actionLoading !== null}
                          onClick={() => handleDelete(listing.id)}
                          className={`flex items-center justify-center gap-2 p-3 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 ${isCompleted ? 'flex-1' : ''}`}
                        >
                          <Trash2 size={16} />
                          {actionLoading === listing.id ? <span className="text-[10px] font-black uppercase tracking-widest ml-1">Deleting...</span> : (isCompleted ? <span className="text-[10px] font-black uppercase tracking-widest ml-1">Remove</span> : null)}
                        </button>
                      </div>
                      
                      {!isCompleted && (
                        <div className="mt-2">
                           <Link 
                             href={`/marketplace/edit/${listing.id}`}
                             className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                           >
                             Edit Listing
                           </Link>
                        </div>
                      )}
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
