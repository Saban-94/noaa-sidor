import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'motion/react';
import { Truck, MapPin } from 'lucide-react';
import { Driver } from '../types';

// Fix for default marker icons in Leaflet with Vite/Webpack
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface OperationalMapProps {
  drivers: Driver[];
}

const OperationalMap: React.FC<OperationalMapProps> = ({ drivers }) => {
  // Center of Northern Israel / Haifa area where Saban usually operates
  const center: [number, number] = [32.794, 34.989];

  // Mock real-time positions for drivers if they don't have them
  // In a real app, these would come from Firestore 'drivers' collection geo fields
  const driversWithPos = drivers.map((d, i) => ({
    ...d,
    pos: [32.794 + (i * 0.02), 34.989 + (i * 0.03)] as [number, number]
  }));

  return (
    <div className="w-full h-full min-h-[400px] relative overflow-hidden rounded-[32px] border border-white/5 bg-slate-950">
      <div className="absolute top-6 left-6 z-[400] glass-panel p-4 py-2 flex items-center gap-3 border-sky-400/20">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Live Tactical Grid</span>
      </div>

      <MapContainer 
        center={center} 
        zoom={11} 
        scrollWheelZoom={false}
        className="w-full h-full grayscale-[0.8] contrast-[1.2] invert" // Basic CSS way to make it look "rad" / dark if tiles aren't enough
        style={{ height: '100%', background: '#020617' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {driversWithPos.map((driver) => (
          <React.Fragment key={driver.id}>
            {/* Pulsing dot */}
            <CircleMarker 
              center={driver.pos}
              radius={8}
              pathOptions={{ 
                color: '#38bdf8', 
                fillColor: '#38bdf8', 
                fillOpacity: 0.2,
                weight: 1
              }}
            >
               <Popup className="cockpit-popup">
                  <div className="p-2" dir="rtl">
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter italic">{driver.name}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{driver.vehicleModel} | {driver.plateNumber}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-black text-emerald-600 uppercase">Operational</span>
                    </div>
                  </div>
               </Popup>
            </CircleMarker>
            
            <Marker position={driver.pos}>
              <Popup>
                 {driver.name}
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Decorative Overlays */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-[400]" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none z-[400]" />

      {/* Legend */}
      <div className="absolute bottom-6 right-6 z-[400] glass-panel p-4 border-white/5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
          <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">Active Unit</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 border border-emerald-500 rounded-full" />
          <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">HQ Point</span>
        </div>
      </div>
    </div>
  );
};

export default OperationalMap;
