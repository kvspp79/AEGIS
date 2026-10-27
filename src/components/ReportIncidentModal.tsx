import React, { useState } from 'react';
import { X, ShieldAlert, MapPin, AlertTriangle, Users, HeartPulse } from 'lucide-react';
import { Incident, IncidentType, SeverityLevel } from '../types';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: Incident) => void;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<IncidentType>('FLOOD');
  const [severity, setSeverity] = useState<SeverityLevel>('CRITICAL');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState('13.0827');
  const [lng, setLng] = useState('80.2707');
  const [casualties, setCasualties] = useState(0);
  const [affectedPopulation, setAffectedPopulation] = useState(1500);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !locationName) return;

    const basePriority = severity === 'CRITICAL' ? 95 : severity === 'SEVERE' ? 80 : 60;

    const newIncident: Incident = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      title,
      type,
      severity,
      coordinates: { lat: parseFloat(lat) || 13.0827, lng: parseFloat(lng) || 80.2707 },
      locationName,
      casualties: Number(casualties),
      affectedPopulation: Number(affectedPopulation),
      reportedAt: 'Just Now',
      status: 'VERIFIED',
      basePriority,
      calculatedPriority: basePriority,
      agingMinutes: 0,
      description: description || `${type} emergency reported at ${locationName}. Responders dispatched.`,
      hazardRadiusMeters: severity === 'CRITICAL' ? 1200 : 600,
    };

    onSubmit(newIncident);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border-white relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Report Emergency Hotspot</h3>
            <p className="text-xs text-slate-700">Submit verified field incident for algorithmic priority dispatch.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-slate-700">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Incident Headline</label>
            <input
              type="text"
              required
              placeholder="e.g. Flash Flood Breach at Marina Underpass"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Disaster Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IncidentType)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="FLOOD">Flood</option>
                <option value="EARTHQUAKE">Earthquake</option>
                <option value="WILDFIRE">Wildfire</option>
                <option value="CYCLONE">Cyclone</option>
                <option value="CHEMICAL_LEAK">Chemical Leak</option>
                <option value="BUILDING_COLLAPSE">Building Collapse</option>
                <option value="LANDSLIDE">Landslide</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="CRITICAL">Critical (Immediate Hazard)</option>
                <option value="SEVERE">Severe (High Threat)</option>
                <option value="MODERATE">Moderate</option>
                <option value="MINOR">Minor Watch</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Location / Landmark Name</label>
            <input
              type="text"
              required
              placeholder="e.g. East Coast Highway Bridge 4"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Latitude</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Longitude</label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reported Casualties</label>
              <input
                type="number"
                min="0"
                value={casualties}
                onChange={(e) => setCasualties(+e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Affected Population</label>
              <input
                type="number"
                min="0"
                value={affectedPopulation}
                onChange={(e) => setAffectedPopulation(+e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Field Situation Summary</label>
            <textarea
              rows={2}
              placeholder="Describe access routes, fire spread, water level, or entrapped victims..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-200 transition"
            >
              Submit & Push to Heap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
