'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, User } from 'lucide-react';
import api from '@/lib/api';

const HOSTEL_OPTIONS: Record<string, string[]> = {
  male: ['A Hostel', 'B Hostel', 'C Hostel', 'D Hostel', 'MBH1 (Old Mega)', 'MBH2'],
  female: ['MLH', 'LH 1', 'LH 2', 'LH 3', 'LH 4']
};



export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    hostel: '',
    room_number: '',
    phone: ''
  });
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [token, setToken] = useState('');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    if (step === 2 && resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [step, resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!/^[a-zA-Z]+_[a-zA-Z0-9]+@nitc\.ac\.in$/i.test(formData.email)) {
      setError('Please enter a valid NITC email ID (e.g. name_b240314cs@nitc.ac.in)');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', formData);
      setStep(2);
      setResendTimer(30);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', formData);
      setResendTimer(30);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-email', { 
        email: formData.email, 
        otp: otp.join('') 
      });
      setToken(res.data.token);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.password !== passwords.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/setup-password', {
        token,
        password: passwords.password,
        gender: formData.gender,
        hostel: formData.hostel,
        room_number: formData.room_number,
        phone: formData.phone
      });
      window.location.href = '/auth/login?verified=true';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to setup password.');
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
        className="glass-card w-full max-w-lg p-10"
      >
        {step === 1 ? (
          <>
            <h1 className="text-3xl font-bold mb-2 text-white text-center">Create Account</h1>
            <p className="text-gray-400 text-center mb-8">Join the NITC student community</p>

            {error && (
              <div className="md:col-span-2 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Arjun Menon"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2E75B6] transition-colors"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">NITC Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="arjun_b210000cs@nitc.ac.in"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2E75B6] transition-colors"
                  onChange={(e) => setFormData({...formData, email: e.target.value.trim()})}
                />
              </div>

              <div className="md:col-span-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send OTP'}
                </button>
              </div>
            </form>
          </>
        ) : step === 2 ? (
          <div className="text-center">
            <div className="mb-6 flex justify-center text-green-500">
              <CheckCircle2 size={64} />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">Verify Email</h2>
            <p className="text-gray-400 mb-8">We've sent a 6-digit code to <b>{formData.email}</b>. Please enter it below.</p>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <div className="flex justify-center gap-3 mb-8">
              {otp.map((digit, i) => (
                <input 
                  key={i}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const newOtp = [...otp];
                    newOtp[i] = e.target.value;
                    setOtp(newOtp);
                    // Auto-focus next
                    if (e.target.value && i < 5) {
                      const next = e.target.nextElementSibling as HTMLInputElement;
                      if (next) next.focus();
                    }
                  }}
                  className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold text-white focus:outline-none focus:border-[#2E75B6] transition-colors"
                />
              ))}
            </div>

            <button 
              onClick={handleVerify}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify'}
            </button>
            <div className="mt-4 flex flex-col items-center gap-2">
              <button 
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                className={`text-sm ${resendTimer > 0 ? 'text-gray-600' : 'text-[#2E75B6] hover:underline transition-colors'}`}
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </button>
              <button 
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Wait, I need to change my email
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Setup Password</h2>
            <p className="text-gray-400 mb-8">Create a secure password for your account.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <form onSubmit={handleSetupPassword} className="space-y-6">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2E75B6] transition-colors"
                  onChange={(e) => setPasswords({...passwords, password: e.target.value})}
                />
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-400 mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2E75B6] transition-colors"
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                />
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-400 mb-2">Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  {['male', 'female'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g, hostel: '' })}
                      className={`py-3 rounded-xl border transition-all capitalize ${
                        formData.gender === g
                          ? 'bg-[#2E75B6]/20 border-[#2E75B6] text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {formData.gender && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-left"
                >
                  <label className="block text-sm font-medium text-gray-400 mb-2">Hostel</label>
                  <select 
                    required
                    value={formData.hostel}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2E75B6] transition-colors appearance-none"
                    onChange={(e) => setFormData({...formData, hostel: e.target.value})}
                  >
                    <option value="" className="bg-[#0d0d0d]">Select Hostel</option>
                    {HOSTEL_OPTIONS[formData.gender].map((h) => (
                      <option key={h} value={h} className="bg-[#0d0d0d]">{h}</option>
                    ))}
                  </select>
                </motion.div>
              )}

              {formData.gender && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-left"
                >
                  <label className="block text-sm font-medium text-gray-400 mb-2">Room Number</label>
                  <input 
                    type="text" 
                    required
                    placeholder="A-101"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2E75B6] transition-colors"
                    onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                  />
                </motion.div>
              )}

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                <input 
                  type="text" 
                  required
                  placeholder="+91 9876543210"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2E75B6] transition-colors"
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Complete Registration'}
              </button>
            </form>
          </div>
        )}

        <p className="mt-8 text-center text-gray-400">
          Already have an account? {' '}
          <Link href="/auth/login" className="text-[#2E75B6] hover:underline font-medium">
            Login
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
