import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Truck, 
  Home, 
  Package, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter,
  Send,
  BatteryCharging,
  Users
} from 'lucide-react';
import { Incident, Responder, Shelter, ResourceSupply } from '../types';

interface ResourceTrackerProps {
  incidents: Incident[];
  responders: Responder[];
  shelters: Shelter[];
  supplies: ResourceSupply[];
  onSelectIncident: (inc: Incident) => void;
  onSelectResponder: (resp: Responder) => void;
  onDispatchResponder: (responderId: string, incidentId: string) => void;
}

export const ResourceTracker: React.FC<ResourceTrackerProps> = ({
  incidents,
  responders,
  shelters,
  supplies,
  onSelectIncident,
  onSelectResponder,
  onDispatchResponder,
}) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'INCIDENTS' | 'RESPONDERS' | 'SHELTERS' | 'SUPPLIES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const totalItemsCount = incidents.length + responders.length + shelters.length + supplies.length;

  const filteredIncidents = incidents.filter((i) => 
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResponders = responders.filter((r) => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.baseStation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShelters = shelters.filter((s) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSupplies = supplies.filter((sp) => 
    sp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sp.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sp.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-gradient-to-br from-slate-50 via-white to-sky-50/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Title with Item Count Badge */}
        <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Layers className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Disaster Resource & Fleet Inventory</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold">
                  {totalItemsCount} ACTIVE ITEMS
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              Live tracking and depletion monitoring across 25 Incidents, 30 Responders, 20 Shelters, and 25 Critical Medical/Rescue Supplies.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-700 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all 100 items..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 glass-panel rounded-2xl">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeCategory === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All 100+ Items ({totalItemsCount})
          </button>
          <button
            onClick={() => setActiveCategory('INCIDENTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === 'INCIDENTS' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Incidents ({incidents.length})
          </button>
          <button
            onClick={() => setActiveCategory('RESPONDERS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === 'RESPONDERS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Responders ({responders.length})
          </button>
          <button
            onClick={() => setActiveCategory('SHELTERS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === 'SHELTERS' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            Shelters ({shelters.length})
          </button>
          <button
            onClick={() => setActiveCategory('SUPPLIES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === 'SUPPLIES' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Critical Supplies ({supplies.length})
          </button>
        </div>

        {/* 1. Incidents Section */}
        {(activeCategory === 'ALL' || activeCategory === 'INCIDENTS') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Active Emergency Hotspots & Incidents ({filteredIncidents.length})</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredIncidents.map((inc) => (
                <div key={inc.id} className="glass-card p-4 rounded-2xl hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-700">{inc.id}</span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        inc.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inc.severity}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{inc.title}</h4>
                    <p className="text-[11px] text-slate-700 mt-0.5">{inc.locationName}</p>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{inc.description}</p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-700">Casualties: <b className="text-rose-600">{inc.casualties}</b></span>
                    <button
                      onClick={() => onSelectIncident(inc)}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Locate Map &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Responders Section */}
        {(activeCategory === 'ALL' || activeCategory === 'RESPONDERS') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Emergency Fleet & Rescue Teams ({filteredResponders.length})</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredResponders.map((resp) => (
                <div key={resp.id} className="glass-card p-4 rounded-2xl hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-700">{resp.id}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        resp.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {resp.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{resp.name}</h4>
                    <p className="text-[11px] text-slate-700 mt-0.5">Base: {resp.baseStation}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 my-2">
                      <span>Speed: <b>{resp.speedKmh} km/h</b></span>
                      <span>Crew: <b>{resp.crewCount}</b></span>
                      <span>Ready: <b>{resp.readinessTimeMinutes}m</b></span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-slate-700 truncate max-w-[150px]">{resp.specialties.join(', ')}</span>
                    <button
                      onClick={() => onSelectResponder(resp)}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Inspect &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Shelters Section */}
        {(activeCategory === 'ALL' || activeCategory === 'SHELTERS') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Home className="w-4 h-4 text-teal-600" />
                <span>Evacuation Shelters & Relief Hubs ({filteredShelters.length})</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredShelters.map((shl) => {
                const pct = Math.round((shl.capacityCurrent / shl.capacityTotal) * 100);
                return (
                  <div key={shl.id} className="glass-card p-4 rounded-2xl hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-700">{shl.id}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          shl.status === 'FULL' ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'
                        }`}>
                          {shl.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{shl.name}</h4>
                      <p className="text-[11px] text-slate-700 mt-0.5">{shl.locationName}</p>
                      
                      <div className="my-2">
                        <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
                          <span>Occupancy</span>
                          <span>{shl.capacityCurrent} / {shl.capacityTotal} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct > 90 ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">Rations: <b>{shl.foodWaterStockDays} Days</b></span>
                      <span className="font-mono text-[10px] text-indigo-600">{shl.contactPhone}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Critical Supplies Section */}
        {(activeCategory === 'ALL' || activeCategory === 'SUPPLIES') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-sky-600" />
                <span>Critical Medical & Emergency Supply Inventories ({filteredSupplies.length})</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSupplies.map((sup) => (
                <div key={sup.id} className="glass-card p-4 rounded-2xl hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-700">{sup.id}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        sup.status === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : sup.status === 'LOW' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {sup.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{sup.name}</h4>
                    <p className="text-[11px] text-slate-700 mt-0.5">Depot: {sup.locationName}</p>
                    <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl my-2">
                      <span>Stock: <b>{sup.quantity} {sup.unit}</b></span>
                      <span>Weight: <b>{sup.weightKgPerUnit} kg/ea</b></span>
                      <span>Value: <b className="text-indigo-600">{sup.utilityValue} pts</b></span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] uppercase font-bold text-slate-700">{sup.category}</span>
                    <span className="text-[10px] text-slate-600">Payload Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
