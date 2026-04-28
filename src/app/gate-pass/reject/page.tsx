'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, XCircle } from 'lucide-react';
import axios from 'axios';

function RejectContent() {
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

    const rejectRide = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        // We'll call the reject endpoint
        await axios.post(`${API_BASE}/bookings/${bid}/reject`, {
          driverId: did
        });
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setError(err.response?.data?.error || 'Failed to reject ride.');
      }
    };

    rejectRide();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-card p-12 text-center border-white/5">
        {status === 'loading' && (
          <div className="space-y-6">
            <Loader2 size={64} className="text-red-500 animate-spin mx-auto" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Processing...</h2>
            <p className="text-gray-500 font-medium">Registering your rejection.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-red-600/40">
               <XCircle size={48} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Ride Rejected</h2>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
               <p className="text-gray-400 text-sm leading-relaxed">The student has been notified and they will search for another driver. You can close this tab.</p>
            </div>
            <button onClick={() => window.close()} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all">Close Tab</button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-8">
            <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
               <AlertCircle size={48} className="text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Error</h2>
            <p className="text-red-500 font-bold text-sm">{error}</p>
            <button onClick={() => window.close()} className="w-full py-4 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest border border-white/10">Close Tab</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RejectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RejectContent />
    </Suspense>
  );
}
