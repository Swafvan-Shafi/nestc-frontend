'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Car, 
  Package, 
  ShoppingBag, 
  MessageSquare, 
  User, 
  LogOut,
  X,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', desc: 'Home overview' },
  { icon: Car, label: 'Book Ride', href: '/book', desc: 'Auto & Taxi' },
  { icon: Package, label: 'Vending', href: '/vending', desc: 'Machine stock' },
  { icon: ShoppingBag, label: 'Marketplace', href: '/marketplace', desc: 'Buy & Sell' },
  { icon: MessageSquare, label: 'Chat', href: '/chat', desc: 'Messages' },
  { icon: User, label: 'Profile', href: '/profile', desc: 'Account settings' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [user, setUser] = useState<{ name: string, role: string } | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('nestc_token');
    localStorage.removeItem('nestc_user');
    window.location.href = '/auth/login';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
          />

          <motion.aside 
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 w-80 h-screen bg-[#0d1117] border-r border-white/5 z-[70] flex flex-col shadow-[20px_0_60px_rgba(0,0,0,0.5)]"
          >
            <div className="p-8 flex justify-between items-center border-b border-white/5">
              <span className="text-3xl font-black text-white tracking-tighter">
                NEST<span className="text-blue-500">C</span>
              </span>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-4">Main Navigation</p>
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'text-gray-500 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'} transition-colors`}>
                      <item.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm leading-none mb-1">{item.label}</p>
                      <p className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-gray-600'}`}>{item.desc}</p>
                    </div>
                    {isActive && <ChevronRight size={16} className="opacity-50" />}
                  </Link>
                );
              })}
            </nav>

            <div className="p-6 bg-[#0a0c10] border-t border-white/5">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{user?.role || 'Student'}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm"
              >
                <LogOut size={18} />
                Sign Out Account
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
