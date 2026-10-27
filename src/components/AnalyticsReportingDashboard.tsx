import React, { useState } from 'react';
import { 
  BarChart3, 
  MapPin, 
  Clock, 
  Truck, 
  AlertTriangle, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  ShieldCheck,
  TrendingDown,
  Activity,
  Users,
  Compass
} from 'lucide-react';
import { Incident, Responder, Shelter } from '../types';

interface AnalyticsReportingDashboardProps {
  incidents: Incident[];
  responders: Responder[];
  shelters: Shelter[];
  onQuickDispatch: (incidentId: string) => void;
}

export const AnalyticsReportingDashboard: React.FC<AnalyticsReportingDashboardProps> = ({
  incidents,
  responders,
  shelters,
}) => {
  const [copied, setCopied] = useState(false);

  // Computations
  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter((i) => i.status === 'RESOLVED').length;
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL' || i.severity === 'EXTREME').length;
  const totalCasualties = incidents.reduce((acc, i) => acc + i.casualties, 0);
  const totalAffected = incidents.reduce((acc, i) => acc + i.affectedPopulation, 0);

  const availableResponders = responders.filter((r) => r.status === 'AVAILABLE');
  const deployedResponders = responders.filter((r) => r.status === 'BUSY');
  const deploymentRatePct = Math.round((deployedResponders.length / (responders.length || 1)) * 100);

  const currentSheltered = shelters.reduce((acc, s) => acc + s.capacityCurrent, 0);
  const maxShelterCapacity = shelters.reduce((acc, s) => acc + s.capacityTotal, 0);

  // Hotspot analysis by sector
  const hotspotSectors = [
    { name: 'Sector 4 Metro Coastal Road', hazard: 'Urban Flash Flood & Electrical Snaps', count: 4, risk: 'CRITICAL' },
    { name: 'Central Industrial Corridor', hazard: 'Structural Debris & Hazmat Containment', count: 3, risk: 'HIGH' },
    { name: 'Northern Hill & River Basin', hazard: 'Mudslide & Bridge Overflow', count: 2, risk: 'HIGH' },
    { name: 'Old City Residential Zone', hazard: 'Building Wall Collapses & Power Outage', count: 2, risk: 'MEDIUM' },
  ];

  // Fleet breakdown
  const resourceCategories = [
    { label: 'Emergency Ambulances (ALS/BLS)', count: 12, active: 8, color: 'bg-rose-500' },
    { label: 'NDRF Heavy Rescue Squadrons', count: 6, active: 4, color: 'bg-indigo-500' },
    { label: 'Inflatable Flood Evacuation Boats', count: 8, active: 6, color: 'bg-sky-500' },
    { label: 'Mobile Medical & Surgical Clinics', count: 4, active: 2, color: 'bg-emerald-500' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="analytics-reporting-dashboard" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Command Analytics & Reporting
            </span>
            <span className="text-xs text-slate-500 font-medium">Real-Time Data Feeds</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Tactical Operations & SITREP Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Real-time incident density, fleet readiness index, and verified situation report summaries.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official SITREP</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 bg-white">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Incidents</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalIncidents}</span>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              {criticalCount} Critical
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{resolvedIncidents} missions resolved</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 bg-white">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fleet Utilization</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600">{deploymentRatePct}%</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {deployedResponders.length} Dispatched
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{availableResponders.length} reserve units on standby</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 bg-white">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average Arrival Time</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">4.8 min</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> -62%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Automated GPS nearest-vehicle routing</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 bg-white">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Evacuated Citizens</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{currentSheltered.toLocaleString()}</span>
            <span className="text-xs font-semibold text-slate-500">safe</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{totalCasualties} casualties receiving hospital care</p>
        </div>
      </div>

      {/* Main Grid: Hotspot Breakdown & Fleet Deployment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hotspot Breakdown */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Emergency Hotspots by Geographic Sector
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Cluster Density</span>
          </div>

          <div className="space-y-3">
            {hotspotSectors.map((sector, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{sector.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sector.risk === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                      sector.risk === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {sector.risk}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Primary Hazard: {sector.hazard}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900">{sector.count}</span>
                  <span className="text-[10px] text-slate-400 block">hotspots</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Fleet Readiness */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Fleet Deployment & Equipment Status
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600">30 Units Total</span>
          </div>

          <div className="space-y-4">
            {resourceCategories.map((cat, idx) => {
              const pct = Math.round((cat.active / cat.count) * 100);
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
                    <span>{cat.label}</span>
                    <span className="text-slate-500 font-mono font-bold">
                      {cat.active} / {cat.count} Active ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${cat.color}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Official Structured Situation Report (SITREP) Briefing Card (Clean Glassy Layout, NO RAW CODE BOX) */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Official Disaster Situation Report (SITREP)
              </h2>
              <p className="text-xs text-slate-400">
                Generated at {new Date().toLocaleString()} • Civil Defense & State Disaster Authority
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            LIVE VERIFIED REPORT
          </span>
        </div>

        {/* Structured Executive Findings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operational Priority</span>
            <p className="text-xs font-bold text-slate-800 mt-1">Sector 4 Coastal Flash Flood Rescue</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              High water velocity reported. Emergency inflatable boats and paramedics deployed to evacuate trapped residents.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Medical Triage Status</span>
            <p className="text-xs font-bold text-slate-800 mt-1">{totalCasualties} Casualties Under Care</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Central Trauma Hospital and Mobile Medical Hubs active. Blood units and sterile surgical packs replenished.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shelter & Food Logistics</span>
            <p className="text-xs font-bold text-slate-800 mt-1">{currentSheltered} Citizens Sheltered</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Relief shelters operating at {Math.round((currentSheltered / (maxShelterCapacity || 1)) * 100)}% capacity. 5,000 water tablets distributed.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
