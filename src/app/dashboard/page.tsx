'use client';

import { motion } from 'framer-motion';
import { Car, Package, ShoppingBag, ArrowRight, MessageSquare, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import axios from 'axios';
import { BASE_URL } from '@/lib/api';

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; name: string; rollNo?: string } | null>(null);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchRecentChats(parsedUser.id);
    }
  }, []);

  const fetchRecentChats = async (userId: string) => {
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`${BASE_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentChats(Array.isArray(res.data) ? res.data.slice(0, 3) : []);
    } catch (err) {
      console.error('Failed to fetch dashboard chats:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const displayName = user?.name || 'Student';

  return (
    <div className="min-h-[100dvh] flex flex-col pb-20 sm:pb-0">
      <PageHeader 
        title="NestC Services"
        subtitle={`Hello, ${displayName.split(' ')[0]}! • Roll No: ${user?.rollNo || 'B210xxxCS'}`}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-12 py-4 sm:py-12 flex-1 flex flex-col justify-center">
        
        {/* Primary Navigation - Large Interactive Cards */}
        <section className="flex-1 flex flex-col justify-center pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 flex-1 max-h-[70vh]">
            {[
              { label: "Book a Ride", icon: Car, href: "/book", color: "from-blue-600 to-indigo-600", desc: "Request auto or taxi drivers at the gate" },
              { label: "Vending Stock", icon: Package, href: "/vending", color: "from-emerald-600 to-teal-600", desc: "Real-time stock for hostel machines" },
              { label: "Marketplace", icon: ShoppingBag, href: "/marketplace", color: "from-purple-600 to-pink-600", desc: "Buy and sell items within campus" },
            ].map((action, i) => (
              <Link key={i} href={action.href}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="relative glass-card p-5 sm:p-12 group cursor-pointer overflow-hidden flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-0 border-white/5 hover:border-blue-500/30 transition-all shadow-xl h-full"
                >
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${action.color} opacity-5 blur-[100px] -mr-32 -mt-32 group-hover:opacity-20 transition-opacity`} />
                  
                  <div className={`w-12 h-12 sm:w-20 sm:h-20 shrink-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white sm:mb-10 shadow-2xl relative z-10 group-hover:scale-110 transition-transform`}>
                    <action.icon size={24} className="sm:hidden" />
                    <action.icon size={40} className="hidden sm:block" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-3xl font-bold text-white mb-1 sm:mb-4 tracking-tight relative z-10">{action.label}</h3>
                    <p className="text-gray-500 text-xs sm:text-base hidden sm:block mb-8 leading-relaxed relative z-10">{action.desc}</p>
                    
                    <div className="mt-auto flex items-center gap-2 text-white/30 group-hover:text-blue-500 transition-all text-[9px] sm:text-xs font-black uppercase tracking-widest relative z-10">
                      Enter <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Chat History - VISIBILITY FIX */}
        {recentChats.length > 0 && (
          <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <MessageSquare size={14} className="text-blue-500" /> Recent Activity & Chat History
              </h2>
              <Link href="/chat" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">View All</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentChats.map((chat, i) => (
                <Link key={chat.id} href={`/chat?sellerId=${chat.other_user_id}&listingId=${chat.listing_id || ''}&title=${encodeURIComponent(chat.product_name || '')}`}>
                  <div className="glass-card p-5 flex items-center gap-4 hover:border-blue-500/50 group transition-all">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 shrink-0 group-hover:scale-110 transition-transform">
                       {chat.product_image ? (
                         <img src={chat.product_image.startsWith('http') ? chat.product_image : `${BASE_URL.replace('/api/v1', '')}${chat.product_image}`} className="w-full h-full object-cover rounded-xl" />
                       ) : (
                         <User size={20} />
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-bold text-white truncate">{chat.other_user_name || 'Student'}</p>
                        <p className="text-[9px] text-gray-600 font-bold">{chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</p>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate italic">
                        {chat.last_message || 'Click to continue conversation...'}
                      </p>
                    </div>
                    {chat.unread_count > 0 && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 shadow-lg">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-widest">All Services Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
