'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Map as MapIcon, MapPin, Navigation, Navigation2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issues in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const NITC_BOUNDS = '75.9200,11.3100,75.9500,11.3300'; // lon1,lat1,lon2,lat2

export function MapPicker({ onSelect }: { onSelect: (addr: string, lat: number, lng: number) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstance) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=${NITC_BOUNDS}&bounded=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const numLat = parseFloat(lat);
        const numLng = parseFloat(lon);
        mapInstance.flyTo([numLat, numLng], 17);
        onSelect(display_name, numLat, numLng);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const MapEvents = () => {
    const map = useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en&viewbox=${NITC_BOUNDS}&bounded=1`);
          const data = await res.json();
          onSelect(data.display_name, lat, lng);
        } catch (err) {
          onSelect(`${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng);
        }
      },
    });
    useEffect(() => { setMapInstance(map); }, [map]);
    return null;
  };

  return (
    <div className="h-[400px] w-full rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl mt-4">
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-white/90 text-black px-4 py-3 rounded-xl shadow-lg outline-none text-sm font-bold"
          />
          <button type="submit" disabled={isSearching} className="bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg font-bold text-sm hover:bg-blue-700 transition-colors">
            {isSearching ? '...' : 'Search'}
          </button>
        </form>
      </div>
      <MapContainer center={[11.3216, 75.9338]} zoom={16} style={{ height: '100%', width: '100%' }}>
         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
         <MapEvents />
      </MapContainer>
    </div>
  );
}

export function MapViewer({ lat, lng, onMove }: { lat: number, lng: number, onMove: (lat: number, lng: number) => void }) {
  const MapRef = () => {
    const map = useMap();
    useEffect(() => { if (lat && lng) map.flyTo([lat, lng], 17); }, [lat, lng, map]);
    return null;
  };

  const eventHandlers = {
    dragend(e: any) {
      const marker = e.target;
      if (marker) {
        const { lat, lng } = marker.getLatLng();
        onMove(lat, lng);
      }
    },
  };

  return (
    <div className="h-[400px] w-full rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl mt-4">
      <MapContainer center={[lat, lng]} zoom={17} style={{ height: '100%', width: '100%' }}>
         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
         <Marker position={[lat, lng]} draggable={true} eventHandlers={eventHandlers} />
         <MapRef />
      </MapContainer>
    </div>
  );
}
