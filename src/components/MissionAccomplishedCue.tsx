import React from 'react';
import { CheckCircle2, ShieldCheck, Hospital, Truck, ArrowRight, X } from 'lucide-react';
import { Incident, Responder, Shelter } from '../types';

interface MissionAccomplishedCueProps {
  incident: Incident;
  responder?: Responder | null;
  hospital?: Shelter | null;
  onDismiss: () => void;
}

export const MissionAccomplishedCue: React.FC<MissionAccomplishedCueProps> = ({
  incident,
  responder,
  hospital,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-200 text-center space-y-5 animate-in zoom-in-95 duration-300">
        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Check & Rings */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-75"></div>
          <div className="absolute inset-2 rounded-full bg-emerald-200 animate-pulse"></div>
          <div className="relative w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <CheckCircle2 className="w-9 h-9" />
          </div>
        </div>

        {/* Title and Tagline */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block">
            Mission Accomplished • Task Complete
          </span>
          <h2 className="text-xl font-black text-slate-900 pt-1">
            Emergency Handover Verified
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Casualties from <strong>{incident.title}</strong> have been safely admitted to the designated trauma center.
          </p>
        </div>

        {/* Operational Status Verification Grid */}
        <div className="grid grid-cols-2 gap-2 text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Truck className="w-3 h-3 text-indigo-600" />
              Responder Status
            </span>
            <div className="font-bold text-slate-800 truncate">
              {responder?.name || 'Rescue Unit'}
            </div>
            <div className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Returned to AVAILABLE
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Hospital className="w-3 h-3 text-emerald-600" />
              Receiving Center
            </span>
            <div className="font-bold text-slate-800 truncate">
              {hospital?.name || 'Trauma Hospital'}
            </div>
            <div className="text-[10px] font-bold text-slate-500 font-mono">
              Bed Admitted • ICU Synced
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <button
            onClick={onDismiss}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm & Return to Operations</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
