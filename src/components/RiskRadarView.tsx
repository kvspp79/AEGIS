import React, { useState } from 'react';
import { 
  Activity, 
  Wind, 
  Waves, 
  Flame, 
  Biohazard, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Radar, 
  CheckCircle, 
  Thermometer, 
  Compass, 
  BarChart3,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { SeverityLevel } from '../types';

interface RegionalRiskData {
  region: string;
  seismicRisk: number; // 0 - 100
  floodRisk: number;
  stormRisk: number;
  hazmatRisk: number;
  compositeRiskIndex: number;
  level: SeverityLevel;
  primaryThreat: string;
  populationAtRisk: number;
  mitigationStatus: 'ACTIVE' | 'PREPARING' | 'STABLE';
}

const REGIONAL_SECTORS: RegionalRiskData[] = [
  {
    region: 'North Harbor & Industrial Belt',
    seismicRisk: 78,
    floodRisk: 65,
    stormRisk: 88,
    hazmatRisk: 92,
    compositeRiskIndex: 86,
    level: 'CRITICAL',
    primaryThreat: 'Toxic Chemical Plume & Cyclonic Tidal Surge',
    populationAtRisk: 145000,
    mitigationStatus: 'ACTIVE',
  },
  {
    region: 'Central Waterfront & Port Basin',
    seismicRisk: 85,
    floodRisk: 82,
    stormRisk: 90,
    hazmatRisk: 45,
    compositeRiskIndex: 82,
    level: 'CRITICAL',
    primaryThreat: 'Magnitude 6.4 Rupture & Seawall Overtop',
    populationAtRisk: 280000,
    mitigationStatus: 'ACTIVE',
  },
  {
    region: 'Old City Dense Heritage Quarters',
    seismicRisk: 89,
    floodRisk: 55,
    stormRisk: 60,
    hazmatRisk: 30,
    compositeRiskIndex: 76,
    level: 'SEVERE',
    primaryThreat: 'Unreinforced Masonry Pancake Collapses',
    populationAtRisk: 92000,
    mitigationStatus: 'PREPARING',
  },
  {
    region: 'East Coast Promenade Sector',
    seismicRisk: 62,
    floodRisk: 88,
    stormRisk: 95,
    hazmatRisk: 20,
    compositeRiskIndex: 78,
    level: 'SEVERE',
    primaryThreat: '125 km/h Cyclone Gales & High Surf Watch',
    populationAtRisk: 110000,
    mitigationStatus: 'ACTIVE',
  },
  {
    region: 'Western Tech Valley & Suburbs',
    seismicRisk: 42,
    floodRisk: 60,
    stormRisk: 55,
    hazmatRisk: 15,
    compositeRiskIndex: 48,
    level: 'MODERATE',
    primaryThreat: 'Highway Mudslide & Storm Runoff Ponding',
    populationAtRisk: 65000,
    mitigationStatus: 'STABLE',
  },
  {
    region: 'Southern Estuary & Highway Corridor',
    seismicRisk: 55,
    floodRisk: 72,
    stormRisk: 68,
    hazmatRisk: 40,
    compositeRiskIndex: 61,
    level: 'MODERATE',
    primaryThreat: 'Canal Backflow Inundation',
    populationAtRisk: 82000,
    mitigationStatus: 'PREPARING',
  },
];

export const RiskRadarView: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<RegionalRiskData>(REGIONAL_SECTORS[0]);
  const [simulatingUpdate, setSimulatingUpdate] = useState(false);

  const handleRefreshSensors = () => {
    setSimulatingUpdate(true);
    setTimeout(() => {
      setSimulatingUpdate(false);
    }, 600);
  };

  const getSeverityBadge = (level: SeverityLevel) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'SEVERE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MODERATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-gradient-to-br from-slate-50 via-white to-sky-50/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Title and Telemetry Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Radar className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Multi-Hazard Risk Radar & Early Warning Matrix
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              Live algorithmic hazard telemetry integrating seismic USGS feeds, meteorological cyclone radar, and infrastructure vulnerability scoring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshSensors}
              disabled={simulatingUpdate}
              className="px-4 py-2 text-xs font-bold rounded-xl glass-card hover:bg-white text-slate-700 flex items-center gap-2 border border-slate-200 shadow-sm active:scale-95 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${simulatingUpdate ? 'animate-spin' : ''}`} />
              <span>{simulatingUpdate ? 'Syncing...' : 'Sync Sensor Network'}</span>
            </button>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>124 SENSORS ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Top 4 Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Seismic Telemetry */}
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-bold uppercase tracking-wider">Seismic Intensity</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
                <span>M 6.4</span>
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  CRITICAL
                </span>
              </div>
              <p className="text-[11px] text-slate-700 mt-0.5">Epicenter 18km Offshore • Depth 12 km</p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full w-[84%]"></div>
            </div>
          </div>

          {/* Meteorological Cyclone Telemetry */}
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-bold uppercase tracking-wider">Cyclone Gale Storm</span>
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <Wind className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
                <span>125 km/h</span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  CATEGORY 3
                </span>
              </div>
              <p className="text-[11px] text-slate-700 mt-0.5">Barometric: 968 hPa • Heading WNW</p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full rounded-full w-[78%]"></div>
            </div>
          </div>

          {/* Flood Inundation Index */}
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-bold uppercase tracking-wider">Riverine Inundation</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Waves className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
                <span>+2.3 m</span>
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  ABOVE DANGER
                </span>
              </div>
              <p className="text-[11px] text-slate-700 mt-0.5">Sluice Discharge: 32,000 cusecs</p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full w-[92%]"></div>
            </div>
          </div>

          {/* Population Evacuation Counter */}
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-bold uppercase tracking-wider">Evacuated Citizens</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
                <span>48,250</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  74% PROGRESS
                </span>
              </div>
              <p className="text-[11px] text-slate-700 mt-0.5">Across 20 Active Relief Centers</p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[74%]"></div>
            </div>
          </div>

        </div>

        {/* Main Split: Regional Sector Table & Deep Threat Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Regional Table (7 Columns) */}
          <div className="lg:col-span-7 glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Regional Vulnerability & Threat Matrix</span>
              </h3>
              <span className="text-xs text-slate-700">Click row for deep inspection</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-100 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Sector</th>
                    <th className="py-2.5 px-2">Risk Index</th>
                    <th className="py-2.5 px-2">Primary Hazard</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2 text-right">Population</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {REGIONAL_SECTORS.map((sector) => {
                    const isSelected = selectedRegion.region === sector.region;
                    return (
                      <tr
                        key={sector.region}
                        onClick={() => setSelectedRegion(sector)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-indigo-50/80 font-medium' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{sector.region}</span>
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border mt-0.5 ${getSeverityBadge(sector.level)}`}>
                            {sector.level}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">{sector.compositeRiskIndex}</span>
                            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  sector.compositeRiskIndex >= 80 ? 'bg-rose-500' : sector.compositeRiskIndex >= 60 ? 'bg-amber-500' : 'bg-blue-500'
                                }`} 
                                style={{ width: `${sector.compositeRiskIndex}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 max-w-[140px] truncate text-slate-600">
                          {sector.primaryThreat}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            sector.mitigationStatus === 'ACTIVE' 
                              ? 'bg-rose-100 text-rose-700' 
                              : sector.mitigationStatus === 'PREPARING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {sector.mitigationStatus}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-slate-800">
                          {sector.populationAtRisk.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep Sector Analysis & Protocol Blueprint (5 Columns) */}
          <div className="lg:col-span-5 glass-panel p-5 sm:p-6 rounded-3xl space-y-5 border-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-700 block">
                  Focused Sector Telemetry
                </span>
                <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                  {selectedRegion.region}
                </h4>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${getSeverityBadge(selectedRegion.level)}`}>
                Score: {selectedRegion.compositeRiskIndex}/100
              </span>
            </div>

            {/* Individual Hazard Breakdown Bars */}
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-rose-500" />
                    Seismic Vulnerability
                  </span>
                  <span className="font-bold text-slate-800">{selectedRegion.seismicRisk}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${selectedRegion.seismicRisk}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Waves className="w-3.5 h-3.5 text-blue-500" />
                    Flood Inundation Threat
                  </span>
                  <span className="font-bold text-slate-800">{selectedRegion.floodRisk}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${selectedRegion.floodRisk}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-sky-500" />
                    Cyclonic Wind Shear
                  </span>
                  <span className="font-bold text-slate-800">{selectedRegion.stormRisk}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: `${selectedRegion.stormRisk}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Biohazard className="w-3.5 h-3.5 text-amber-500" />
                    Industrial Hazmat Risk
                  </span>
                  <span className="font-bold text-slate-800">{selectedRegion.hazmatRisk}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${selectedRegion.hazmatRisk}%` }}></div>
                </div>
              </div>
            </div>

            {/* Recommended Protocol Checklist */}
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-100 space-y-2">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                Command Protocol Actions
              </h5>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Activate Sector Siren & Cellular Broadcast Advisory.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Pre-stage 2 NDRF watercraft units at nearest ingress bridges.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Transfer elderly & pediatric patients to Tier-1 sports complex shelter.</span>
                </li>
              </ul>
            </div>

            {/* Emergency Hotline Banner */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
              <div>
                <span className="font-bold block">Disaster Hotline Dispatch</span>
                <span className="text-[11px] text-indigo-700">Toll-Free Emergency Center</span>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-mono font-bold text-xs">
                1078 (NDRF) / 112
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
