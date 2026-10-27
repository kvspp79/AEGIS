import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  MapPin, 
  PhoneCall, 
  Radio, 
  Activity, 
  ExternalLink,
  Waves,
  Wind,
  CheckCircle2,
  Search,
  Filter,
  Flame,
  Info
} from 'lucide-react';
import { IndiaRealLifeDisasterFeed } from './IndiaRealLifeDisasterFeed';

export const WeatherEnvironmentalFeeds: React.FC = () => {
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<'ALL' | 'SOUTH' | 'NORTH' | 'EAST'>('ALL');

  // Official verified emergency helpline directory
  const emergencyHelplines = [
    { label: 'National Emergency Helpline', number: '112', desc: 'Police, Fire & Medical all-in-one emergency response', badge: 'Toll-Free 24/7' },
    { label: 'NDMA Central Disaster Control', number: '1070', desc: 'National Disaster Management Authority crisis room', badge: 'Disaster Ops' },
    { label: 'District Disaster Management Authority (DDMA)', number: '1077', desc: 'Local district collectorate rescue coordination', badge: 'District' },
    { label: '108 Emergency Ambulance', number: '108', desc: 'State trauma transport & advanced life support', badge: 'Medical SOS' },
    { label: 'Indian Coast Guard SAR', number: '1554', desc: 'Maritime, coastal inundation & fisherman distress', badge: 'Coastal' },
    { label: 'RailMadad Railway SOS', number: '139', desc: 'Railway derailment & passenger transit rescue', badge: 'Transit' },
  ];

  return (
    <div id="real-time-india-disasters-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Official Government Incident Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              Live India Incident Feed
            </span>
            <span className="text-xs text-slate-500 font-medium">NDMA • IMD • SDRF Verified SITREP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tracking-tight">
            Real-Time India Disaster Information Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
            Genuinely verified emergency incidents, active rescue operations, and official disaster advisories across Indian states and union territories.
          </p>
        </div>

        {/* Quick Help Line Call Action */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="tel:112"
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-200 flex items-center gap-2 transition active:scale-95"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 112 National SOS</span>
          </a>
        </div>
      </div>

      {/* Official Emergency Contact Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            Direct Government Emergency Helplines
          </h2>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            All Lines Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {emergencyHelplines.map((hl, idx) => (
            <a
              key={idx}
              href={`tel:${hl.number}`}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-red-400 hover:shadow-md transition flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition">
                    {hl.label}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {hl.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{hl.desc}</p>
              </div>
              <div className="pl-3 shrink-0 flex items-center gap-1 text-red-600 font-mono font-black text-sm">
                <PhoneCall className="w-3.5 h-3.5 group-hover:scale-110 transition" />
                <span>{hl.number}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Verified Real-Life Disasters Feed */}
      <div className="pt-2">
        <IndiaRealLifeDisasterFeed />
      </div>

    </div>
  );
};
