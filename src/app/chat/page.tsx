'use client';

import PageHeader from '@/components/PageHeader';
import { motion } from 'framer-motion';
import { MessageSquare, Send, User, Clock, Check, Loader2, ImageIcon, CheckCircle, Tag, ShoppingBag, ExternalLink, Image as ImagePlaceholder } from 'lucide-react';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { SOCKET_URL, BASE_URL } from '@/lib/api';

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sellerId = searchParams.get('sellerId');
  const urlListingId = searchParams.get('listingId');
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [productDataCache, setProductDataCache] = useState<Record<string, any>>({});
  
  const [showNotification, setShowNotification] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<any>(null);
  const hasSentAutoEnquiry = useRef<string | null>(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const fetchProductPreview = useCallback(async (lId: string) => {
    if (!lId || lId === 'null') return;
    if (productDataCache[lId]) return;
    
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`${BASE_URL}/marketplace/listings/${lId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProductDataCache(prev => ({ ...prev, [lId]: res.data }));
    } catch (e) {
      console.error('Failed to fetch product preview:', e);
    }
  }, [productDataCache]);

  useEffect(() => {
    messages.forEach(msg => {
      if (msg.content?.startsWith('PRODUCT_ENQUIRY:')) {
        const lId = msg.content.split(':')[1];
        if (lId && !productDataCache[lId]) {
          fetchProductPreview(lId);
        }
      }
    });
  }, [messages, fetchProductPreview, productDataCache]);

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      const socket = io(SOCKET_URL);
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsSocketReady(true);
        socket.emit('register_user', parsedUser.id);
      });

      socket.on('new_message', (data) => {
        const currentActive = activeChatRef.current;
        if (currentActive && (data.chatId === currentActive.id || data.message.chat_id === currentActive.id)) {
          setMessages((prev) => {
             if (prev.find(m => m.id === data.message.id)) return prev;
             return [...prev, data.message];
          });
        }
        fetchConversations(parsedUser.id);
      });

      fetchConversations(parsedUser.id);
    }

    return () => {
      socketRef.current?.off('new_message');
      socketRef.current?.disconnect();
    };
  }, []);

  const fetchConversations = async (userId: string) => {
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`${BASE_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const conversationList = res.data.map((c: any) => ({
        id: c.id,
        name: c.other_user_name,
        sellerId: c.other_user_id,
        listingId: c.listing_id,
        chatSellerId: c.chat_seller_id,
        lastMessage: c.last_message,
        time: c.last_message_time ? new Date(c.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
        unreadCount: parseInt(c.unread_count) || 0
      }));

      // Enhanced uniqueness: check for seller AND listing
      const existingProductChat = conversationList.find((c: any) => 
        (c.sellerId === sellerId || c.chatSellerId === sellerId) && c.listingId === urlListingId
      );

      if (sellerId && !existingProductChat) {
        const newChat = {
          id: `temp_${sellerId}`,
          name: sellerId.substring(0, 8), // Placeholder name
          lastMessage: 'Starting a new conversation...',
          time: 'Now',
          sellerId: sellerId,
          listingId: urlListingId,
          unreadCount: 0
        };
        conversationList.unshift(newChat);
        if (!activeChat) setActiveChat(newChat);
      } else if (existingProductChat) {
        if (!activeChat) setActiveChat(existingProductChat);
      } else if (!activeChat && conversationList.length > 0) {
        setActiveChat(conversationList[0]);
      }

      setChats(conversationList);
    } catch (err) {
      setErrorMsg('Failed to load chats.');
      console.error('Failed to load chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    if (chatId.startsWith('temp_')) {
      setMessages([]);
      return;
    }
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`${BASE_URL}/chat/messages/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err: any) {
      console.error('Fetch messages failed:', err);
      setErrorMsg('Could not load chat history.');
    }
  };

  useEffect(() => {
    // Aggressive Auto-Enquiry: Send if urlListingId is present, even if chat is NOT temp
    if (activeChat && urlListingId && isSocketReady && hasSentAutoEnquiry.current !== urlListingId) {
      sendAutoEnquiry();
    }
  }, [activeChat?.id, urlListingId, isSocketReady]);

  const sendAutoEnquiry = async () => {
    if (!urlListingId || !activeChat) return;
    try {
      // PRE-FETCH for the sender
      fetchProductPreview(urlListingId);

      socketRef.current?.emit('send_message', {
        chatId: activeChat.id,
        senderId: user.id,
        receiverId: activeChat.sellerId,
        content: `PRODUCT_ENQUIRY:${urlListingId}:Hi, I'm interested in this product. Is it still available?`,
        listingId: urlListingId
      });

      hasSentAutoEnquiry.current = urlListingId;
      setActiveChat((prev: any) => ({ ...prev, isTemp: false }));
    } catch (e) {
      setErrorMsg('Auto-enquiry could not be sent.');
      console.error('Failed to send auto-enquiry:', e);
    }
  };

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      socketRef.current?.emit('join_chat', activeChat.id);
      
      // Mark as read
      if (activeChat.unreadCount > 0) {
        handleMarkRead(activeChat.id);
      }
    }
  }, [activeChat?.id]);

  const handleMarkRead = async (chatId: string) => {
    if (chatId.startsWith('temp_')) return;
    try {
      const token = localStorage.getItem('nestc_token');
      await axios.post(`${BASE_URL}/chat/read/${chatId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Notify socket
      socketRef.current?.emit('mark_read', { chatId, userId: user?.id });
      
      // Update local state
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c));
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!message.trim() || !activeChat || !user) return;

    try {
      const messageData = {
        chatId: activeChat.id,
        senderId: user.id,
        receiverId: activeChat.sellerId || activeChat.chatSellerId,
        content: message.trim(),
        listingId: activeChat.listingId
      };

      socketRef.current?.emit('send_message', messageData);
      setMessage('');
    } catch (err) {
      setErrorMsg('Message not sent. Try again.');
    }
  };

  const handleMarkSoldShortcut = async () => {
    if (!activeChat?.listingId) return;
    if (!confirm('Mark this product as SOLD and close the deal?')) return;
    
    try {
      const token = localStorage.getItem('nestc_token');
      await axios.patch(`${BASE_URL}/marketplace/listings/${activeChat.listingId}/traded`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Item marked as SOLD successfully!');
      setActiveChat((prev: any) => ({ ...prev, listingId: null })); 
    } catch (err) {
      console.error('Failed to mark sold:', err);
      setErrorMsg('Failed to update status. Please try again.');
    }
  };

  const isUserSeller = activeChat && user && activeChat.chatSellerId === user.id;

  return (
    <div className="min-h-screen">
      <PageHeader title="Messages" subtitle="Real-time Chat" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 relative">
          {/* Error Message */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 z-50 mt-4 px-6 py-3 bg-red-500 text-white rounded-full shadow-2xl font-bold text-sm flex items-center gap-3"
              >
                <AlertCircle size={18} />
                {errorMsg}
                <button onClick={() => setErrorMsg(null)} className="ml-2 hover:opacity-70"><X size={14} /></button>
              </motion.div>
            )}
          </AnimatePresence>

        <div className="h-[calc(100vh-250px)] flex gap-8">

          {/* Chat List */}
          <div className="w-80 flex flex-col gap-4">
             <div className="flex justify-between items-center px-2">
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Recent Chats</h2>
             </div>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {chats.map((chat) => (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChat(chat)}
                  className={`glass-card p-5 cursor-pointer transition-all border-l-4 ${activeChat?.id === chat.id ? 'bg-white/[0.08] border-blue-500 shadow-xl' : 'hover:bg-white/[0.04] border-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-sm">{chat.name}</h3>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] text-gray-600 font-bold">{chat.time}</span>
                      {chat.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-lg shadow-blue-600/30">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'text-white font-bold' : 'text-gray-500'}`}>
                    {chat.lastMessage?.startsWith('PRODUCT_ENQUIRY:') ? '📦 Product Enquiry' : chat.lastMessage}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 glass-card flex flex-col overflow-hidden border-white/5 bg-white/[0.01]">
            {activeChat ? (
              <>
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                      <User size={24} />
                    </div>
                    <div>
                      <h2 className="font-bold text-white tracking-tight">{activeChat.name}</h2>
                      <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Online Now
                      </p>
                    </div>
                  </div>

                  {isUserSeller && activeChat.listingId && (
                    <button 
                      onClick={handleMarkSoldShortcut}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-600/20 shadow-lg shadow-emerald-600/10"
                    >
                      <CheckCircle size={14} /> Mark Sold
                    </button>
                  )}
                </div>

                <div className="flex-1 p-8 overflow-y-auto flex flex-col space-y-6 custom-scrollbar">
                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id || msg.senderId === user?.id;
                    const content = msg.content || '';
                    const isProductEnquiry = content.startsWith('PRODUCT_ENQUIRY:');

                    if (isProductEnquiry) {
                      const parts = content.split(':');
                      const lId = parts[1];
                      const text = parts.slice(2).join(':');
                      const product = productDataCache[lId];
                      
                      return (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          key={msg.id || i}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4`}
                        >
                          <div className={`max-w-[85%] rounded-2xl overflow-hidden shadow-2xl flex flex-col ${isMe ? 'bg-blue-600 rounded-tr-none' : 'bg-white/5 border border-white/10 rounded-tl-none'}`}>
                             {/* WhatsApp-style Product Header */}
                             <div className={`p-3 flex items-center gap-4 ${isMe ? 'bg-black/20' : 'bg-white/5'} border-b border-white/5`}>
                                <div className="w-14 h-14 bg-black/40 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 shadow-lg">
                                   {product?.photos?.[0] ? (
                                     <img src={product.photos[0]} className="w-full h-full object-contain p-1" alt="Product" />
                                   ) : (
                                     <div className="w-full h-full flex items-center justify-center bg-gray-900/50">
                                       <ImagePlaceholder size={18} className="text-gray-700" />
                                     </div>
                                   )}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${isMe ? 'text-white/50' : 'text-blue-500'}`}>Regarding this product</p>
                                   <p className="text-xs font-bold text-white truncate leading-tight">{product?.title || 'Loading product...'}</p>
                                   <p className="text-[10px] font-black text-white/90 mt-0.5">₹{product?.price || '...'}</p>
                                </div>
                             </div>
                             {/* Message Content */}
                             <div className="p-4">
                                <p className="text-sm font-medium text-white leading-relaxed">{text}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 px-3">
                            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <Check size={10} className="text-blue-500" />}
                          </div>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        key={msg.id || i} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`max-w-[70%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-xl ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-gray-300 rounded-tl-none border border-white/5'}`}>
                          {content}
                        </div>
                        <div className="flex items-center gap-2 mt-2 px-3">
                          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <Check size={10} className="text-blue-500" />}
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>

                <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Write your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-3xl px-8 py-5 text-white focus:outline-none focus:border-blue-500 transition-all pr-20 shadow-inner group-hover:border-white/20"
                    />
                    <button 
                      type="button"
                      onClick={handleSend}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-3.5 bg-blue-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/30"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-20">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare size={48} className="text-gray-600" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Campus Messenger</h2>
                <p className="text-sm text-gray-500 font-medium">Select a student from the Marketplace to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
