'use client';

import { motion } from 'framer-motion';
import { Car, Package, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; rollNo?: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const displayName = user?.name || 'Student';

  return (
    <div className="min-h-screen pb-20">
      <PageHeader 
        title={`Hello, ${displayName.split(' ')[0]}!`}
        subtitle={`Roll No: ${user?.rollNo || 'B210xxxCS'}`}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-16">
        
        {/* Primary Navigation - Large Interactive Cards */}
        <section className="space-y-12">
           <div className="flex justify-between items-end border-b border-white/5 pb-6">
             <div>
               <h2 className="text-3xl font-bold text-white tracking-tight mb-1">Campus Services</h2>
               <p className="text-sm text-gray-500">Quick access to essential student utilities</p>
             </div>
             <span className="hidden md:block text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Active Portal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  className="relative glass-card p-12 group cursor-pointer overflow-hidden h-full flex flex-col border-white/5 hover:border-blue-500/30 transition-all shadow-2xl"
                >
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${action.color} opacity-5 blur-[100px] -mr-32 -mt-32 group-hover:opacity-20 transition-opacity`} />
                  
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white mb-10 shadow-2xl relative z-10 group-hover:scale-110 transition-transform`}>
                    <action.icon size={40} />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-white mb-4 tracking-tight relative z-10">{action.label}</h3>
                  <p className="text-gray-500 text-base mb-12 leading-relaxed relative z-10">{action.desc}</p>
                  
                  <div className="mt-auto flex items-center gap-3 text-white/30 group-hover:text-blue-500 transition-all text-xs font-black uppercase tracking-widest relative z-10">
                    Enter Service <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* System Status Footer */}
        <div className="flex justify-center pt-20">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">All Services Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
