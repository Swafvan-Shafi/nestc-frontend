'use client';

import PageHeader from '@/components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Clock, Check, Loader2, ImageIcon, CheckCircle, Tag, ShoppingBag, ExternalLink, Image as ImagePlaceholder, AlertCircle, X, ChevronLeft, RefreshCw, MoreVertical, Trash2 } from 'lucide-react';
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
  const urlImg = searchParams.get('img');
  const urlTitle = searchParams.get('title');
  const urlPrice = searchParams.get('price');
  const urlSellerName = searchParams.get('sellerName');
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [productDataCache, setProductDataCache] = useState<Record<string, any>>({});
  
  const [isConnected, setIsConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [replyContext, setReplyContext] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<any>(null);
  const hasSentAutoEnquiry = useRef<string | null>(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const cleanBase = BASE_URL.replace('/api/v1', '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  };

  const getDeterministicId = (uid1: string, uid2: string, lid?: string) => {
    if (!uid1 || !uid2) return 'unknown';
    const ids = [uid1, uid2].sort();
    return `p2p_${ids[0].substring(0, 8)}_${ids[1].substring(0, 8)}`;
  };

  const fetchProductPreview = useCallback(async (lId: string) => {
    if (!lId || lId === 'null' || productDataCache[lId]) return;
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`${BASE_URL}/marketplace/listings/${lId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) setProductDataCache(prev => ({ ...prev, [lId]: res.data }));
    } catch (e) { console.error('Product fetch failed:', e); }
  }, [productDataCache]);

  const fetchMessages = async (chatId: string) => {
    if (!chatId) return;
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`${BASE_URL}/chat/messages/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setMessages([]); }
  };

  const fetchConversations = async (userId: string) => {
    if (!userId) return;
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`${BASE_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const rawData = Array.isArray(res.data) ? res.data : [];
      let list = rawData.map((c: any) => ({
        id: c.id,
        name: c.other_user_name || 'Student',
        email: c.other_user_email,
        sellerId: c.other_user_id,
        listingId: c.listing_id,
        productName: c.product_name,
        productImage: c.product_image,
        productPrice: c.product_price,
        lastMessage: c.last_message,
        time: c.last_message_time ? new Date(c.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
        unreadCount: parseInt(c.unread_count) || 0,
        isTemp: false
      }));

      setChats(list);
      
      // If no active chat set yet, default to first one in list
      if (!activeChatRef.current && list.length > 0 && !sellerId) {
        setActiveChat(list[0]);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('nestc_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Initialize Socket
      const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
      socketRef.current = socket;
      socket.on('connect', () => { setIsConnected(true); setIsSocketReady(true); socket.emit('register_user', parsedUser.id); });
      socket.on('new_message', (data) => {
        if (activeChatRef.current?.id === data.chatId || activeChatRef.current?.id === data.message.chat_id) {
          setMessages(prev => {
            // If we have a temp message with same content and recent timestamp, replace it
            const existingIndex = prev.findIndex(m => m.id.toString().startsWith('temp_') && m.content === data.message.content);
            if (existingIndex !== -1) {
              const newMsgs = [...prev];
              newMsgs[existingIndex] = data.message;
              return newMsgs;
            }
            return prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message];
          });
        }
        fetchConversations(parsedUser.id);
      });
      socket.on('messages_delivered', ({ chatId }) => {
        if (activeChatRef.current?.id === chatId) {
          setMessages(prev => prev.map(m => ({ ...m, is_delivered: true })));
        }
      });
      socket.on('chat_read', ({ chatId }) => {
        if (activeChatRef.current?.id === chatId) {
          setMessages(prev => prev.map(m => ({ ...m, is_read: true, is_delivered: true })));
        }
        fetchConversations(parsedUser.id);
      });

      // Initial Fetch
      fetchConversations(parsedUser.id);
    }
    return () => { socketRef.current?.disconnect(); };
  }, []);

  // Handle URL deep-linking
  useEffect(() => {
    if (user && sellerId && urlListingId) {
      const detId = getDeterministicId(user.id, sellerId, urlListingId);
      const existing = chats.find(c => c.id === detId);
      
      const urlChatEntry = {
        id: detId,
        name: urlSellerName || (existing ? existing.name : 'New Inquiry'),
        sellerId: sellerId,
        listingId: urlListingId,
        productImage: urlImg,
        productName: urlTitle,
        isTemp: !existing,
        time: existing ? existing.time : 'Now',
        lastMessage: existing ? existing.lastMessage : ('Regarding: ' + (urlTitle || 'Product')),
        unreadCount: existing ? existing.unreadCount : 0
      };

      // Always set active chat from URL if it's a direct navigation
      setActiveChat(urlChatEntry);
      setMobileView('chat');
    }
  }, [user?.id, sellerId, urlListingId, urlImg, urlTitle, urlSellerName, chats.length]);

  useEffect(() => {
    if (activeChat?.id) {
      fetchMessages(activeChat.id);
      socketRef.current?.emit('join_chat', activeChat.id);
      if (user) {
        socketRef.current?.emit('mark_read', { chatId: activeChat.id, userId: user.id });
      }
    }
  }, [activeChat?.id, user?.id]);

  useEffect(() => {
    if (urlListingId && urlTitle) {
      const ctx = { id: urlListingId, title: urlTitle, price: urlPrice, photo: urlImg };
      setProductDataCache(prev => ({ ...prev, [urlListingId]: ctx }));
      setReplyContext(ctx);
    }
  }, [urlListingId, urlTitle, urlImg, urlPrice]);

  useEffect(() => {
    if (activeChat && urlListingId && isSocketReady && hasSentAutoEnquiry.current !== urlListingId && user) {
       // We don't send auto-message anymore, we just let the user see the reply preview
       hasSentAutoEnquiry.current = urlListingId;
    }
  }, [activeChat?.id, isSocketReady, user, urlListingId]);

  // Auto-wake Render backend
  useEffect(() => {
    const wake = async () => {
      try { await axios.get(BASE_URL.replace('/api/v1', '')); } catch (e) {}
    };
    wake();
    const interval = setInterval(wake, 1000 * 60 * 10); // Every 10 mins
    return () => clearInterval(interval);
  }, []);

  const handleSend = () => {
    if (!message.trim() || !activeChat || !user) return;
    
    const content = message.trim();
    const tempId = 'temp_' + Date.now();
    
    const payload = { 
      chatId: activeChat.id, 
      senderId: user.id, 
      receiverId: activeChat.sellerId || activeChat.chatSellerId || sellerId, 
      content, 
      listingId: activeChat.listingId || urlListingId,
      productContext: replyContext 
    };

    // Optimistic Update
    const optimisticMsg = { 
      id: tempId, 
      sender_id: user.id, 
      content, 
      product_context: replyContext,
      created_at: new Date().toISOString(),
      is_read: false,
      is_delivered: false,
      is_pending: true // Local flag for spinner
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setMessage('');
    setReplyContext(null);

    socketRef.current?.emit('send_message', payload, (response: any) => {
      if (response && response.success) {
        setMessages(prev => {
          const idx = prev.findIndex(m => m.id === tempId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...response.message, is_pending: false };
            return updated;
          }
          return prev;
        });
      } else {
        setErrorMsg('Failed to send. Reconnecting...');
        setTimeout(() => setErrorMsg(null), 3000);
      }
    });
  };

  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  
  const handleBackToList = () => {
    setActiveChat(null);
    setMobileView('list');
    // Also clear URL params to stop deep-linking from re-activating the chat
    router.push('/chat', { scroll: false });
  };

  const [deletingChat, setDeletingChat] = useState<string | null>(null);
  const handleDeleteConversation = async (chatId: string) => {
    if (!chatId || !user) return;
    if (!window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('nestc_token');
      await axios.delete(`${BASE_URL}/chat/conversations/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(prev => prev.filter(c => c.id !== chatId));
      handleBackToList();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete conversation.');
    }
  };

  useEffect(() => { 
    if (activeChat) setMobileView('chat'); 
  }, [activeChat?.id]);

  if (loading && !chats.length) {
    return <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white flex-col gap-4">
      <Loader2 className="animate-spin text-blue-500" size={48} />
      <p className="text-xs font-black uppercase tracking-widest opacity-40">Connecting to Messenger...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Dynamic Header */}
      <div className={`${mobileView === 'chat' ? 'hidden' : 'block'} md:block`}>
        <PageHeader title="Messenger" subtitle="Campus Trade Chat" />
      </div>

      <div className={`max-w-7xl mx-auto ${mobileView === 'chat' ? 'p-0 h-screen' : 'px-4 py-8'} md:px-4 md:py-8`}>
        <div className={`bg-white/[0.02] border border-white/10 ${mobileView === 'chat' ? 'rounded-0 h-full border-0' : 'rounded-[2.5rem] h-[750px] shadow-2xl'} md:rounded-[2.5rem] md:h-[750px] md:border md:shadow-2xl overflow-hidden flex backdrop-blur-3xl transition-all duration-500`}>
          
          {/* Sidebar / List View */}
          <div className={`${mobileView === 'chat' ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-96 border-r border-white/5 bg-black/40`}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Conversations</h2>
              <button onClick={() => user && fetchConversations(user.id)} className="p-2 hover:bg-white/5 rounded-full text-gray-600 transition-all active:rotate-180"><RefreshCw size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20 p-10 text-center">
                  <MessageSquare size={48} className="mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">No history yet</p>
                </div>
              ) : (
                chats.map(chat => (
                  <div 
                    key={chat.id} 
                    onClick={() => { setActiveChat(chat); setMobileView('chat'); }} 
                    className={`p-5 rounded-[1.5rem] cursor-pointer transition-all border ${activeChat?.id === chat.id ? 'bg-blue-600 border-blue-500 shadow-xl' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
                        {chat.productImage ? (
                          <img src={formatImageUrl(chat.productImage)} className="w-full h-full object-cover" />
                        ) : (
                          <User className="text-white/20" size={24} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-sm truncate pr-2">{chat.name}</span>
                          <span className="text-[9px] opacity-40 font-bold whitespace-nowrap">{chat.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {chat.productName && <Tag size={10} className="text-blue-400 flex-shrink-0" />}
                          <p className={`text-[10px] truncate ${activeChat?.id === chat.id ? 'text-white/70' : 'text-gray-500'}`}>
                            {chat.productName ? `${chat.productName}: ` : ''}{chat.lastMessage || 'Click to view chat'}
                          </p>
                        </div>
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-black text-white">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`${mobileView === 'list' ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-black/20 relative`}>
            {activeChat ? (
              <>
                <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <button onClick={handleBackToList} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"><ChevronLeft size={28}/></button>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg text-lg">
                      {activeChat.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-bold text-white leading-tight text-sm md:text-base">{activeChat.name}</h2>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{isConnected ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteConversation(activeChat.id)}
                    className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                    title="Delete Conversation"
                  >
                    <Trash2 size={20}/>
                  </button>
                </div>

                {errorMsg && (
                  <div className="bg-red-500/20 border-b border-red-500/30 p-2 text-center text-[10px] text-red-400 font-bold uppercase tracking-widest animate-pulse">
                    {errorMsg}
                  </div>
                )}

                <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/30" ref={scrollRef}>
                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id || msg.senderId === user?.id;
                    const content = msg.content || '';
                    
                    // Standard Message Rendering (Legacy format cleanup)
                    if (content.startsWith('PRODUCT_ENQUIRY:')) {
                      const parts = content.split(':');
                      const text = parts.slice(2).join(':');
                      // We treat legacy enquiries as plain messages now to avoid top-banner confusion
                      return (
                        <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-4 md:p-5 rounded-[2rem] text-sm leading-relaxed shadow-xl ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-300 rounded-tl-none border border-white/5'}`}>
                            <p className="text-[10px] font-black uppercase text-blue-400 mb-1 opacity-50">Legacy Inquiry</p>
                            {text}
                            <div className="flex justify-end mt-2 opacity-30 text-[9px] font-bold">
                              {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const productCtx = msg.product_context;

                    return (
                      <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {productCtx && (
                            <div className="mb-2 p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 w-fit max-w-full backdrop-blur-sm">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
                                {productCtx.photo ? (
                                  <img src={formatImageUrl(productCtx.photo)} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-full h-full p-2 opacity-20" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Regarding this product</p>
                                <p className="text-xs font-bold text-white truncate">{productCtx.title}</p>
                                <p className="text-[10px] text-white/50">₹{productCtx.price}</p>
                              </div>
                            </div>
                          )}
                          <div className={`p-4 md:p-5 rounded-[2rem] text-sm leading-relaxed shadow-xl relative ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-300 rounded-tl-none border border-white/5'}`}>
                            {content}
                            <div className="flex items-center justify-end mt-2 gap-1.5">
                              <span className="opacity-30 text-[9px] font-bold">
                                {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                <div className="flex items-center ml-0.5">
                                  {msg.is_pending ? (
                                    <Clock size={10} className="text-white/40" />
                                  ) : msg.is_read ? (
                                    <div className="flex -space-x-1.5">
                                      <Check size={12} className="text-blue-300" strokeWidth={3} />
                                      <Check size={12} className="text-blue-300" strokeWidth={3} />
                                    </div>
                                  ) : msg.is_delivered ? (
                                    <div className="flex -space-x-1.5">
                                      <Check size={12} className="text-white/40" strokeWidth={3} />
                                      <Check size={12} className="text-white/40" strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <Check size={12} className="text-white/40" strokeWidth={3} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-6 md:p-8 border-t border-white/5 bg-black/40 backdrop-blur-3xl">
                  <AnimatePresence>
                    {replyContext && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mb-4 p-4 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40">
                            {replyContext.photo ? (
                              <img src={formatImageUrl(replyContext.photo)} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-full h-full p-2 opacity-20" />
                            )}
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Replying regarding</p>
                            <h4 className="text-sm font-bold text-white">{replyContext.title}</h4>
                          </div>
                        </div>
                        <button onClick={() => setReplyContext(null)} className="p-2 hover:bg-white/10 rounded-full text-white/40"><X size={18}/></button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="flex gap-4">
                    <input 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-full px-6 md:px-8 py-4 md:py-5 text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner placeholder:text-gray-600 text-sm md:text-base" 
                      placeholder="Type a message..." 
                    />
                    <button onClick={handleSend} className="p-4 md:p-5 bg-blue-600 text-white rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all"><Send size={20}/></button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-10">
                <MessageSquare size={120} strokeWidth={1} className="mb-8" />
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">NestC Chat</h2>
                <p className="max-w-md font-medium">Select a student to start trading.</p>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin text-blue-500" size={48} /></div>}>
      <ChatContent />
    </Suspense>
  );
}
