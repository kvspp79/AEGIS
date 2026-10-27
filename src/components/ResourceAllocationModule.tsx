import React, { useState } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  Send,
  AlertTriangle,
  RotateCcw,
  Clock,
  ShieldCheck,
  Package,
  Layers,
  MapPin,
  Ambulance,
  Flame,
  Radio
} from 'lucide-react';
import { Incident, Responder, IncidentStatus } from '../types';
import { useActiveMissionVehicles } from '../utils/useActiveMissionVehicles';

export interface RealDeployedSupply {
  id: string;
  supplyName: string;
  quantity: number;
  unit: string;
  incidentTitle: string;
  incidentId: string;
  dispatchedAt: string;
  status: 'DISPATCHED' | 'DELIVERED';
}

interface ResourceAllocationModuleProps {
  incidents: Incident[];
  responders: Responder[];
  onRecycleResponder?: (responderId: string) => void;
  onUpdateIncidentStatus?: (incidentId: string, status: IncidentStatus) => void;
  onQuickDispatch?: (incidentId: string, preferredResponderId?: string) => void;
}

export const ResourceAllocationModule: React.FC<ResourceAllocationModuleProps> = ({
  incidents,
  responders,
  onRecycleResponder,
  onUpdateIncidentStatus,
  onQuickDispatch,
}) => {
  // Use custom dynamic vehicle allocation hook
  const {
    activeMissionVehicles,
    availableVehicles,
    totalActiveMissions,
    totalAvailableVehicles,
    completeMissionAndRecycle,
  } = useActiveMissionVehicles(
    responders,
    incidents,
    onRecycleResponder,
    onUpdateIncidentStatus
  );

  // Real supply deployments (only populated when actual deployments occur in the app)
  const [realDeployments, setRealDeployments] = useState<RealDeployedSupply[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || '');
  const [selectedSupplyName, setSelectedSupplyName] = useState<string>('Trauma First-Aid Emergency Kits');
  const [supplyQuantity, setSupplyQuantity] = useState<number>(10);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Available supply types to deploy
  const standardSupplyOptions = [
    { name: 'Trauma First-Aid Emergency Kits', unit: 'Kits' },
    { name: 'Sterile IV Saline Solutions', unit: 'Bags' },
    { name: 'Clean Potable Drinking Water Packs', unit: 'Liters' },
    { name: 'High-Calorie Ready-to-Eat Rations', unit: 'Packs' },
    { name: 'Emergency Oxygen Cylinders (40L)', unit: 'Tanks' },
    { name: 'Rescue Life Jackets & PFDs', unit: 'Units' },
    { name: 'Thermal Insulation Emergency Blankets', unit: 'Blankets' },
  ];

  const handleDeploySupply = (e: React.FormEvent) => {
    e.preventDefault();
    const targetIncident = incidents.find((i) => i.id === selectedIncidentId);
    if (!targetIncident) return;

    const opt = standardSupplyOptions.find((o) => o.name === selectedSupplyName) || standardSupplyOptions[0];

    const newDeployment: RealDeployedSupply = {
      id: `DEP-${Date.now().toString().slice(-4)}`,
      supplyName: opt.name,
      quantity: supplyQuantity,
      unit: opt.unit,
      incidentTitle: targetIncident.title,
      incidentId: targetIncident.id,
      dispatchedAt: new Date().toLocaleTimeString(),
      status: 'DISPATCHED',
    };

    setRealDeployments((prev) => [newDeployment, ...prev]);
    setSuccessNotice(`Successfully deployed ${supplyQuantity} ${opt.unit} of "${opt.name}" to "${targetIncident.title}".`);

    setTimeout(() => {
      setSuccessNotice(null);
    }, 4000);
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'AMBULANCE':
        return <Ambulance className="w-4 h-4 text-emerald-600" />;
      case 'FIRE_TRUCK':
        return <Flame className="w-4 h-4 text-rose-600" />;
      default:
        return <Truck className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div id="resource-allocation-module" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Fleet & Resource Dispatch Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">Auto-Recycling System</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Active Missions & Resource Management
          </h1>
          <p className="text-xs text-slate-500">
            Dynamically filters vehicles on active duty. Completing or resolving an emergency incident automatically recycles units back to Available.
          </p>
        </div>

        {/* Live Fleet Statistics */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
            <span className="text-[10px] font-bold uppercase text-indigo-600 block">Active Missions</span>
            <span className="text-lg font-black text-indigo-900 leading-none">{totalActiveMissions}</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-600 block">Available Fleet</span>
            <span className="text-lg font-black text-emerald-900 leading-none">{totalAvailableVehicles}</span>
          </div>
        </div>
      </div>

      {/* Success Notice */}
      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button 
            onClick={() => setSuccessNotice(null)} 
            className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. DYNAMIC ACTIVE MISSIONS SECTION (Strictly only vehicles currently assigned to active missions) */}
      <div className="glass-card rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Active Missions ({totalActiveMissions} Vehicles Deployed)
              </h2>
              <p className="text-[11px] text-slate-500">
                Filtered dynamically by custom hook — only vehicles assigned to an active unresolved incident are displayed here.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
            Live Filter Active
          </span>
        </div>

        {activeMissionVehicles.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">All Vehicles Available & Standby</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently 0 vehicles on active dispatch. Dispatched units will appear here automatically when assigned to an incident.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Vehicle / Unit</th>
                  <th className="py-3 px-4">Type & Base</th>
                  <th className="py-3 px-4">Assigned Incident</th>
                  <th className="py-3 px-4">Incident Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Mission Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {activeMissionVehicles.map(({ responder, incident, missionDurationMinutes }) => {
                  return (
                    <tr key={responder.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-slate-100">
                            {getVehicleIcon(responder.type)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{responder.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {responder.id} • Call: {responder.callsign}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 block w-fit">
                          {responder.type}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Base: {responder.baseStation}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {incident ? (
                          <div>
                            <div className="font-bold text-slate-800 truncate max-w-xs">
                              {incident.title}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{incident.locationName}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No incident linked</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                          {incident?.status || 'RESPONDING'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>~{missionDurationMinutes} min</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {incident && (
                          <button
                            onClick={() => completeMissionAndRecycle(incident.id, responder.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95"
                            title="Resolve Incident & Automatically Recycle Vehicle to Available"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Resolve & Recycle</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. AVAILABLE FLEET RESOURCES (Ready for Immediate Dispatch) */}
      <div className="glass-card rounded-3xl border border-slate-200/80 bg-white shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Available Fleet Resources ({totalAvailableVehicles} Units on Standby)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Recycled units automatically return here
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableVehicles.slice(0, 6).map((veh) => (
            <div
              key={veh.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-indigo-50/40 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0">
                  {getVehicleIcon(veh.type)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 truncate">{veh.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">{veh.baseStation}</div>
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 mt-1">
                    AVAILABLE
                  </span>
                </div>
              </div>

              {incidents.filter((i) => i.status !== 'RESOLVED').length > 0 && onQuickDispatch && (
                <button
                  onClick={() => {
                    const openInc = incidents.find((i) => i.status !== 'RESOLVED');
                    if (openInc) {
                      onQuickDispatch(openInc.id, veh.id);
                    }
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition shrink-0"
                >
                  Dispatch
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. REAL DEPLOYMENT SECTION (Replaces fake auto-ticking list with real user actions) */}
      <div className="glass-card rounded-3xl border border-slate-200/80 bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Package className="w-4 h-4 text-indigo-600" />
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Emergency Supplies Deployment (Real Operations)
            </h2>
            <p className="text-[11px] text-slate-500">
              Only authentic relief items dispatched by operators to real emergency incidents are recorded below.
            </p>
          </div>
        </div>

        {/* Dispatch Form */}
        <form onSubmit={handleDeploySupply} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Emergency Incident</label>
            <select
              value={selectedIncidentId}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white font-medium text-slate-800 outline-none"
            >
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.title} ({inc.locationName.slice(0, 20)}...)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Supply Type</label>
            <select
              value={selectedSupplyName}
              onChange={(e) => setSelectedSupplyName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white font-medium text-slate-800 outline-none"
            >
              {standardSupplyOptions.map((opt) => (
                <option key={opt.name} value={opt.name}>
                  {opt.name} ({opt.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              max="5000"
              value={supplyQuantity}
              onChange={(e) => setSupplyQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white font-bold text-slate-800 outline-none"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Deploy Supplies</span>
            </button>
          </div>
        </form>

        {/* Real Deployment Log Table (Empty state until real deployment occurs) */}
        <div className="pt-2">
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
            Real Deployment Log ({realDeployments.length} Recorded)
          </h3>

          {realDeployments.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
              <Package className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500 font-medium">
                No simulated fake items. Dispatched supplies will appear here in real time when deployed to an emergency incident above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-3">Batch ID</th>
                    <th className="py-2.5 px-3">Supplies Item</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Target Incident</th>
                    <th className="py-2.5 px-3">Dispatched Time</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {realDeployments.map((dep) => (
                    <tr key={dep.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{dep.id}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{dep.supplyName}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{dep.quantity} {dep.unit}</td>
                      <td className="py-2.5 px-3 text-slate-700">{dep.incidentTitle}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{dep.dispatchedAt}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {dep.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
