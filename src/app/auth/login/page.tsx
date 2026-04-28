'use client';

import { motion } from 'framer-motion';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      // Save token and user info
      localStorage.setItem('nestc_token', token);
      localStorage.setItem('nestc_user', JSON.stringify(user));

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#0d0d0d]">
      <div className="absolute top-8 left-8">
        <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft size={20} /> Back to Home
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-10"
      >
        <h1 className="text-3xl font-bold mb-2 text-white text-center">Welcome Back</h1>
        <p className="text-gray-400 text-center mb-8">Login with your NITC email</p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}


        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">NITC Email</label>
            <input 
              type="email" 
              required
              placeholder="example@nitc.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2E75B6] transition-colors"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-400">Password</label>
              <Link href="/auth/forgot-password" className="text-sm text-[#2E75B6] hover:underline">
                Forgot Password?
              </Link>
            </div>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2E75B6] transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400">
          Don't have an account? {' '}
          <Link href="/auth/register" className="text-[#2E75B6] hover:underline font-medium">
            Register
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
