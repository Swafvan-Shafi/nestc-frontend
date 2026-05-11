'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, MapPin, Navigation, CheckCircle2, Loader2, MessageCircle, ShieldCheck, Locate, X, Navigation2, QrCode, Search, ExternalLink, RefreshCw, Map as MapIcon } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { reverseGeocode, getPlacesAutocomplete, getPlaceDetails } from './actions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

const VERIFIED_DRIVERS = [
  { id: 'd1', name: 'Meharuba', phone: '9037463202', status: 'available' },
  { id: 'd2', name: 'Swafvan', phone: '7994480054', status: 'available' },
  { id: 'd3', name: 'Noorjahan', phone: '9895860054', status: 'available' },
  { id: 'd4', name: 'Ameekh', phone: '7306634360', status: 'available' },
  { id: 'd5', name: 'Rithu', phone: '9747880011', status: 'available' }
];

// Dynamically import Map components with SSR disabled
const MapPicker = dynamic(() => import('@/components/RideMap').then(mod => mod.MapPicker), { ssr: false });
const MapViewer = dynamic(() => import('@/components/RideMap').then(mod => mod.MapViewer), { ssr: false });

const NIT_CAMPUS_PLACES = [
  "Main Gate", "Mega Hostel", "Old Mega Hostel", "MBH2", "LH 1", "LH 2", "Library", "CSED",
  "Main Building", "Cafeteria", "Sports Complex", "Auditorium", "R&C Block", "ECED"
];

