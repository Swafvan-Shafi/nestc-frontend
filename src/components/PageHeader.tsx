'use client';

import { Bell, Search, MessageSquare, ChevronLeft, User as UserIcon, Menu, ArrowLeft } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import NotificationDropdown from './NotificationDropdown';
import { io, Socket } from 'socket.io-client';

import { SOCKET_URL } from '@/lib/api';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      // Initialize Socket
      const socket = io(SOCKET_URL);
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('📡 Header connected to socket');
        socket.emit('register_user', parsedUser.id);
      });
      
      socket.on('notification', (notif) => {
        console.log('🔔 Notification received:', notif);
        // Only increment if panel is closed
        if (!showNotifications) {
          setUnreadCount(prev => prev + 1);
        }
      });

      socket.on('messages_read', ({ chatId }) => {
        // Decrement unread count or refresh (simplest is to just allow it to be cleared next time opened, 
        // but we can try to be smart if we had IDs. Since we don't track IDs here, we'll just allow it to stay or set to 0 if all read)
        // For now, let's just keep it simple.
      });

      return () => {
        socket.disconnect();
      };
    }
  }, []);

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setUnreadCount(0); 
  };

  const handleBack = () => {
    if (pathname.startsWith('/chat')) {
      router.push('/dashboard');
      return;
    }
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 1) {
      router.push('/' + parts.slice(0, -1).join('/'));
    } else {
      router.push('/dashboard');
    }
  };

  const showBackButton = pathname !== '/dashboard' && pathname !== '/';

  return (
    <header className="w-full bg-[#0a0a0b]/80 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
        
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {showBackButton && (
            <button 
              type="button"
              onClick={handleBack}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all flex items-center gap-2 group shrink-0 shadow-lg border border-white/10"
              title="Go Back"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          )}

          <button 
            type="button"
            onClick={toggleSidebar}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-all overflow-hidden shrink-0 border border-white/10"
          >
             {user?.name ? (
               <span className="text-sm font-black uppercase">{user.name[0]}</span>
             ) : (
               <Menu size={20} />
             )}
          </button>

          <div className="hidden md:block w-px h-8 bg-white/10 mx-2 shrink-0" />

          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-black text-white tracking-tighter uppercase truncate">{title}</h1>
            {subtitle && <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mt-0.5 truncate hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          {action && <div className="mr-2">{action}</div>}
          
          <div className="flex items-center bg-white/5 p-1.5 rounded-2xl border border-white/5 relative">
            <button 
              type="button" 
              onClick={() => router.push('/chat')}
              className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <MessageSquare size={20} />
            </button>

            <div className="relative">
              <button 
                type="button"
                onClick={handleNotificationClick}
                className={`p-3 rounded-xl transition-all relative group ${showNotifications ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#0a0a0b] animate-bounce px-1">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <NotificationDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
