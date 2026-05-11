'use client';

import PageHeader from '@/components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Clock, Check, Loader2, ImageIcon, CheckCircle, Tag, ShoppingBag, ExternalLink, Image as ImagePlaceholder, AlertCircle, X, ChevronLeft, RefreshCw } from 'lucide-react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<any>(null);
  const hasSentAutoEnquiry = useRef<string | null>(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Fix: Remove double /api/v1 and ensure correct server path
    const cleanBase = BASE_URL.replace('/api/v1', '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  };

  const getDeterministicId = (uid1: string, uid2: string, lid?: string) => {
    const ids = [uid1, uid2].sort();
    const baseId = `p2p_${ids[0].substring(0, 8)}_${ids[1].substring(0, 8)}`;
    return lid ? `${baseId}_${lid.substring(0, 8)}` : baseId;
  };

  const fetchProductPreview = useCallback(async (lId: string) => {
    if (!lId || lId === 'null' || lId === 'undefined') return;
    if (productDataCache[lId]) return;
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`${BASE_URL}/marketplace/listings/${lId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProductDataCache(prev => ({ ...prev, [lId]: res.data }));
    } catch (e) {
      console.error('Failed to fetch product:', e);
    }
  }, [productDataCache]);

  const fetchMessages = async (chatId: string) => {
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`${BASE_URL}/chat/messages/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      if (!chatId.startsWith('temp_') && !chatId.startsWith('p2p_')) {
        setErrorMsg('History could not be loaded.');
      }
    }
  };

  const fetchConversations = async (userId: string) => {
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.get(`${BASE_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let list = res.data.map((c: any) => ({
        id: c.id,
        name: c.other_user_name || 'Student',
        sellerId: c.other_user_id,
        listingId: c.listing_id,
        chatSellerId: c.chat_seller_id,
        lastMessage: c.last_message,
        time: c.last_message_time ? new Date(c.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
        unreadCount: parseInt(c.unread_count) || 0,
        isTemp: false
      }));

      if (sellerId && urlListingId) {
        const detId = getDeterministicId(userId, sellerId, urlListingId);
        
        const exists = list.find((c: any) => c.id === detId);
        if (!exists) {
          const newEntry = {
            id: detId,
            name: urlSellerName || 'Student',
            sellerId: sellerId,
            listingId: urlListingId,
            isTemp: true,
            time: 'Now',
            lastMessage: 'Regarding: ' + (urlTitle || 'Product')
          };
          list = [newEntry, ...list];
          if (!activeChatRef.current) setActiveChat(newEntry);
        } else if (!activeChatRef.current) {
          setActiveChat(exists);
        }
      } else if (!activeChatRef.current && list.length > 0) {
        setActiveChat(list[0]);
      }
      
      setChats(list);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // ... (useEffect for user/socket stays same)

  useEffect(() => {
    if (activeChat?.id) {
      fetchMessages(activeChat.id);
      socketRef.current?.emit('join_chat', activeChat.id);
    }
  }, [activeChat?.id]);

  useEffect(() => {
    if (urlListingId && urlTitle && !productDataCache[urlListingId]) {
      setProductDataCache(prev => ({
        ...prev,
        [urlListingId]: { title: urlTitle, price: urlPrice, photo_url: urlImg }
      }));
    }
  }, [urlListingId, urlTitle, urlImg]);

  // ... (enquiry logic stays same)

  const handleSend = () => {
    if (!message.trim() || !activeChat || !user) return;
    const content = message.trim();
    const messageData = {
      chatId: activeChat.id,
      senderId: user.id,
      receiverId: activeChat.sellerId || activeChat.chatSellerId,
      content,
      listingId: activeChat.listingId
    };
    socketRef.current?.emit('send_message', messageData);
    setMessages(prev => [...prev, { id: 'temp_'+Date.now(), sender_id: user.id, content, created_at: new Date().toISOString() }]);
    setMessage('');
  };

  const handleRefresh = () => {
    if (user?.id) fetchConversations(user.id);
    if (activeChat?.id) fetchMessages(activeChat.id);
  };

  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  useEffect(() => { if (activeChat) setMobileView('chat'); }, [activeChat?.id]);

  return (
    <div className="min-h-screen bg-[#050505]">
      <PageHeader title="Messenger" subtitle="Live Trade Chat" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden flex h-[750px] shadow-2xl backdrop-blur-3xl">
          
          <div className={`${mobileView === 'chat' ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-96 border-r border-white/5`}>
            <div className="p-8 border-b border-white/5">
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {chats.map(chat => (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChat(chat)}
                  className={`p-5 rounded-3xl cursor-pointer transition-all border ${activeChat?.id === chat.id ? 'bg-blue-600 border-blue-500 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white text-sm">{chat.name}</span>
                    <span className="text-[10px] opacity-40">{chat.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage?.startsWith('PRODUCT_ENQUIRY:') ? '📦 Product Interest' : chat.lastMessage}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${mobileView === 'list' ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-black/20`}>
            {activeChat ? (
              <>
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setMobileView('list')} className="md:hidden p-2 -ml-2 text-gray-400"><ChevronLeft /></button>
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg">{activeChat.name.charAt(0)}</div>
                    <div>
                      <h2 className="font-bold text-white">{activeChat.name}</h2>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{isConnected ? 'Active' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleRefresh} className="p-2 hover:bg-white/10 rounded-full text-gray-500"><RefreshCw size={20}/></button>
                </div>

                <div className="flex-1 p-8 overflow-y-auto space-y-6 custom-scrollbar">
                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    const isProductEnquiry = msg.content?.startsWith('PRODUCT_ENQUIRY:');
                    
                    if (isProductEnquiry) {
                      const parts = msg.content.split(':');
                      const lId = parts[1];
                      const text = parts.slice(2).join(':');
                      const product = productDataCache[lId];
                      // Exhaustive image detection
                      const photoUrl = product?.photo_url || 
                                       product?.photos?.[0] || 
                                       product?.imageUrl || 
                                       product?.photo;

                      return (
                        <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-3xl overflow-hidden shadow-2xl border ${isMe ? 'bg-blue-600 border-blue-500' : 'bg-white/10 border-white/10'}`}>
                            <div className="p-3 flex items-center gap-4 bg-black/20 border-b border-white/5">
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/10">
                                {photoUrl ? (
                                  <img 
                                    src={formatImageUrl(photoUrl)} 
                                    className="w-full h-full object-cover" 
                                    onError={(e: any) => { e.target.src = ''; e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <ImagePlaceholder className="w-full h-full p-4 opacity-20" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[8px] font-black uppercase text-blue-400 mb-1">Product Enquiry</p>
                                <p className="text-sm font-bold text-white truncate">{product?.title || 'Loading...'}</p>
                                <p className="text-xs font-black text-white/70">₹{product?.price || '...'}</p>
                              </div>
                            </div>
                            <div className="p-5 text-sm text-white">{text}</div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-5 rounded-[2rem] text-sm shadow-xl ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-gray-300 rounded-tl-none border border-white/10'}`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>

                <div className="p-8 border-t border-white/5 bg-black/40">
                  <div className="flex gap-4">
                    <input 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-[2rem] px-8 py-5 text-white focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="Type a message..."
                    />
                    <button onClick={handleSend} className="p-5 bg-blue-600 text-white rounded-[2rem] shadow-xl hover:scale-105 transition-all"><Send size={20}/></button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-10">
                <MessageSquare size={80} className="mb-6" />
                <h2 className="text-3xl font-black uppercase tracking-tighter">NestC Messenger</h2>
                <p>Select a student to start trading.</p>
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
