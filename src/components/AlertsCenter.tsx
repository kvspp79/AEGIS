import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  VolumeX, 
  Filter, 
  Send, 
  Radio, 
  PhoneCall, 
  Activity, 
  Waves, 
  Flame, 
  Wind, 
  Biohazard,
  ShieldAlert
} from 'lucide-react';
import { Incident, SeverityLevel } from '../types';
import { playEmergencyAlertSound } from '../utils/audioAlerts';

interface AlertsCenterProps {
  incidents: Incident[];
  onOpenBroadcastModal: () => void;
  audioAlertsEnabled: boolean;
  setAudioAlertsEnabled: (enabled: boolean) => void;
  onSelectIncident: (inc: Incident) => void;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({
  incidents,
  onOpenBroadcastModal,
  audioAlertsEnabled,
  setAudioAlertsEnabled,
  onSelectIncident,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | SeverityLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSev = severityFilter === 'ALL' || inc.severity === severityFilter;
    const matchesQuery = 
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesQuery;
  });

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'EARTHQUAKE': return <Activity className="w-4 h-4 text-rose-500" />;
      case 'FLOOD': return <Waves className="w-4 h-4 text-blue-500" />;
      case 'WILDFIRE': return <Flame className="w-4 h-4 text-amber-500" />;
      case 'CYCLONE': return <Wind className="w-4 h-4 text-sky-500" />;
      case 'CHEMICAL_LEAK': return <Biohazard className="w-4 h-4 text-purple-500" />;
      default: return <ShieldAlert className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getSeverityBadge = (level: SeverityLevel) => {
    switch (level) {
      case 'CRITICAL': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'SEVERE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MODERATE': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const testAlertSound = () => {
    playEmergencyAlertSound('CRITICAL');
  };

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-gradient-to-br from-slate-50 via-white to-sky-50/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Banner Section */}
        <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Emergency Alerting & Broadcast Center
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              Real-time multi-channel incident dispatches, cellular flash alerts, evacuation alarms, and emergency responder notification streams.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={testAlertSound}
              className="px-3.5 py-2 text-xs font-bold rounded-xl glass-card hover:bg-white text-slate-700 flex items-center gap-1.5 border border-slate-200 shadow-sm active:scale-95 transition"
              title="Test Emergency Audio Siren Tone"
            >
              <Volume2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Test Chime</span>
            </button>

            <button
              onClick={onOpenBroadcastModal}
              className="px-4 py-2 text-xs font-extrabold rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-md shadow-rose-200 flex items-center gap-2 active:scale-95 transition"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>ISSUE BROADCAST SOS</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Ribbon */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3.5 rounded-2xl">
          {/* Severity Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['ALL', 'CRITICAL', 'SEVERE', 'MODERATE', 'WATCH'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  severityFilter === sev
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter active alerts..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
            />
          </div>
        </div>

        {/* Alerts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => onSelectIncident(inc)}
              className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:shadow-lg hover:border-indigo-200 cursor-pointer transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getSeverityBadge(inc.severity)}`}>
                    {inc.severity}
                  </span>
                  <span className="text-xs text-slate-700 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    {inc.reportedAt}
                  </span>
                </div>

                <div className="flex items-start gap-2.5 mb-2">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                    {getIncidentIcon(inc.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                      {inc.title}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                      {inc.locationName}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 my-2">
                  {inc.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                  <span>Casualties: <b className="text-rose-600">{inc.casualties}</b></span>
                  <span>Affected: <b>{inc.affectedPopulation.toLocaleString()}</b></span>
                </div>
                <span className="text-[11px] font-bold text-indigo-600 group-hover:underline flex items-center gap-0.5">
                  View Map &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredIncidents.length === 0 && (
          <div className="glass-card p-12 rounded-3xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">No Alerts Found</h4>
            <p className="text-xs text-slate-700">No active incidents matching the selected severity or search criteria.</p>
          </div>
        )}

      </div>
    </div>
  );
};
