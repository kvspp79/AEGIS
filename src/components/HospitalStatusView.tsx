import React from 'react';
import { Hospital, Phone, Bed, CheckCircle2, Navigation, AlertCircle, Ambulance } from 'lucide-react';
import { Incident, Shelter, Responder } from '../types';

interface HospitalStatusViewProps {
  incidents: Incident[];
  shelters: Shelter[];
  responders: Responder[];
  onNavigateToMap: (incident: Incident) => void;
}

export const HospitalStatusView: React.FC<HospitalStatusViewProps> = ({
  incidents,
  shelters,
  responders,
  onNavigateToMap,
}) => {
  const hospitals = shelters.filter((s) => s.type === 'HOSPITAL' || s.hasMedicalSupport);
  const activeEmergencies = incidents.filter((i) => i.status !== 'RESOLVED');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="glass-panel p-5 rounded-3xl bg-white/95 border border-white/90 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Hospital Emergency Receiving Network
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Hospital className="w-6 h-6 text-emerald-600" />
            Live Hospital Trauma & Receiving Status
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time emergency intake synchronization across designated trauma centers and incoming rescue ambulances.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <span className="text-slate-500">Live Hospitals:</span>
          <span className="text-emerald-700 font-bold">{hospitals.length} Operational</span>
        </div>
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hospitals.map((h) => {
          const availableBeds = Math.max(0, h.capacityTotal - h.capacityCurrent);
          const occupancyRate = Math.round((h.capacityCurrent / h.capacityTotal) * 100);

          return (
            <div
              key={h.id}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-md hover:shadow-lg transition space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                    <Hospital className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {h.name}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {h.locationName}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {h.status}
                </span>
              </div>

              {/* Bed Utilization Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-slate-400" />
                    Trauma Capacity
                  </span>
                  <span className="text-slate-800 font-mono">
                    {h.capacityCurrent} / {h.capacityTotal} ({occupancyRate}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      occupancyRate > 85 ? 'bg-rose-500' : occupancyRate > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, occupancyRate)}%` }}
                  ></div>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold block">
                  {availableBeds} ICU / Emergency Beds Immediately Available
                </span>
              </div>

              {/* Supplies & Power */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1 text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Facilities:</span>
                  <strong className="text-slate-800">{h.suppliesSummary}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Emergency Line:</span>
                  <strong className="text-emerald-700 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {h.contactPhone}
                  </strong>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Direct SOS Link Active
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {h.coordinates.lat.toFixed(2)}°, {h.coordinates.lng.toFixed(2)}°
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
