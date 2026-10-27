import React, { useState } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Hospital, 
  ShieldCheck, 
  ArrowRight,
  Filter,
  Layers,
  ChevronRight,
  Ambulance,
  PhoneCall,
  Activity,
  Flame,
  Waves,
  Building
} from 'lucide-react';
import { Incident, Responder, Shelter, IncidentStatus } from '../types';

interface SmartDispatchBoardProps {
  incidents: Incident[];
  responders: Responder[];
  shelters: Shelter[];
  onDispatchUnit: (incidentId: string, responderId: string) => void;
  onUpdateStatus: (incidentId: string, newStatus: IncidentStatus) => void;
  onNavigateToMap?: (incident: Incident) => void;
}

export const SmartDispatchBoard: React.FC<SmartDispatchBoardProps> = ({
  incidents,
  responders,
  shelters,
  onDispatchUnit,
  onUpdateStatus,
  onNavigateToMap,
}) => {
  const [activePipelineFilter, setActivePipelineFilter] = useState<IncidentStatus | 'ALL'>('ALL');

  const pipelineStages: { id: IncidentStatus; label: string; count: number; desc: string }[] = [
    { id: 'REPORTED', label: '1. Reported', count: incidents.filter((i) => i.status === 'REPORTED').length, desc: 'Incoming citizen SOS signals' },
    { id: 'ASSESSED', label: '2. Assessed', count: incidents.filter((i) => i.status === 'ASSESSED').length, desc: 'Triage & casualty severity verified' },
    { id: 'ASSIGNED', label: '3. Assigned', count: incidents.filter((i) => i.status === 'ASSIGNED').length, desc: 'Rescue unit & ambulance attached' },
    { id: 'RESPONDING', label: '4. Responding', count: incidents.filter((i) => i.status === 'RESPONDING').length, desc: 'En route with sirens active' },
    { id: 'RESOLVED', label: '5. Resolved', count: incidents.filter((i) => i.status === 'RESOLVED').length, desc: 'Casualties safely admitted to hospital' },
  ];

  const filteredIncidents = incidents.filter((i) => {
    if (activePipelineFilter === 'ALL') return true;
    return i.status === activePipelineFilter;
  });

  const availableResponders = responders.filter((r) => r.status === 'AVAILABLE');

  // Advance to next logical stage
  const handleAdvanceStage = (inc: Incident) => {
    switch (inc.status) {
      case 'REPORTED':
        onUpdateStatus(inc.id, 'ASSESSED');
        break;
      case 'ASSESSED': {
        const assignedUnit = availableResponders.length > 0 ? availableResponders[0] : responders[0];
        if (assignedUnit) {
          onDispatchUnit(inc.id, assignedUnit.id);
        } else {
          onUpdateStatus(inc.id, 'ASSIGNED');
        }
        break;
      }
      case 'ASSIGNED':
        onUpdateStatus(inc.id, 'RESPONDING');
        break;
      case 'RESPONDING':
        onUpdateStatus(inc.id, 'RESOLVED');
        break;
      case 'RESOLVED':
        // Can re-open if needed
        onUpdateStatus(inc.id, 'REPORTED');
        break;
    }
  };

  return (
    <div id="smart-dispatch-board" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Emergency Operations Control
            </span>
            <span className="text-xs text-slate-500 font-medium">5-Stage Operational Pipeline</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Emergency Dispatch & Incident Pipeline
          </h1>
          <p className="text-xs text-slate-500">
            Track real incidents sequentially: Reported → Assessed → Assigned → Responding → Resolved.
          </p>
        </div>

        {/* Tactical Summary */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{availableResponders.length} Available Vehicles</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>{incidents.filter(i => i.status !== 'RESOLVED').length} Active Missions</span>
          </div>
        </div>
      </div>

      {/* 5-Step Pipeline Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        <button
          onClick={() => setActivePipelineFilter('ALL')}
          className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
            activePipelineFilter === 'ALL'
              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">View All</span>
          <span className="text-base font-black text-slate-900 mt-1">{incidents.length} Total</span>
        </button>

        {pipelineStages.map((stage) => {
          const isSelected = activePipelineFilter === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => setActivePipelineFilter(stage.id)}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400 truncate">{stage.label}</span>
              <span className="text-base font-black text-slate-900 mt-1">{stage.count} Active</span>
            </button>
          );
        })}
      </div>

      {/* Main Incidents Grid */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/80">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No Incidents in This Stage</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select "View All" or submit a new SOS report in the Citizen SOS tab.
            </p>
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const assignedUnit = responders.find((r) => r.assignedIncidentId === inc.id);
            return (
              <div 
                key={inc.id}
                className="glass-card p-4 sm:p-5 rounded-3xl border border-slate-200/80 bg-white hover:shadow-md transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                {/* Incident Information */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    inc.type === 'FIRE' ? 'bg-orange-100 text-orange-600' :
                    inc.type === 'FLOOD' ? 'bg-sky-100 text-sky-600' :
                    inc.type === 'MEDICAL' ? 'bg-rose-100 text-rose-600' :
                    'bg-indigo-100 text-indigo-600'
                  }`}>
                    {inc.type === 'FIRE' ? <Flame className="w-6 h-6" /> :
                     inc.type === 'FLOOD' ? <Waves className="w-6 h-6" /> :
                     inc.type === 'MEDICAL' ? <Ambulance className="w-6 h-6" /> :
                     <Building className="w-6 h-6" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                        inc.status === 'RESPONDING' ? 'bg-indigo-100 text-indigo-800 animate-pulse' :
                        inc.status === 'ASSIGNED' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        STAGE: {inc.status}
                      </span>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {inc.severity} SEVERITY
                      </span>

                      <span className="text-xs text-slate-400 font-mono">
                        #{inc.id.slice(-6)}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900">
                      {inc.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {inc.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {inc.locationName}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Activity className="w-3.5 h-3.5 text-rose-500" />
                        {inc.casualties} Casualties Reported
                      </span>
                      {inc.reporterPhone && (
                        <span className="flex items-center gap-1 text-indigo-600 font-mono">
                          <PhoneCall className="w-3.5 h-3.5" />
                          {inc.reporterPhone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Vehicle & Next Stage Advance Action */}
                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {assignedUnit ? (
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Unit</span>
                      <span className="text-xs font-extrabold text-slate-800 block">{assignedUnit.name}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{assignedUnit.callsign}</span>
                    </div>
                  ) : (
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Unit</span>
                      <span className="text-xs text-amber-600 font-semibold">Pending Unit Attachment</span>
                    </div>
                  )}

                  {/* Stage Advance Button */}
                  <button
                    onClick={() => handleAdvanceStage(inc)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 ${
                      inc.status === 'REPORTED'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
                        : inc.status === 'ASSESSED'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                        : inc.status === 'ASSIGNED'
                        ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200'
                        : inc.status === 'RESPONDING'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>
                      {inc.status === 'REPORTED' && 'Verify & Assess'}
                      {inc.status === 'ASSESSED' && 'Assign Rescue Unit'}
                      {inc.status === 'ASSIGNED' && 'Dispatch En Route'}
                      {inc.status === 'RESPONDING' && 'Mark Resolved'}
                      {inc.status === 'RESOLVED' && 'Reopen Incident'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
