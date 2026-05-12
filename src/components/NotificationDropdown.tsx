'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Package, ShoppingBag, Car, X, CheckCircle2, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import axios from 'axios';
import { BASE_URL, SOCKET_URL } from '@/lib/api';

export default function NotificationDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (!savedUser) return;
    const user = JSON.parse(savedUser);

    const socket = io(SOCKET_URL);
    
    // Register user for their own notification room
    socket.emit('register_user', user.id);

    // Listen for new notifications (like messages)
    socket.on('notification', (notif) => {
      setNotifications(prev => {
        // Prevent duplicates
        if (prev.find(n => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
    });

    // Listen for read events to clear notifications
    socket.on('messages_read', ({ chatId }) => {
      setNotifications(prev => prev.filter(notif => notif.chatId !== chatId));
    });

    fetchUnreadMessages(user.id);

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchUnreadMessages = async (userId: string) => {
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`${BASE_URL}/chat/unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const unreadNotifs = res.data.map((m: any) => ({
        id: m.id,
        type: 'chat',
        title: `Message from ${m.sender_name}`,
        body: m.content,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        chatId: m.chat_id
      }));

      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const filtered = unreadNotifs.filter((n: any) => !existingIds.has(n.id));
        return [...filtered, ...prev];
      });
    } catch (e) {
      console.error('Failed to fetch unread messages:', e);
    }
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[190]" onClick={onClose} />
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-16 right-0 w-96 bg-[#0a0a0b] border border-white/10 rounded-[2.5rem] shadow-2xl z-[200] overflow-hidden backdrop-blur-2xl"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg">
                  <Bell size={18} />
                </div>
                <h3 className="font-black text-white text-sm uppercase tracking-widest">Notifications</h3>
              </div>
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-gray-500 hover:text-blue-500 font-black uppercase tracking-widest transition-colors">Mark all read</button>
              )}
            </div>

            <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((notif, index) => (
                  <div key={index} className={`p-6 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-all relative group ${!notif.read ? 'bg-blue-600/[0.02]' : ''}`}>
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${notif.type === 'vending' ? 'bg-emerald-600/10 text-emerald-500' : notif.type === 'chat' ? 'bg-blue-600/10 text-blue-500' : 'bg-purple-600/10 text-purple-500'}`}>
                        {notif.type === 'vending' ? <Package size={20} /> : notif.type === 'chat' ? <MessageSquare size={20} /> : <Car size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-bold text-white group-hover:text-blue-400 transition-colors ${!notif.read ? 'pr-4' : ''}`}>{notif.title}</h4>
                          <span className="text-[9px] text-gray-600 font-bold uppercase whitespace-nowrap">{notif.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed truncate">{notif.body}</p>
                      </div>
                    </div>
                    {!notif.read && <div className="absolute top-6 right-6 w-2 h-2 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]" />}
                  </div>
                ))
              ) : (
                <div className="py-20 text-center opacity-20">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={32} className="text-gray-600" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">No New Alerts</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-6 bg-white/[0.02] border-t border-white/5">
                 <button onClick={onClose} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all uppercase tracking-widest">Close Panel</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
