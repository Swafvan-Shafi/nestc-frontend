'use client';

import PageHeader from '@/components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, GraduationCap, Building2, Shield, LogOut, ShoppingBag, History, ChevronRight, X, Clock, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    setShowHistory(true);
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`http://localhost:5000/api/v1/marketplace/listings`, {
        params: { sellerId: user.id },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserListings(res.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nestc_token');
    localStorage.removeItem('nestc_user');
    window.location.href = '/auth/login';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Profile" subtitle="Account Settings" />

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Profile Card */}
        <div className="glass-card p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-blue-600/10 transition-colors" />
          
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-blue-600/20">
              {user.name[0]}
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-2">
              <h2 className="text-4xl font-black text-white tracking-tight uppercase">{user.name}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                 <span className="px-4 py-1.5 bg-blue-600/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">{user.role}</span>
                 <span className="px-4 py-1.5 bg-white/5 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">Roll No: {user.rollNo || 'B210xxxCS'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={fetchHistory}
            className="glass-card p-8 flex items-center gap-6 group hover:bg-white/[0.04] transition-all border-white/5 hover:border-blue-500/30"
          >
            <div className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform">
              <History size={24} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-white tracking-tight">Sales History</h3>
              <p className="text-xs text-gray-500 font-medium">Track your marketplace posts</p>
            </div>
            <ChevronRight className="text-gray-700 group-hover:text-blue-500 transition-colors" />
          </button>

          <button className="glass-card p-8 flex items-center gap-6 group hover:bg-white/[0.04] transition-all border-white/5">
            <div className="p-4 bg-purple-600/10 text-purple-500 rounded-2xl group-hover:scale-110 transition-transform">
              <ShoppingBag size={24} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-white tracking-tight">Active Bookings</h3>
              <p className="text-xs text-gray-500 font-medium">Auto & taxi ride status</p>
            </div>
            <ChevronRight className="text-gray-700 group-hover:text-purple-500 transition-colors" />
          </button>
        </div>

        {/* Security / Logout */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-gray-600 uppercase tracking-[0.3em] px-4">Account Security</h3>
          <div className="glass-card divide-y divide-white/5">
             <div className="p-6 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <Shield size={20} className="text-gray-500 group-hover:text-white transition-colors" />
                  <span className="text-sm font-bold text-gray-400 group-hover:text-white">Privacy Settings</span>
                </div>
                <ChevronRight size={16} className="text-gray-700" />
             </div>
             <button 
              onClick={handleLogout}
              className="w-full p-6 flex items-center justify-between group hover:bg-red-500/[0.03] transition-colors"
             >
                <div className="flex items-center gap-4">
                  <LogOut size={20} className="text-red-500" />
                  <span className="text-sm font-bold text-red-500">Sign Out of NestC</span>
                </div>
                <span className="text-[10px] font-black text-red-500/40 uppercase tracking-widest">Logout</span>
             </button>
          </div>
        </div>
      </div>

      {/* Sales History Modal */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 h-[85vh] bg-[#0d1117] border-t border-white/10 z-[210] rounded-t-[3rem] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Your Marketplace Activity</h2>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Live tracking of your trade history</p>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {loadingHistory ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : userListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userListings.map((listing) => (
                      <div key={listing.id} className="glass-card p-6 flex gap-6 relative group border-white/5 hover:border-blue-500/30">
                        {listing.photos?.[0] && (
                          <div className="w-24 h-24 rounded-2xl bg-white/5 overflow-hidden flex-shrink-0">
                            <img src={listing.photos[0]} className="w-full h-full object-contain p-2" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                             <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${listing.type === 'Have' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                               {listing.type === 'Have' ? 'Selling' : 'Buying'}
                             </span>
                             <span className="text-[9px] text-gray-600 font-black uppercase"><Clock size={10} className="inline mr-1" /> {new Date(listing.created_at).toLocaleDateString()}</span>
                          </div>
                          <h4 className="text-white font-bold mb-2 truncate group-hover:text-blue-400 transition-colors">{listing.title}</h4>
                          <div className="flex items-center justify-between mt-4">
                             <span className="text-xl font-black text-white">₹{listing.price}</span>
                             <span className={`text-[9px] font-black uppercase tracking-widest ${listing.status === 'active' ? 'text-emerald-500' : 'text-gray-500'}`}>
                               ● {listing.status}
                             </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                    <History size={64} className="mb-6 text-gray-500" />
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">No Activity Yet</h3>
                    <p className="text-xs text-gray-500 mt-2">Items you post for sale or request will appear here.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
