'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Tag, IndianRupee, MapPin, AlertCircle, CheckCircle2, ChevronDown, Image as ImageIcon, X, Link as LinkIcon } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const categories = ['Books', 'Electronics', 'Cycles', 'Stationery', 'Lab', 'Clothing', 'Other'];

export default function PostListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLink, setImageLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: 'Books',
    type: 'Have',
    urgent: false,
    description: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Show local preview instantly
      const localPreview = URL.createObjectURL(file);
      setImagePreview(localPreview);

      // 2. Convert to Base64 so it can be shared with other users
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageLink(base64String); // This is the real "shared link"
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (formData.type === 'Have' && !imageLink) {
      setErrorMsg('Please wait for the photo to finish processing or upload a photo.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('nestc_token');

      await axios.post('http://127.0.0.1:5000/api/v1/marketplace/listings', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        price: parseInt(formData.price) || 0,
        is_urgent: formData.urgent,
        is_free: parseInt(formData.price) === 0,
        photo: imageLink // This now contains the Base64 data visible to everyone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLoading(false);
      setSuccess(true);
      setTimeout(() => router.push('/marketplace'), 2000);
    } catch (err: any) {
      console.error('Post failed:', err);
      const data = err.response?.data;
      const detailedError = data?.details || data?.error || err.message;
      setErrorMsg(detailedError);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Listing Posted!</h2>
          <p className="text-gray-500">Your post is now visible to all students.</p>
        </motion.div>
      </div>
    );
  }

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
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all ${formData.type === 'Have' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'}`}
              >
                Selling an Item
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'Want'})}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all ${formData.type === 'Want' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-gray-500 hover:text-white'}`}
              >
                Requesting an Item
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
                      onClick={() => { setImagePreview(null); setImageLink(null); }}
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
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Price (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    required
                    type="text" 
                    placeholder="0 for Free"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-blue-500 transition-colors outline-none"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>
              
              <div 
                onClick={() => setFormData({...formData, urgent: !formData.urgent})}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-all ${formData.urgent ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/10' : 'bg-white/5 border-white/10 text-gray-500'}`}
              >
                <AlertCircle size={24} />
                <div>
                  <p className="font-bold text-sm">Mark as Urgent</p>
                  <p className="text-[10px] opacity-60 uppercase tracking-widest">Fast Track Sale</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Description</label>
              <textarea 
                rows={4}
                placeholder="Product details..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-blue-500 transition-colors outline-none resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full btn-primary py-5 text-lg font-black uppercase tracking-widest shadow-2xl"
          >
            {loading ? 'Posting to Campus...' : 'Finish & Post Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
