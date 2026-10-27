import React, { useState, useEffect, useCallback } from 'react';
import { 
  Ambulance, 
  Hospital, 
  MapPin, 
  Radio, 
  ShieldAlert, 
  Phone, 
  Check, 
  Zap, 
  Eye,
  Activity,
  Bed,
  CheckCircle2,
  Navigation,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Incident, Responder, Shelter, Coordinates, IncidentStatus } from '../types';
import { 
  calculateNearestHospitalWithBeds, 
  calculateNearestResponders,
  HospitalDistanceResult,
  ResponderDistanceResult
} from '../services/hospitalDistanceService';
import { IncidentLifecycleTimeline } from './IncidentLifecycleTimeline';
import { MissionAccomplishedCue } from './MissionAccomplishedCue';
import { MapView } from './MapView';

export interface ResponderConsoleViewProps {
  apiKey: string;
  incidents: Incident[];
  responders: Responder[];
  shelters: Shelter[];
  onQuickDispatch: (incidentId: string, responderId: string) => void;
  onUpdateStatus: (incidentId: string, newStatus: IncidentStatus) => void;
  onNavigateToMap: (incident: Incident, responder?: Responder) => void;
  onMissionAccomplished?: (incidentId: string, responderId: string) => void;
}

export const ResponderConsoleView: React.FC<ResponderConsoleViewProps> = ({
  apiKey,
  incidents,
  responders,
  shelters,
  onQuickDispatch,
  onUpdateStatus,
  onNavigateToMap,
  onMissionAccomplished,
}) => {
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    activeIncidents[0]?.id || incidents[0]?.id || null
  );

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || activeIncidents[0] || incidents[0] || null;

  // Real-time calculated nearest hospital and responder via distance algorithm
  const [hospitalResult, setHospitalResult] = useState<HospitalDistanceResult | null>(null);
  const [allHospitalsResult, setAllHospitalsResult] = useState<HospitalDistanceResult[]>([]);
  const [responderResult, setResponderResult] = useState<ResponderDistanceResult | null>(null);
  const [allRespondersResult, setAllRespondersResult] = useState<ResponderDistanceResult[]>([]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Mission accomplished cue modal state
  const [showMissionAccomplishedModal, setShowMissionAccomplishedModal] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedIncident) return;
    let isCurrent = true;
    setIsCalculating(true);

    const coords = selectedIncident.coordinates;

    Promise.all([
      calculateNearestHospitalWithBeds(coords, shelters),
      calculateNearestResponders(coords, responders),
    ]).then(([hospData, respData]) => {
      if (!isCurrent) return;
      setHospitalResult(hospData.nearest);
      setAllHospitalsResult(hospData.allHospitals);
      setResponderResult(respData.nearest);
      setAllRespondersResult(respData.allResponders);
      setIsCalculating(false);
    }).catch(() => {
      if (isCurrent) setIsCalculating(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [selectedIncident?.id, shelters, responders]);

  const assignedResponder = responders.find((r) => r.id === selectedIncident?.assignedResponderId);
  const activeResponder = assignedResponder || responderResult?.responder || responders[0];
  const isDispatched = selectedIncident?.status === 'RESPONDING' || selectedIncident?.status === 'ASSIGNED';
  const availableResponders = responders.filter((r) => r.status === 'AVAILABLE');
  const hospitalList = shelters.filter((s) => s.type === 'HOSPITAL' || s.hasMedicalSupport || s.medicalStaffPresent);
  const totalBedsAvailable = hospitalList.reduce(
    (acc, h) => acc + Math.max(0, h.capacityTotal - h.capacityCurrent),
    0
  );

  // Trigger Mission Accomplished and return responder to AVAILABLE state
  const handleTriggerMissionAccomplished = useCallback(() => {
    if (!selectedIncident) return;
    const respId = activeResponder?.id || responders[0]?.id || '';
    
    // 1. Show celebratory visual cue
    setShowMissionAccomplishedModal(true);

    // 2. Trigger parent status update and immediate responder cleanup to AVAILABLE
    if (onMissionAccomplished) {
      onMissionAccomplished(selectedIncident.id, respId);
    } else {
      onUpdateStatus(selectedIncident.id, 'RESOLVED');
    }
  }, [selectedIncident, activeResponder, responders, onMissionAccomplished, onUpdateStatus]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* ========================================================================= */}
      {/* MODULE 1: EMERGENCY OVERVIEW                                              */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shadow-xs">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Emergency Operations Console
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                  Google Maps Geolocation Active
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight mt-0.5 text-white">
                Emergency Overview & Real-Time Tactical Response
              </h1>
            </div>
          </div>

          {/* Real-Time Metric Badges */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center gap-2 font-mono">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-slate-400 text-[11px]">ACTIVE SOS:</span>
              <span className="text-rose-400 font-bold">{activeIncidents.length} Distress Calls</span>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center gap-2 font-mono">
              <Ambulance className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-[11px]">FLEET READY:</span>
              <span className="text-blue-400 font-bold">{availableResponders.length} / {responders.length} Standby</span>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center gap-2 font-mono">
              <Hospital className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 text-[11px]">TRAUMA BEDS:</span>
              <span className="text-emerald-400 font-bold">{totalBedsAvailable} Open Beds</span>
            </div>
          </div>
        </div>

        {/* Horizontal Incident Selector Queue */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Dispatch Queue:
          </span>
          {activeIncidents.length === 0 ? (
            <span className="text-slate-400 text-xs">No pending emergency calls. Standby mode active.</span>
          ) : (
            activeIncidents.map((inc) => {
              const isSelected = inc.id === selectedIncident?.id;
              return (
                <button
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 text-xs ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${inc.severity === 'CRITICAL' ? 'bg-rose-400 animate-ping' : 'bg-amber-400'}`}></span>
                  <span className="truncate max-w-[180px]">{inc.title}</span>
                  <span className="text-[10px] opacity-75 font-mono">({inc.locationName})</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INCIDENT LIFECYCLE TIMELINE                                               */}
      {/* Logs key timestamps: Reported, Assessed, Assigned, Responding, Resolved    */}
      {/* ========================================================================= */}
      {selectedIncident && (
        <IncidentLifecycleTimeline
          incident={selectedIncident}
          assignedResponder={activeResponder}
          allocatedHospital={hospitalResult?.hospital}
          onAdvanceStage={(newStatus) => onUpdateStatus(selectedIncident.id, newStatus)}
          isMissionAccomplished={selectedIncident.status === 'RESOLVED'}
        />
      )}

      {/* ========================================================================= */}
      {/* MODULE 5: INCIDENT DISPATCH PIPELINE                                      */}
      {/* ========================================================================= */}
      {selectedIncident && (
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-3.5 transition-all duration-300 ${
          selectedIncident.status === 'RESOLVED'
            ? 'bg-gradient-to-b from-emerald-50/70 to-white border-emerald-300/80 shadow-emerald-500/5'
            : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Activity className={`w-4 h-4 ${selectedIncident.status === 'RESOLVED' ? 'text-emerald-600' : 'text-blue-600'}`} />
              <span>Incident Dispatch Pipeline — #{selectedIncident.id.slice(-6).toUpperCase()}</span>
            </h2>
            <div className="flex items-center gap-2">
              {selectedIncident.status === 'RESOLVED' ? (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mission Accomplished • Vehicle Standby</span>
                </span>
              ) : (
                <>
                  <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                    Coordinated via Real-Time Geolocation Matrix
                  </span>
                  <button
                    onClick={handleTriggerMissionAccomplished}
                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mission Accomplished Trigger</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Stage 1: Citizen SOS GPS Verified */}
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition ${
              selectedIncident.status === 'RESOLVED'
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-blue-50/80 border-blue-200'
            }`}>
              <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-xs shrink-0 ${
                selectedIncident.status === 'RESOLVED' ? 'bg-emerald-600' : 'bg-blue-600'
              }`}>
                {selectedIncident.status === 'RESOLVED' ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <div className="overflow-hidden">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  selectedIncident.status === 'RESOLVED' ? 'text-emerald-700' : 'text-blue-700'
                }`}>
                  Stage 1: Verified
                </span>
                <h3 className="text-xs font-bold text-slate-900 truncate">
                  Citizen GPS Coordinates Verified
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                  Lat: {selectedIncident.coordinates.lat.toFixed(4)}, Lng: {selectedIncident.coordinates.lng.toFixed(4)}
                </p>
              </div>
            </div>

            {/* Stage 2: Nearest Responder Dispatched & En Route */}
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition ${
              selectedIncident.status === 'RESOLVED'
                ? 'bg-emerald-50/60 border-emerald-200'
                : isDispatched 
                ? 'bg-amber-50/80 border-amber-300' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-xs shrink-0 ${
                selectedIncident.status === 'RESOLVED'
                  ? 'bg-emerald-600'
                  : isDispatched ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
              }`}>
                {selectedIncident.status === 'RESOLVED' ? <CheckCircle2 className="w-4 h-4" /> : '2'}
              </div>
              <div className="overflow-hidden">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  selectedIncident.status === 'RESOLVED' ? 'text-emerald-700' : isDispatched ? 'text-amber-700' : 'text-slate-500'
                }`}>
                  Stage 2: {selectedIncident.status === 'RESOLVED' ? 'Transport Complete' : isDispatched ? 'Active En Route' : 'Pending Dispatch'}
                </span>
                <h3 className="text-xs font-bold text-slate-900 truncate">
                  {activeResponder?.name} ({activeResponder?.plateNumber})
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {selectedIncident.status === 'RESOLVED'
                    ? 'Unit reset to AVAILABLE status (Standby)'
                    : responderResult?.distanceKm ? `${responderResult.distanceKm} km driving distance (${responderResult.durationText})` : 'Calculating route...'}
                </p>
              </div>
            </div>

            {/* Stage 3: Hospital Trauma Bed Prepped */}
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition ${
              selectedIncident.status === 'RESOLVED'
                ? 'bg-emerald-50/60 border-emerald-200'
                : isDispatched 
                ? 'bg-emerald-50/80 border-emerald-300' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-xs shrink-0 ${
                selectedIncident.status === 'RESOLVED'
                  ? 'bg-emerald-600'
                  : isDispatched ? 'bg-emerald-600' : 'bg-slate-400'
              }`}>
                {selectedIncident.status === 'RESOLVED' ? <CheckCircle2 className="w-4 h-4" /> : '3'}
              </div>
              <div className="overflow-hidden">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  selectedIncident.status === 'RESOLVED'
                    ? 'text-emerald-700'
                    : isDispatched ? 'text-emerald-700' : 'text-slate-500'
                }`}>
                  Stage 3: {selectedIncident.status === 'RESOLVED' ? 'Hospital Handover Complete' : isDispatched ? 'Trauma Bed Prepped' : 'Standby Intake'}
                </span>
                <h3 className="text-xs font-bold text-slate-900 truncate">
                  {hospitalResult?.hospital.name || 'Coimbatore Medical Center'}
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {selectedIncident.status === 'RESOLVED'
                    ? 'Casualties admitted • Bed count updated'
                    : `${hospitalResult?.bedsAvailable ?? 12} Open Beds • Direct Helpline: ${hospitalResult?.hospital.contactPhone || '108'}`}
                </p>
              </div>
            </div>
          </div>

          {/* Dedicated 'Mission Complete' Summary Card when incident is resolved */}
          {selectedIncident.status === 'RESOLVED' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300/80 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    Mission Complete — Dispatch Pipeline Closed
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Vehicle <strong className="font-bold">{activeResponder?.name}</strong> arrived at <strong>{hospitalResult?.hospital.name}</strong>. Unit status restored to <strong>AVAILABLE</strong> without residual route animations.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-300">
                  Status: Available
                </span>
                <button
                  onClick={() => onUpdateStatus(selectedIncident.id, 'REPORTED')}
                  className="px-3 py-1 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition shadow-xs"
                >
                  Restart Pipeline
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2-COLUMN OPERATIONAL WORKSPACE:                                           */}
      {/* Column A: RESPONDER CONSOLE                                               */}
      {/* Column B: HOSPITAL TRAUMA STATUS & TACTICAL MAP VIEW                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ===================================================================== */}
        {/* MODULE 2: RESPONDER CONSOLE (Left, 6 cols)                            */}
        {/* ===================================================================== */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-blue-600" />
              <span>Responder Console & Vehicle Allocation</span>
            </h2>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Verified Distance Engine
            </span>
          </div>

          {selectedIncident ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              
              {/* Active Incident Summary Header */}
              <div className="pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedIncident.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                    selectedIncident.severity === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedIncident.severity} PRIORITY
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    {selectedIncident.title}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selectedIncident.locationName}</span>
                    <span className="font-mono text-[11px] text-slate-400">({selectedIncident.casualties} Casualties)</span>
                  </p>
                </div>

                <button
                  onClick={() => onNavigateToMap(selectedIncident, activeResponder)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1 shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full Map</span>
                </button>
              </div>

              {/* Recommended Nearest Responder Unit Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <Ambulance className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                        {isDispatched ? 'Dispatched Response Unit' : 'Nearest Available Driver (Recommended)'}
                      </span>
                      <h4 className="text-sm font-black text-slate-900">
                        {activeResponder?.name}
                      </h4>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    activeResponder?.status === 'AVAILABLE'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {activeResponder?.status}
                  </span>
                </div>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center bg-white/90 p-2.5 rounded-xl border border-blue-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Road Distance</span>
                    <span className="text-sm font-black text-blue-700 font-mono">
                      {responderResult?.distanceKm ?? 2.8} km
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Estimated ETA</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">
                      {responderResult?.durationText ?? '~6 mins'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Vehicle Plate</span>
                    <span className="text-xs font-black text-slate-700 font-mono">
                      {activeResponder?.plateNumber || 'TN-38-EMG-01'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-600">
                    Station: <strong>{activeResponder?.baseStation}</strong> • Crew: <strong>{activeResponder?.crewCount || 3} Medics</strong>
                  </span>

                  {selectedIncident.status === 'RESOLVED' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Unit Released & Available</span>
                    </div>
                  ) : !isDispatched ? (
                    <button
                      onClick={() => {
                        if (activeResponder) {
                          onQuickDispatch(selectedIncident.id, activeResponder.id);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Dispatch Nearest Unit Now</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleTriggerMissionAccomplished}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Incident Resolved</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Roster of Responding Units with Distance Matrix */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Available Units Real-Time Proximity</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ranked by Real Drive Distance</span>
                </h4>
                <div className="space-y-2">
                  {allRespondersResult.slice(0, 3).map(({ responder: r, distanceKm, durationText }) => (
                    <div 
                      key={r.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{r.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({r.plateNumber})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {distanceKm} km away • {durationText} driving • {r.baseStation}
                        </div>
                      </div>

                      {r.status === 'AVAILABLE' ? (
                        <button
                          onClick={() => onQuickDispatch(selectedIncident.id, r.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition"
                        >
                          Dispatch
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                          {r.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              No active emergency selected. Choose an incident from the top queue.
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* MODULE 3: HOSPITAL TRAUMA STATUS & MODULE 4: TACTICAL MAP VIEW       */}
        {/* ===================================================================== */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* MODULE 3: HOSPITAL TRAUMA STATUS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Hospital className="w-4 h-4 text-emerald-600" />
                <span>Hospital Trauma Status (Nearest Bed Allocation)</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Live Bed Capacity Sync
              </span>
            </div>

            {hospitalResult ? (
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-emerald-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <Hospital className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Designated Receiving Trauma Center
                      </span>
                      <h3 className="text-sm font-black text-slate-900">
                        {hospitalResult.hospital.name}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Trauma Bay Open
                  </span>
                </div>

                {/* Hospital Distance & Bed Readiness Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Drive Distance</span>
                    <span className="text-sm font-black text-emerald-800 font-mono">
                      {hospitalResult.distanceKm} km
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Free Trauma Beds</span>
                    <span className="text-sm font-black text-teal-700 font-mono">
                      {hospitalResult.bedsAvailable} Beds Free
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Emergency Line</span>
                    <span className="text-xs font-black text-slate-700 font-mono flex items-center justify-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      {hospitalResult.hospital.contactPhone || '108'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                  <strong className="text-slate-800">Triage Notice:</strong> Hospital emergency trauma team alerted for incoming patient transfer from scene at {selectedIncident?.locationName}. ICU trauma bay and ventilator ready.
                </div>

                {/* Alternative Receiving Hospitals List */}
                <div className="pt-1">
                  <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Alternative Receiving Hospitals in Vicinity
                  </h4>
                  <div className="space-y-1.5">
                    {allHospitalsResult.slice(1, 3).map(({ hospital: h, distanceKm, bedsAvailable }) => (
                      <div key={h.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div className="truncate">
                          <span className="font-bold text-slate-800 block truncate">{h.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{distanceKm} km • Helpline: {h.contactPhone}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0 font-mono">
                          {bedsAvailable} Beds
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-6 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                {isCalculating ? 'Querying Google Maps Distance Engine for nearest hospital...' : 'No hospital data available.'}
              </div>
            )}
          </div>

          {/* =================================================================== */}
          {/* MODULE 4: TACTICAL MAP VIEW (Refactored: ONLY Vehicle, Target,     */}
          {/* Nearest Hospital with Capacity & Shortest Polyline)                */}
          {/* =================================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-600" />
                <span>Tactical Map View (Vehicle, Target Scene & Trauma Hospital)</span>
              </h2>
              <button
                onClick={() => selectedIncident && onNavigateToMap(selectedIncident, activeResponder)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
              >
                <span>Launch Full Tactical Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedIncident ? (
              <div className="space-y-2">
                {/* State-driven live map with non-essential overlays removed */}
                <MapView
                  apiKey={apiKey}
                  incidents={incidents}
                  responders={responders}
                  shelters={shelters}
                  selectedIncident={selectedIncident}
                  onSelectIncident={() => {}}
                  selectedResponder={activeResponder}
                  onSelectResponder={() => {}}
                  responderConsoleMode={true}
                  assignedHospital={hospitalResult?.hospital}
                  onMissionAccomplished={onMissionAccomplished}
                />

                <div className="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-bold text-slate-300">Evacuation Corridor:</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {selectedIncident.locationName} → {hospitalResult?.hospital.name || 'Trauma Center'}
                    </span>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold text-[11px]">
                    {hospitalResult?.distanceKm ?? 2.4} km Optimal Route
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                Select an incident to render tactical coordinates and shortest path.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mission Accomplished Cue Modal */}
      {showMissionAccomplishedModal && selectedIncident && (
        <MissionAccomplishedCue
          incident={selectedIncident}
          responder={activeResponder}
          hospital={hospitalResult?.hospital}
          onDismiss={() => setShowMissionAccomplishedModal(false)}
        />
      )}

    </div>
  );
};
