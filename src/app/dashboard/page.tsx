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

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    }
  }, []);

  const displayName = user?.name || 'Student';

  return (
    <div className="min-h-[100dvh] flex flex-col pb-20 sm:pb-0">
      <PageHeader 
        title="NestC Services"
        subtitle={`Hello, ${displayName.split(' ')[0]}! • Roll No: ${user?.rollNo || 'B210xxxCS'}`}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-12 py-12 space-y-12">
        
        {/* Primary Navigation - Large Interactive Cards */}
        <section className="pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
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
