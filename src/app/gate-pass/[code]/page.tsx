'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, QrCode, Clock, MapPin, Navigation, User, Car, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

export default function GatePassPage() {
  // Use 'code' as the parameter name to match the directory structure
  const { code } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPass = async () => {
      try {
        const token = localStorage.getItem('nestc_token');
        const res = await axios.get(`${API_URL}/bookings/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // We find the booking using the 'code' from URL (which is the booking ID)
        const current = res.data.find((b: any) => b.id === code);
        setBooking(current);
      } catch (err) {
        console.error('Pass fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    if (code) fetchPass();
  }, [code]);

  if (loading) return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-white font-black uppercase tracking-widest">Loading Digital Pass...</div>;

  return (
    <div className="min-h-screen">
      <PageHeader title="Security Gate Pass" subtitle="Digital Entry Authorization" />
      
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="glass-card relative overflow-hidden p-1 bg-white/[0.02] border-white/5">
           {/* Authentic Pass Header */}
           <div className="bg-emerald-600 p-8 text-center relative overflow-hidden rounded-[2.5rem_2.5rem_0_0]">
              <div className="absolute top-0 right-0 p-8 opacity-20"><ShieldCheck size={120} /></div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Verified Entry</h2>
              <p className="text-emerald-100 font-black text-[10px] uppercase tracking-[0.3em]">NITC Campus Security</p>
           </div>

           {/* Pass Body */}
           <div className="p-10 space-y-10">
              <div className="flex flex-col items-center gap-6">
                 <div className="w-48 h-48 bg-white p-4 rounded-3xl shadow-2xl">
                    <QrCode size={160} className="text-black" />
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1 text-center w-full">Pass ID</p>
                    <p className="text-lg font-black text-white uppercase">{booking?.booking_code || 'NESTC-PASS'}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8 border-y border-white/5 py-10">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Entry Time</p>
                    <p className="text-sm font-bold text-white uppercase">{booking?.accepted_at ? new Date(booking.accepted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Expires In</p>
                    <p className="text-sm font-bold text-emerald-500 uppercase">35 Minutes</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Driver</p>
                    <p className="text-sm font-bold text-white truncate">{booking?.driver_name || 'Assigned Driver'}</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Vehicle</p>
                    <p className="text-sm font-bold text-white uppercase">{booking?.vehicle_number || 'KL-11-AUTO'}</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500"><MapPin size={20} /></div>
                    <div className="min-w-0">
                       <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Pickup</p>
                       <p className="text-xs font-bold text-gray-300 truncate">{booking?.pickup_location || 'Campus Main Gate'}</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-500"><Navigation size={20} /></div>
                    <div className="min-w-0">
                       <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Destination</p>
                       <p className="text-xs font-bold text-gray-300 truncate">{booking?.destination || 'NITC Hostel Area'}</p>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-emerald-600/5 rounded-3xl border border-emerald-600/20 flex items-center gap-4">
                 <CheckCircle2 size={24} className="text-emerald-500" />
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-relaxed">Present this digital pass to the security guard at the gate for verified campus entry.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