export default function BookPage() {
  const [status, setStatus] = useState<'idle' | 'searching' | 'requesting' | 'accepted' | 'arrived'>('idle');
  const [suggestedDrivers, setSuggestedDrivers] = useState<any[]>(VERIFIED_DRIVERS);
  const [currentDriverIndex, setCurrentDriverIndex] = useState(0);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCampusMap, setShowCampusMap] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);
  
  const [formData, setFormData] = useState({
    pickup: '',
    pickupLat: null as number | null,
    pickupLng: null as number | null,
    destination: '',
    hostel: 'H1',
    type: 'auto'
  });

  const pollInterval = useRef<any>(null);
  const searchTimeout = useRef<any>(null);
  const pickupTimeout = useRef<any>(null);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pickup || !formData.destination) {
      alert('Please enter both pickup and destination');
      return;
    }

    setStatus('searching');
    try {
      const token = localStorage.getItem('nestc_token');
      const res = await axios.post(`${API_URL}/bookings`, {
        vehicle_type: formData.type,
        pickup_location: formData.pickup,
        pickup_lat: formData.pickupLat,
        pickup_lng: formData.pickupLng,
        destination: formData.destination,
        hostel: formData.hostel,
        scheduled_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const bookingData = res.data.booking;
      let drivers = res.data.suggestedDrivers;
      
      // Emergency client-side sort if backend fails distance check
      if (!drivers || drivers.length === 0) {
        drivers = VERIFIED_DRIVERS;
      }
      
      setActiveBooking(bookingData);
      setSuggestedDrivers(drivers);
      
      setStatus('requesting');
      startPolling(bookingData.id);
    } catch (err: any) {
      console.error('Request Error:', err);
      const msg = err.response?.data?.error || err.message || 'Server connection failed';
      alert(`Request failed: ${msg}. Please ensure the backend is running.`);
      setStatus('idle');
    }
  };

  const parseGoogleMapsLink = async (url: string, field: 'pickup' | 'destination') => {
    try {
      // Standard @lat,lng format
      let match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      
      // Fallback for ll=lat,lng or q=lat,lng
      if (!match) match = url.match(/[?&](?:ll|q|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`);
        const data = await res.json();
        const addr = data.display_name;
        if (field === 'pickup') {
          setFormData(prev => ({ ...prev, pickup: addr, pickupLat: lat, pickupLng: lng }));
        } else {
          setFormData(prev => ({ ...prev, destination: addr }));
        }
        return true;
      }
    } catch (e) { console.error('Link parse error:', e); }
    return false;
  };

  const handlePickupChange = async (val: string) => {
    if (val.startsWith('https://')) {
      const success = await parseGoogleMapsLink(val, 'pickup');
      if (success) return;
    }
    setFormData({ ...formData, pickup: val });
    if (pickupTimeout.current) clearTimeout(pickupTimeout.current);
    if (val.length < 3) {
      setPickupSuggestions([]);
      return;
    }
    pickupTimeout.current = setTimeout(async () => {
      try {
        const data = await getPlacesAutocomplete(val);
        if (data.predictions) {
          setPickupSuggestions(data.predictions);
        }
      } catch (e) { console.error('Autocomplete error:', e); }
    }, 300);
  };

  const selectPickupSuggestion = async (place_id: string, description: string) => {
    setFormData(prev => ({ ...prev, pickup: description }));
    setPickupSuggestions([]);
    try {
      const data = await getPlaceDetails(place_id);
      if (data.result && data.result.geometry) {
        setFormData(prev => ({
          ...prev,
          pickupLat: data.result.geometry.location.lat,
          pickupLng: data.result.geometry.location.lng
        }));
      }
    } catch (e) { console.error('Place details error:', e); }
  };

  const handleDestChange = async (val: string) => {
    if (val.startsWith('https://')) {
      const success = await parseGoogleMapsLink(val, 'destination');
      if (success) return;
    }
    setFormData({ ...formData, destination: val });
  };

  const startPolling = (bookingId: string) => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    pollInterval.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('nestc_token');
        const res = await axios.get(`${API_URL}/bookings/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const current = res.data.find((b: any) => b.id === bookingId || b.booking_code === bookingId);
        if (current) {
          if (current.status === 'accepted') {
            setActiveBooking(current);
            setStatus('accepted');
            clearInterval(pollInterval.current);
          } else if (current.driver_response === 'rejected') {
            // Keep waiting for other drivers
          }
        }
      } catch (e) {}
    }, 3000);
  };

  // Removed tryNextDriver and sendWhatsAppToDriver because backend handles dispatching to all free drivers.

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setToastMessage('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const data = await reverseGeocode(latitude, longitude);
        if (data.results && data.results.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            pickup: data.results[0].formatted_address,
            pickupLat: latitude,
            pickupLng: longitude
          }));
        } else {
          setFormData(prev => ({ 
            ...prev, 
            pickup: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            pickupLat: latitude,
            pickupLng: longitude
          }));
        }
      } catch (e) {
        setFormData(prev => ({ 
          ...prev, 
          pickup: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          pickupLat: latitude,
          pickupLng: longitude
        }));
      } finally { setIsLocating(false); }
    }, (err) => {
      setIsLocating(false);
      if (err.code === err.PERMISSION_DENIED) {
        setToastMessage('Location permission denied. Please allow location access in your browser settings.');
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setToastMessage('Device location is turned off.');
      } else {
        setToastMessage('Unable to fetch location. Please type your pickup point.');
      }
    }, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    });
  };

  if (!mounted) return <div className="min-h-screen bg-[#0a0a0b]" />;

  return (
    <div className="min-h-screen relative">
      <PageHeader title="Book a Ride" subtitle="Secure Automated Dispatch" />

      <AnimatePresence>
        {showCampusMap && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><MapIcon className="text-blue-500" /> NITC Campus Places</h3>
                <button onClick={() => setShowCampusMap(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {NIT_CAMPUS_PLACES.map((place) => (
                  <button
                    key={place}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, pickup: place }));
                      setShowCampusMap(false);
                    }}
                    className="p-4 bg-white/5 hover:bg-blue-600/20 hover:border-blue-500/50 border border-white/5 rounded-2xl text-sm font-bold text-gray-300 hover:text-white transition-all text-left flex flex-col gap-2"
                  >
                    <MapPin size={16} className="text-blue-500" />
                    {place}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="glass-card p-10 relative overflow-hidden border-white/5">
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
               <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
               Ride Request
            </h2>

            <div className="flex p-1.5 bg-white/5 rounded-2xl mb-10 border border-white/5">
              <button onClick={() => setFormData({...formData, type: 'auto'})} className={`flex-1 py-4 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest ${formData.type === 'auto' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Auto Rickshaw</button>
              <button onClick={() => setFormData({...formData, type: 'taxi'})} className={`flex-1 py-4 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest ${formData.type === 'taxi' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Taxi Cab</button>
            </div>

            <form onSubmit={handleRequest} className="space-y-8">
              <div className="group relative">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-2">Pickup Point</label>
                <div className="relative flex flex-col sm:block">
                  <button 
                    type="button"
                    onClick={() => setShowCampusMap(true)}
                    className="absolute left-4 sm:left-5 top-[1.5rem] sm:top-1/2 -translate-y-1/2 text-blue-500 hover:text-white transition-all z-10 p-2 -ml-2 rounded-lg hover:bg-blue-600/20"
                    title="Select Campus Place"
                  >
                    <MapIcon size={18} />
                  </button>
                  <input 
                    type="text" 
                    placeholder="Select map icon or type location..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 sm:pl-16 pr-4 sm:pr-32 py-4 sm:py-5 text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                    value={formData.pickup}
                    onChange={(e) => handlePickupChange(e.target.value)}
                  />
                  <div className="flex sm:absolute sm:right-3 sm:top-1/2 sm:-translate-y-1/2 gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                    <button type="button" onClick={getCurrentLocation} className="flex-[2] sm:flex-none px-4 py-3 sm:py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-center items-center">
                      {isLocating ? <Loader2 size={14} className="animate-spin" /> : 'Locate Me'}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                   {pickupSuggestions.length > 0 && (
                     <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute left-0 right-0 top-full mt-2 bg-[#0d0d0e] border border-white/10 rounded-2xl shadow-2xl z-[2000] overflow-hidden">
                        {pickupSuggestions.map((item, idx) => (
                          <div key={idx} onClick={() => selectPickupSuggestion(item.place_id, item.description)} className="p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 flex gap-4 items-center">
                             <div className="text-blue-500"><MapPin size={14} /></div>
                             <div className="min-w-0 text-left"><p className="text-sm font-bold text-white truncate">{item.structured_formatting?.main_text || item.description.split(',')[0]}</p><p className="text-[9px] text-gray-500 truncate">{item.structured_formatting?.secondary_text || item.description}</p></div>
                          </div>
                        ))}
                     </motion.div>
                   )}
                </AnimatePresence>
              </div>

              <div className="group relative">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-2">Destination</label>
                <div className="relative flex flex-col sm:block">
                  <div className="absolute left-4 sm:left-5 top-[1.5rem] sm:top-1/2 -translate-y-1/2 text-emerald-500"><MapPin size={18} /></div>
                  <input 
                    type="text" 
                    placeholder="Type destination..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 sm:pl-16 pr-4 py-4 sm:py-5 text-white focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                    value={formData.destination}
                    onChange={(e) => handleDestChange(e.target.value)}
                  />
                </div>

              </div>

              {showMap && <MapPicker key="picker" onSelect={(addr) => { setFormData(prev => ({ ...prev, destination: addr })); setShowMap(false); }} />}
              
              {!showMap && formData.pickupLat && formData.pickupLng && (
                <div className="mt-4" />
              )}

              <button type="submit" disabled={status !== 'idle'} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-30">
                Find Nearest Free Driver <Car size={20} />
              </button>
            </form>
          </div>

          <div className="glass-card bg-white/[0.01] flex flex-col p-10 items-center justify-center relative min-h-[450px] border-white/5 text-center">
             <AnimatePresence mode="wait">
                {status === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10"><ShieldCheck size={40} className="text-gray-700" /></div>
                     <h3 className="text-xl font-black text-white/40 uppercase tracking-widest">NITC Dispatcher</h3>
                     <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em] mt-2">Verified Campus Logistics</p>
                  </motion.div>
                )}

                {status === 'requesting' && (
                  <motion.div key="requesting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-8">
                     <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 mb-6 border border-blue-600/20">
                           <Loader2 size={32} className="animate-spin" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Request Broadcasted</h3>
                        <p className="text-sm text-gray-400 max-w-xs mx-auto mb-8">
                           We have sent WhatsApp notifications to all free drivers. Waiting for someone to accept...
                        </p>
                        
                        <div className="flex items-center justify-center gap-3 px-6 py-3 bg-blue-600/5 rounded-2xl border border-blue-600/10">
                           <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                           <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                              Monitoring Driver Responses
                           </p>
                        </div>
                     </div>
                  </motion.div>
                )}

                {status === 'accepted' && (
                  <motion.div key="accepted" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">
                     <div className="p-10 bg-emerald-600/10 rounded-[3rem] border border-emerald-600/20">
                        <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"><CheckCircle2 size={40} className="text-white" /></div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Ride Confirmed!</h2>
                        <div className="my-8 p-6 bg-black/40 rounded-3xl border border-white/5 space-y-3">
                           <div className="flex justify-between text-[10px] font-black"><span className="text-gray-600 uppercase">Code</span><span className="text-white uppercase">{activeBooking?.booking_code || 'NITC-RIDE'}</span></div>
                           <div className="flex justify-between text-[10px] font-black"><span className="text-gray-600 uppercase">Status</span><span className="text-emerald-500 uppercase">Driver En Route</span></div>
                        </div>
                        <Link href={`/gate-pass/${activeBooking?.id || activeBooking?.booking_code}`} className="w-full py-5 bg-white text-black hover:bg-gray-200 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3">Digital Gate Pass <QrCode size={20} /></Link>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }} className="fixed bottom-10 left-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl border border-white/10 z-[5000] text-sm font-medium flex items-center gap-3">
             <X size={16} className="text-red-500" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
