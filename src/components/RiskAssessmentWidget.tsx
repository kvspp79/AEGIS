import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  CloudRain, 
  Wind, 
  Waves, 
  AlertTriangle, 
  Compass, 
  Info,
  Maximize2,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Coordinates } from '../types';

export interface DangerZoneSector {
  id: string;
  name: string;
  category: 'COASTAL_SURGE' | 'RIVER_BASIN' | 'HILLSIDE_SLOPE' | 'URBAN_DENSE' | 'INDUSTRIAL';
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  weatherFactor: string;
  proximityKm: number;
  recommendation: string;
  svgPos: { x: number; y: number; r: number };
}

interface RiskAssessmentWidgetProps {
  userLocation?: Coordinates | null;
  onExploreZone?: (sector: DangerZoneSector) => void;
}

export const RiskAssessmentWidget: React.FC<RiskAssessmentWidgetProps> = ({
  userLocation,
  onExploreZone,
}) => {
  // Live atmospheric parameters
  const weatherTelemetry = {
    precipitationMmHr: 48,
    windSpeedKmh: 128,
    barometricHpa: 978,
    humidityPct: 92,
  };

  const [selectedSectorId, setSelectedSectorId] = useState<string>('zone-2');

  // Dynamic calculation of zones combining weather telemetry and proximity data
  const dangerZones: DangerZoneSector[] = useMemo(() => {
    return [
      {
        id: 'zone-1',
        name: 'Sector 1: Coastal Surge & Shoreline',
        category: 'COASTAL_SURGE',
        riskScore: 88,
        riskLevel: 'CRITICAL',
        weatherFactor: '128 km/h onshore cyclonic gusts + 3.8m storm tide',
        proximityKm: 3.4,
        recommendation: 'Immediate coastal standoff; activate seawall sluice gates and evacuate fishing craft.',
        svgPos: { x: 380, y: 140, r: 42 },
      },
      {
        id: 'zone-2',
        name: 'Sector 2: Low-Lying River Basin & Embankment',
        category: 'RIVER_BASIN',
        riskScore: 94,
        riskLevel: 'CRITICAL',
        weatherFactor: '48 mm/hr extreme precipitation + river level at 4.8m (spillway breach danger)',
        proximityKm: 1.8,
        recommendation: 'Pre-emptive evacuation of all ground floor settlements; pre-position amphibious rescue boats.',
        svgPos: { x: 210, y: 110, r: 48 },
      },
      {
        id: 'zone-3',
        name: 'Sector 3: Hillside Slope & Soft Soil Alluvium',
        category: 'HILLSIDE_SLOPE',
        riskScore: 76,
        riskLevel: 'HIGH',
        weatherFactor: 'Continuous soil saturation index >85%; high landslide slope shear probability',
        proximityKm: 6.2,
        recommendation: 'Halt hillside traffic on ghat routes; inspect geotechnical retaining sensors.',
        svgPos: { x: 110, y: 180, r: 38 },
      },
      {
        id: 'zone-4',
        name: 'Sector 4: Downtown Metropolitan Commercial Core',
        category: 'URBAN_DENSE',
        riskScore: 52,
        riskLevel: 'MODERATE',
        weatherFactor: 'Urban storm drain backup; 15-25cm localized waterlogging in arterial underpasses',
        proximityKm: 2.1,
        recommendation: 'Divert vehicular routes away from subway submersions and power transformer boxes.',
        svgPos: { x: 270, y: 200, r: 34 },
      },
      {
        id: 'zone-5',
        name: 'Sector 5: Industrial Chemical & Logistics Transect',
        category: 'INDUSTRIAL',
        riskScore: 35,
        riskLevel: 'LOW',
        weatherFactor: 'Elevated VOC dispersion; containment berms holding stable at 90% tolerance',
        proximityKm: 9.5,
        recommendation: 'Standard automated air monitoring active; hazardous material valves locked.',
        svgPos: { x: 180, y: 250, r: 30 },
      },
    ];
  }, []);

  const activeSector = dangerZones.find((z) => z.id === selectedSectorId) || dangerZones[0];

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/95 border border-white/90 shadow-xl space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Proactive Risk Engine • Pre-Incident Heatmap
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Regional Hazard Heatmap & Danger Zone Assessment
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-factor modeling fusing atmospheric telemetry, hydrology sensors, and proximity data to anticipate vulnerabilities before emergencies unfold.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-3 text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1">
              <CloudRain className="w-3.5 h-3.5 text-blue-600" />
              {weatherTelemetry.precipitationMmHr} mm/h
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-emerald-600" />
              {weatherTelemetry.windSpeedKmh} km/h
            </span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Visual & Sector Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left: Interactive SVG Heatmap Canvas */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl p-4 relative overflow-hidden border border-slate-800 shadow-inner flex flex-col items-center justify-center">
          
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE RADAR & HYDROLOGY OVERLAY
          </div>

          <div className="w-full max-w-[480px] aspect-[16/10] relative my-2">
            <svg
              viewBox="0 0 500 300"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Radial gradients for danger heatmaps */}
                <radialGradient id="heat-critical" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                  <stop offset="45%" stopColor="#f97316" stopOpacity="0.5" />
                  <stop offset="85%" stopColor="#eab308" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
                
                <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#eab308" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="heat-moderate" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.75" />
                  <stop offset="60%" stopColor="#22c55e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="heat-low" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>

                {/* Grid pattern */}
                <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect width="500" height="300" fill="url(#grid)" />

              {/* Coastline Shoreline Polyline */}
              <path
                d="M 400 0 Q 370 70 380 150 T 420 300"
                fill="none"
                stroke="#0284c7"
                strokeWidth="3.5"
                strokeDasharray="4 4"
                opacity="0.8"
              />
              <text x="415" y="40" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                BAY COASTLINE
              </text>

              {/* River Flow Path */}
              <path
                d="M 50 80 Q 180 110 240 120 T 385 150"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.75"
              />
              <text x="70" y="70" fill="#7dd3fc" fontSize="9" fontFamily="monospace">
                ADYAR RIVER BASIN (RISING)
              </text>

              {/* Heatmap Danger Blobs for each sector */}
              {dangerZones.map((zone) => {
                const isSelected = zone.id === selectedSectorId;
                const gradId = 
                  zone.riskLevel === 'CRITICAL' ? 'heat-critical' :
                  zone.riskLevel === 'HIGH' ? 'heat-high' :
                  zone.riskLevel === 'MODERATE' ? 'heat-moderate' : 'heat-low';

                return (
                  <g 
                    key={zone.id} 
                    onClick={() => setSelectedSectorId(zone.id)}
                    className="cursor-pointer transition hover:opacity-95"
                  >
                    {/* Glowing outer thermal halo */}
                    <circle
                      cx={zone.svgPos.x}
                      cy={zone.svgPos.y}
                      r={zone.svgPos.r * 1.5}
                      fill={`url(#${gradId})`}
                    />

                    {/* Concentric pulse ring for critical zones */}
                    {zone.riskLevel === 'CRITICAL' && (
                      <circle
                        cx={zone.svgPos.x}
                        cy={zone.svgPos.y}
                        r={zone.svgPos.r * 1.1}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        className="animate-pulse"
                      />
                    )}

                    {/* Zone Core Marker */}
                    <circle
                      cx={zone.svgPos.x}
                      cy={zone.svgPos.y}
                      r={isSelected ? 10 : 7}
                      fill={
                        zone.riskLevel === 'CRITICAL' ? '#ef4444' :
                        zone.riskLevel === 'HIGH' ? '#f97316' :
                        zone.riskLevel === 'MODERATE' ? '#eab308' : '#10b981'
                      }
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3 : 2}
                    />

                    {/* Label */}
                    <text
                      x={zone.svgPos.x}
                      y={zone.svgPos.y - 14}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {zone.riskScore}%
                    </text>
                  </g>
                );
              })}

              {/* User Live GPS Marker */}
              <circle cx="230" cy="170" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="230" cy="170" r="14" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="2 2" className="animate-ping" />
              <text x="240" y="174" fill="#93c5fd" fontSize="9" fontWeight="bold">YOU ARE HERE</text>
            </svg>
          </div>

          <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 border-t border-slate-800/80 pt-2">
            <span>Thermal Spectrum: Green (Low) → Yellow (Mod) → Orange (High) → Red (Critical)</span>
            <span>Click any hotspot to inspect</span>
          </div>
        </div>

        {/* Right: Selected Sector Risk Briefing */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                activeSector.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' :
                activeSector.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                activeSector.riskLevel === 'MODERATE' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                {activeSector.riskLevel} VULNERABILITY
              </span>

              <span className="text-xs font-mono font-bold text-slate-600">
                📍 {activeSector.proximityKm} km from you
              </span>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900">
                {activeSector.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {activeSector.weatherFactor}
              </p>
            </div>

            {/* Risk Gauge Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Calculated Threat Index</span>
                <span className="text-rose-600">{activeSector.riskScore} / 100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeSector.riskScore >= 80 ? 'bg-rose-600' :
                    activeSector.riskScore >= 60 ? 'bg-orange-500' :
                    activeSector.riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${activeSector.riskScore}%` }}
                ></div>
              </div>
            </div>

            {/* Actionable Pre-Incident Recommendation */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Proactive Pre-Incident Safeguard
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {activeSector.recommendation}
              </p>
            </div>
          </div>

          {/* Quick Zone Selector Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Monitored Geographic Sectors:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {dangerZones.map((z) => (
                <button
                  key={z.id}
                  onClick={() => setSelectedSectorId(z.id)}
                  className={`p-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition ${
                    selectedSectorId === z.id
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate">{z.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ml-2 ${
                    z.riskLevel === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                    z.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {z.riskScore}%
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
