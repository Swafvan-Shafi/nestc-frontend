'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [token, setToken] = useState('');

  useEffect(() => {
    if (step === 2 && resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [step, resendTimer]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
      setResendTimer(30);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
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
        email, 
        otp: otp.join('') 
      });
      setToken(res.data.token);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.password !== passwords.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', {
        token,
        password: passwords.password
      });
      window.location.href = '/auth/login?reset=true';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#0d0d0d]">
      <div className="absolute top-8 left-8">
        <Link href="/auth/login" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft size={20} /> Back to Login
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-10"
      >
        {step === 1 ? (
          <>
            <h1 className="text-3xl font-bold mb-2 text-white text-center">Forgot Password?</h1>
            <p className="text-gray-400 text-center mb-8">Enter your registered email to reset it.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Registered Email ID</label>
                <input 
                  type="email" 
                  required
                  placeholder="name_b240314cs@nitc.ac.in"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2E75B6] transition-colors"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send OTP'}
              </button>
            </form>
          </>
        ) : step === 2 ? (
          <div className="text-center">
            <div className="mb-6 flex justify-center text-[#2E75B6]">
              <CheckCircle2 size={64} />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">Verify OTP</h2>
            <p className="text-gray-400 mb-8">We've sent a 6-digit code to <b>{email}</b>. Please enter it below.</p>
            
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
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Reset Password</h2>
            <p className="text-gray-400 mb-8">Create a new secure password for your account.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2E75B6] transition-colors"
                  onChange={(e) => setPasswords({...passwords, password: e.target.value})}
                />
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2E75B6] transition-colors"
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </main>
  );
}
