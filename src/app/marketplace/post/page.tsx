'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Tag, IndianRupee, MapPin, AlertCircle, CheckCircle2, ChevronDown, Image as ImageIcon, X, Link as LinkIcon } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { BASE_URL } from '@/lib/api';

const API_URL = BASE_URL;
const categories = ['Books', 'Electronics', 'Cycles', 'Stationery', 'Lab', 'Clothing', 'Other'];

export default function PostListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [hasUrgent, setHasUrgent] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: 'Books',
    type: 'Have',
    urgent: false,
    description: ''
  });

  useEffect(() => {
    const checkUrgent = async () => {
      try {
        const token = localStorage.getItem('nestc_token');
        if (!token) return;
        const savedUser = localStorage.getItem('nestc_user');
        if (!savedUser) return;
        const user = JSON.parse(savedUser);
        
        const res = await axios.get(`${API_URL}/marketplace/listings`, {
          params: { sellerId: user.id },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const myActiveUrgent = res.data.some((l: any) => l.is_urgent && l.status === 'active');
        setHasUrgent(myActiveUrgent);
      } catch (err) {
        console.error('Failed to check urgent listings', err);
      }
    };
    checkUrgent();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setErrorMsg('Please select a valid image file (PNG, JPG, etc).');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMsg('File size must be less than 5MB.');
        return;
      }
      setFile(selectedFile);
      const localPreview = URL.createObjectURL(selectedFile);
      setImagePreview(localPreview);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (formData.type === 'Have' && !file) {
      setErrorMsg('Please upload a product photo.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('nestc_token');
      
      let uploadedImageUrl = null;
      if (file) {
        const uploadData = new FormData();
        uploadData.append('image', file);
        
        const uploadRes = await axios.post(`${API_URL}/upload`, uploadData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        uploadedImageUrl = uploadRes.data.imageUrl;
      }

      const submitData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        price: formData.price,
        is_urgent: formData.urgent,
        is_free: parseInt(formData.price) === 0 || 0,
        imageUrl: uploadedImageUrl
      };

      await axios.post(`${API_URL}/marketplace/listings`, submitData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setLoading(false);
      router.push(formData.type === 'Have' ? '/marketplace' : '/marketplace/requests');
    } catch (err: any) {
      console.error('Post failed:', err);
      let msg = 'Network issue. Check your connection.';
      if (err.response) {
        const status = err.response.status;
        if (status === 401) msg = 'Please login again.';
        else if (status === 403) msg = 'You are not allowed to do this.';
        else if (status === 500) msg = 'Server error. Please try again.';
        else msg = err.response.data?.error || err.response.data?.details || 'Something went wrong.';
      }
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Post Listing" subtitle="Share with the community" />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="glass-card p-10 space-y-10">
          
          {errorMsg && (
            <div className="p-6 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-start gap-4">
               <AlertCircle className="text-red-500 shrink-0" size={24} />
               <div>
                  <p className="text-sm font-bold text-red-500">Upload Issue</p>
                  <p className="text-xs text-red-500/70 mt-1 uppercase tracking-widest font-black leading-relaxed">{errorMsg}</p>
               </div>
            </div>
          )}

          <div className="space-y-4">
             <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Listing Type</label>
            <div className="flex p-1.5 bg-white/5 rounded-2xl w-full border border-white/5">
              <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'Have'})}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all text-sm sm:text-base ${formData.type === 'Have' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'}`}
              >
                Sell item
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'Want'})}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all text-sm sm:text-base ${formData.type === 'Want' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-gray-500 hover:text-white'}`}
              >
                Request item
              </button>
            </div>
          </div>

          {formData.type === 'Have' && (
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Product Photo</label>
              <div className="relative min-h-[300px] w-full bg-white/[0.02] rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group hover:border-blue-500/50 transition-colors p-4">
                {imagePreview ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img src={imagePreview} className="max-w-full max-h-[400px] object-contain rounded-xl shadow-2xl" />
                    <button 
                      type="button"
                      onClick={() => { setImagePreview(null); setFile(null); }}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/10 transition-colors text-gray-500 group-hover:text-blue-500">
                      <Camera size={32} />
                    </div>
                    <p className="text-base font-bold text-gray-400">Click to upload photo</p>
                  </div>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* Same form fields as before... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Item Title</label>
                <div className="relative">
                   <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                   <input 
                    required
                    type="text" 
                    placeholder="e.g. Hero Cycle"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-blue-500 transition-colors outline-none"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Category</label>
                <div className="relative">
                  <select 
                    className="w-full bg-[#1a1a1b] border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-blue-500 transition-colors outline-none appearance-none cursor-pointer"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-[#1a1a1b] py-2">{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
                  {formData.type === 'Have' ? 'Price (₹)' : 'Maximum Budget (₹)'}
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    required={formData.type === 'Have'}
                    type="text" 
                    placeholder={formData.type === 'Have' ? "200" : "Enter maximum budget"}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-blue-500 transition-colors outline-none"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>
              
              <div 
                onClick={() => {
                  if (hasUrgent && !formData.urgent) {
                    setErrorMsg('You already have one urgent listing. Remove it or wait until it expires.');
                  } else {
                    setFormData({...formData, urgent: !formData.urgent});
                  }
                }}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-all ${formData.urgent ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/10' : 'bg-white/5 border-white/10 text-gray-500'}`}
              >
                <AlertCircle size={24} />
                <div>
                  <p className="font-bold text-sm">Mark as Urgent</p>
                  <p className="text-[10px] opacity-60 uppercase tracking-widest">Fast Track Sale (Expires in 24h)</p>
                </div>
              </div>
            </div>

            {formData.type === 'Have' && (
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe the condition, age, and any other details..."
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white focus:border-blue-500 transition-colors outline-none resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            )}
          </div>

          <button 
            disabled={loading}
            className="w-full btn-primary py-5 text-lg font-black uppercase tracking-widest shadow-2xl"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
