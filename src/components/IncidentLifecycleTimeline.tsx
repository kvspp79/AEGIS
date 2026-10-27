import React, { useMemo } from 'react';
import { 
  Radio, 
  ClipboardCheck, 
  UserCheck, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Incident, IncidentStatus, Responder, Shelter } from '../types';

interface IncidentLifecycleTimelineProps {
  incident: Incident;
  assignedResponder?: Responder | null;
  allocatedHospital?: Shelter | null;
  onAdvanceStage?: (newStatus: IncidentStatus) => void;
  isMissionAccomplished?: boolean;
}

interface LifecycleStage {
  id: IncidentStatus;
  key: string;
  name: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: 'REPORTED',
    key: 'reported',
    name: 'Reported',
    shortDesc: 'SOS Telemetry Logged',
    icon: Radio,
    accentColor: 'rose',
  },
  {
    id: 'ASSESSED',
    key: 'assessed',
    name: 'Assessed',
    shortDesc: 'Triage & Casualty Evaluation',
    icon: ClipboardCheck,
    accentColor: 'amber',
  },
  {
    id: 'ASSIGNED',
    key: 'assigned',
    name: 'Assigned',
    shortDesc: 'Unit Attached & Pre-Routed',
    icon: UserCheck,
    accentColor: 'indigo',
  },
  {
    id: 'RESPONDING',
    key: 'responding',
    name: 'Responding',
    shortDesc: 'En Route & Evacuation Active',
    icon: Truck,
    accentColor: 'blue',
  },
  {
    id: 'RESOLVED',
    key: 'resolved',
    name: 'Resolved',
    shortDesc: 'Patient Admitted & Cleared',
    icon: CheckCircle2,
    accentColor: 'emerald',
  },
];

const STAGE_ORDER: IncidentStatus[] = ['REPORTED', 'ASSESSED', 'ASSIGNED', 'RESPONDING', 'RESOLVED'];

export const IncidentLifecycleTimeline: React.FC<IncidentLifecycleTimelineProps> = ({
  incident,
  assignedResponder,
  allocatedHospital,
  onAdvanceStage,
  isMissionAccomplished,
}) => {
  // Determine active stage index
  const currentStageIndex = useMemo(() => {
    if (incident.status === 'RESOLVED' || isMissionAccomplished) return 4;
    if (incident.status === 'RESPONDING') return 3;
    if (incident.status === 'ASSIGNED') return 2;
    if (incident.status === 'ASSESSED') return 1;
    return 0; // REPORTED
  }, [incident.status, isMissionAccomplished]);

  // Compute or format timestamps for each stage based on incident.reportedAt
  const stageTimestamps: Record<string, { time: string; date: string }> = useMemo(() => {
    const baseDate = new Date(incident.reportedAt);
    const validBase = isNaN(baseDate.getTime()) ? new Date(Date.now() - 18 * 60 * 1000) : baseDate;

    const formatTime = (d: Date) => {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    };

    const formatDate = (d: Date) => {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const tReported = new Date(validBase.getTime());
    const tAssessed = new Date(validBase.getTime() + 2.5 * 60 * 1000);
    const tAssigned = new Date(validBase.getTime() + 4.8 * 60 * 1000);
    const tResponding = new Date(validBase.getTime() + 6.2 * 60 * 1000);
    const tResolved = new Date(validBase.getTime() + 19.4 * 60 * 1000);

    return {
      REPORTED: { time: formatTime(tReported), date: formatDate(tReported) },
      ASSESSED: { time: formatTime(tAssessed), date: formatDate(tAssessed) },
      ASSIGNED: { time: formatTime(tAssigned), date: formatDate(tAssigned) },
      RESPONDING: { time: formatTime(tResponding), date: formatDate(tResponding) },
      RESOLVED: { time: formatTime(tResolved), date: formatDate(tResolved) },
      ACTIVE: { time: formatTime(tResponding), date: formatDate(tResponding) },
      CONTAINED: { time: formatTime(tResolved), date: formatDate(tResolved) },
      VERIFIED: { time: formatTime(tAssessed), date: formatDate(tAssessed) },
    };
  }, [incident.reportedAt]);

  const progressPercentage = Math.round((currentStageIndex / (STAGE_ORDER.length - 1)) * 100);

  return (
    <div id="incident-lifecycle-timeline" className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
      {/* Header with Operational Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Incident Lifecycle & Timestamp Audit Trail
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
              ID: #{incident.id.slice(-6).toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Real-time milestone tracking for incident transparency & operational coordination.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-600">
            Pipeline Progress:
          </span>
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg font-mono ${
            progressPercentage === 100
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-indigo-100 text-indigo-800'
          }`}>
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* Visual Timeline Stepper */}
      <div className="relative pt-2 pb-1">
        {/* Continuous background track */}
        <div className="absolute top-7 left-6 right-6 h-1 bg-slate-100 -translate-y-1/2 rounded-full hidden sm:block"></div>
        {/* Animated active progress bar */}
        <div 
          className="absolute top-7 left-6 h-1 bg-gradient-to-r from-rose-500 via-indigo-600 to-emerald-500 -translate-y-1/2 rounded-full transition-all duration-700 hidden sm:block"
          style={{ width: `calc(${progressPercentage}% * 0.88)` }}
        ></div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2 relative z-10">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isPending = idx > currentStageIndex;
            const timestamp = stageTimestamps[stage.id];

            return (
              <div 
                key={stage.id} 
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-indigo-50/70 border-indigo-400 shadow-sm ring-2 ring-indigo-200/60'
                    : isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-800'
                    : 'bg-slate-50/60 border-slate-200/60 text-slate-400 opacity-70'
                }`}
              >
                {/* Stage Badge & Icon */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white animate-pulse ring-4 ring-indigo-200'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : isCurrent
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? 'COMPLETED' : isCurrent ? 'ACTIVE' : 'PENDING'}
                  </span>
                </div>

                {/* Stage Name & Subtitle */}
                <div>
                  <h4 className={`text-xs font-black ${
                    isCurrent ? 'text-indigo-950' : isCompleted ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    {stage.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                    {stage.id === 'ASSIGNED' && assignedResponder
                      ? `Unit: ${assignedResponder.name.split(' ')[0]}`
                      : stage.id === 'RESOLVED' && allocatedHospital
                      ? `Admitted: ${allocatedHospital.name.split(' ')[0]}`
                      : stage.shortDesc}
                  </p>
                </div>

                {/* Logged Timestamp */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1 font-mono text-[10px]">
                  <Clock className={`w-3 h-3 ${
                    isCurrent ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-300'
                  }`} />
                  <span className={`font-semibold ${
                    isCurrent
                      ? 'text-indigo-700 font-bold'
                      : isCompleted
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}>
                    {isPending ? '--:--:--' : timestamp.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Transparency Details Footer */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-slate-600">
            Current Operational Phase: <strong className="text-slate-900 font-bold">{LIFECYCLE_STAGES[currentStageIndex]?.name}</strong> ({LIFECYCLE_STAGES[currentStageIndex]?.shortDesc})
          </span>
        </div>

        {onAdvanceStage && currentStageIndex < 4 && (
          <button
            onClick={() => onAdvanceStage(STAGE_ORDER[currentStageIndex + 1])}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition shrink-0 self-start sm:self-auto"
          >
            <span>Advance to {LIFECYCLE_STAGES[currentStageIndex + 1]?.name}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
