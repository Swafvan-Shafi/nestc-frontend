'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, CheckCircle, Clock, Tag, MessageCircle, AlertCircle, ShoppingCart, DollarSign, User, RefreshCw, LayoutGrid, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { BASE_URL } from '@/lib/api';

const API_URL = BASE_URL;

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

  type ConfirmAction = {
    type: 'sold' | 'purchased' | 'delete';
    id: string;
  };
  const [confirmDialog, setConfirmDialog] = useState<ConfirmAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setConfirmDialog({ type: newStatus as 'sold' | 'purchased', id });
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({ type: 'delete', id });
  };

  const confirmAction = async () => {
    if (!confirmDialog) return;
    const { type, id } = confirmDialog;
    
    setActionLoading(id);
    setActionError(null);
    try {
      const token = localStorage.getItem('nestc_token');
      if (type === 'delete') {
        await axios.delete(`${API_URL}/marketplace/listings/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setListings(prev => prev.filter(l => l.id !== id));
      } else {
        await axios.patch(`${API_URL}/marketplace/listings/${id}/status`, { status: type }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: type } : l));
      }
      setConfirmDialog(null);
    } catch (err) {
      console.error('Action failed:', err);
      setActionError('Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="My Shop" 
        subtitle="Manage Your Listings" 
        action={
          <Link 
            href="/chat" 
            prefetch={false} 
            title="View Chat History"
            className="p-3 bg-white/5 text-gray-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-lg flex items-center justify-center border border-white/10"
          >
             <MessageCircle size={20} />
          </Link>
        }
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
                  <div className="flex flex-row gap-4 sm:gap-6 p-4 sm:p-6">
                    {listing.type === 'have' && (
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 self-start">
                        {listing.photos?.[0] ? (
                          <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700 font-black text-[10px] sm:text-xs uppercase tracking-widest text-center px-1 sm:px-2">No Photo</div>
                        )}
                        {isCompleted && (
                          <div className="absolute inset-0 bg-emerald-600/80 backdrop-blur-sm flex items-center justify-center p-1 sm:p-2 z-10">
                             <span className="text-white font-black text-[8px] sm:text-[10px] uppercase tracking-widest sm:tracking-[0.2em] border-2 border-white px-1 sm:px-2 py-0.5 sm:py-1 bg-[#0a0a0b]/20 text-center">{listing.type === 'have' ? 'SOLD' : 'PURCHASED'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start mb-1 sm:mb-2">
                           <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-blue-500 truncate mr-2">{listing.category}</span>
                           <span className="text-[9px] sm:text-[10px] text-gray-600 font-bold shrink-0">{new Date(listing.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-sm sm:text-lg font-bold text-white truncate leading-tight">{listing.title}</h3>
                        <p className="text-base sm:text-xl font-black text-white mt-1">
                          {listing.price > 0 ? `₹${listing.price}` : (listing.type === 'want' ? 'Budget not specified' : 'Free')}
                        </p>
                      </div>

                      <div className={`${listing.type === 'want' ? 'hidden sm:flex' : 'flex'} flex-row items-stretch gap-1 sm:gap-2 mt-3 sm:mt-4`}>
                        {listing.type === 'have' && !isCompleted && (
                          <button 
                            disabled={actionLoading !== null}
                            onClick={() => handleUpdateStatus(listing.id, 'sold')}
                            className="flex-[3] sm:flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-3 bg-emerald-600/10 text-emerald-500 rounded-lg sm:rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 
                            {actionLoading === listing.id ? 'Updating...' : (
                               <>
                                 <span className="sm:hidden">Sold</span>
                                 <span className="hidden sm:inline">Mark Sold</span>
                               </>
                            )}
                          </button>
                        )}
                        {listing.type === 'want' && !isCompleted && (
                          <button 
                            disabled={actionLoading !== null}
                            onClick={() => handleUpdateStatus(listing.id, 'purchased')}
                            className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-3 bg-emerald-600/10 text-emerald-500 rounded-lg sm:rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 
                            {actionLoading === listing.id ? 'Updating...' : (
                               <>
                                 <span className="sm:hidden">Purchased</span>
                                 <span className="hidden sm:inline">Mark Purchased</span>
                               </>
                            )}
                          </button>
                        )}
                        <button 
                          disabled={actionLoading !== null}
                          onClick={() => handleDelete(listing.id)}
                          className={`flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 bg-red-600/10 text-red-500 rounded-lg sm:rounded-xl hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 shrink-0 ${isCompleted ? 'flex-1' : (listing.type === 'have' ? 'flex-[1] sm:flex-none' : 'flex-none')}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          {actionLoading === listing.id ? (
                             <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ml-0 sm:ml-1 ${listing.type === 'have' && !isCompleted ? 'hidden sm:inline' : ''}`}>Deleting...</span>
                          ) : (isCompleted ? (
                             <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest ml-0 sm:ml-1">Remove</span>
                          ) : (
                             <span className="sr-only">Delete</span>
                          ))}
                        </button>
                      </div>
                    </div>

                    {listing.type === 'want' && (
                      <div className="flex sm:hidden flex-col gap-2 w-16 shrink-0 self-stretch">
                        {!isCompleted && (
                          <button 
                            disabled={actionLoading !== null}
                            onClick={() => handleUpdateStatus(listing.id, 'purchased')}
                            className="flex-1 flex flex-col items-center justify-center gap-1 bg-emerald-600/10 text-emerald-500 rounded-lg hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50 p-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight">{actionLoading === listing.id ? 'Upd...' : 'Purchased'}</span>
                          </button>
                        )}
                        <button 
                          disabled={actionLoading !== null}
                          onClick={() => handleDelete(listing.id)}
                          className={`flex-1 flex flex-col items-center justify-center gap-1 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 p-1`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight">{actionLoading === listing.id ? 'Del...' : (isCompleted ? 'Remove' : 'Delete')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {confirmDialog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0b]/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121214] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
            >
              <h3 className="text-white font-bold text-lg mb-2">Confirm Action</h3>
              <p className="text-gray-400 text-sm mb-6">
                {confirmDialog.type === 'sold' && "Mark this item as sold?"}
                {confirmDialog.type === 'purchased' && "Mark this request as purchased?"}
                {confirmDialog.type === 'delete' && "Delete this item permanently?"}
              </p>
              
              {actionError && (
                <div className="mb-4 text-center text-red-500 font-bold text-xs bg-red-500/10 py-2 rounded-lg">
                  {actionError}
                </div>
              )}
              
              <div className="flex gap-3">
                <button 
                  disabled={actionLoading !== null}
                  onClick={() => {
                    setConfirmDialog(null);
                    setActionError(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all font-bold text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  disabled={actionLoading !== null}
                  onClick={confirmAction}
                  className={`flex-1 py-3 rounded-xl transition-all font-bold text-sm disabled:opacity-50 ${
                    confirmDialog.type === 'delete' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {actionLoading !== null ? 'Processing...' : (
                    confirmDialog.type === 'sold' ? 'Confirm Sold' :
                    confirmDialog.type === 'purchased' ? 'Confirm Purchased' : 'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
