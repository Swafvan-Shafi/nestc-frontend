'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import axios from 'axios';

function AcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const bid = searchParams.get('bid');
    const did = searchParams.get('did');

    if (!bid || !did) {
      setStatus('error');
      setError('Invalid link parameters.');
      return;
    }

    const acceptRide = async () => {
      try {
        const token = localStorage.getItem('nestc_token');
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        // We'll call the accept endpoint
        await axios.post(`${API_BASE}/bookings/${bid}/accept`, {
          driverId: did,
          location: {
            lat: 11.3216, // Default to gate for demo
            lng: 75.9338
          }
        });
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setError(err.response?.data?.error || 'Failed to accept ride. Maybe it was taken?');
      }
    };

    acceptRide();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-card p-12 text-center border-white/5">
        {status === 'loading' && (
          <div className="space-y-6">
            <Loader2 size={64} className="text-blue-500 animate-spin mx-auto" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Processing Ride...</h2>
            <p className="text-gray-500 font-medium">Validating your driver credentials and booking status.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-600/40">
               <CheckCircle2 size={48} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Ride Accepted!</h2>
            <p className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">You are now BUSY for this trip</p>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
               <p className="text-gray-400 text-sm leading-relaxed">The student has been notified. Please head to the pickup location.</p>
            </div>
            <div className="space-y-4">
              <button onClick={() => router.push(`/gate-pass/${searchParams.get('bid')}`)} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all">View Digital Gate Pass</button>
              <button onClick={() => window.close()} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all">Close Tab</button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-8">
            <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
               <AlertCircle size={48} className="text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Request Failed</h2>
            <p className="text-red-500 font-bold text-sm">{error}</p>
            <button onClick={() => window.close()} className="w-full py-4 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest border border-white/10">Close Tab</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptContent />
    </Suspense>
  );
}
