import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  MapPin, 
  RefreshCw, 
  ExternalLink, 
  Navigation, 
  Radio, 
  Layers, 
  Clock, 
  Wifi, 
  CheckCircle2
} from 'lucide-react';
import { Coordinates } from '../types';

export interface GlobalDisasterEvent {
  id: string;
  title: string;
  place: string;
  magnitude: number;
  time: number;
  updated: number;
  depthKm: number;
  coordinates: Coordinates;
  distanceKm: number;
  url: string;
  type: 'earthquake' | 'weather' | 'hazard';
  significance: number;
}

interface GlobalDisasterFeedProps {
  userLocation?: Coordinates | null;
  userCoordinates?: Coordinates | null;
  onPlotOnMap?: (coords: Coordinates, title: string) => void;
  onSelectDisaster?: (coords: Coordinates, title: string) => void;
  compact?: boolean;
}

// Precise Haversine distance in kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const GlobalDisasterFeed: React.FC<GlobalDisasterFeedProps> = ({
  userLocation: propLocation,
  userCoordinates,
  onPlotOnMap,
  onSelectDisaster,
  compact = false,
}) => {
  const effectiveLocation = propLocation || userCoordinates;
  const handlePlot = onPlotOnMap || onSelectDisaster;
  const [events, setEvents] = useState<GlobalDisasterEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filterMode, setFilterMode] = useState<'PROXIMITY' | 'MAGNITUDE' | 'RECENT'>('PROXIMITY');
  const [maxDistanceFilter, setMaxDistanceFilter] = useState<number>(0); // 0 = all
  
  // Real GPS Coordinates from browser
  const [gpsLocation, setGpsLocation] = useState<Coordinates>(
    effectiveLocation || { lat: 13.0827, lng: 80.2707 } // Fallback regional reference
  );
  const [isGpsLive, setIsGpsLive] = useState<boolean>(false);

  // Request browser GPS position
  useEffect(() => {
    if (effectiveLocation) {
      setGpsLocation(effectiveLocation);
      setIsGpsLive(true);
      return;
    }

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setIsGpsLive(true);
        },
        (err) => {
          console.warn('Geolocation access fallback:', err.message);
          // Keep regional coordinate
          setIsGpsLive(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [effectiveLocation]);

  // Fetch real-world disaster events from public USGS GeoJSON API
  const fetchLiveDisasterEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Official USGS Real-Time Earthquake GeoJSON Feed (all earthquakes in the past 24 hours)
      const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
      if (!res.ok) {
        throw new Error(`Public Disaster API responded with status ${res.status}`);
      }
      const data = await res.json();

      const userLat = gpsLocation.lat;
      const userLng = gpsLocation.lng;

      const parsedEvents: GlobalDisasterEvent[] = (data.features || []).map((feat: any) => {
        const coords = feat.geometry?.coordinates || [0, 0, 0];
        const eventLng = coords[0];
        const eventLat = coords[1];
        const depth = coords[2] || 0;
        const mag = feat.properties?.mag || 0;
        const dist = calculateDistanceKm(userLat, userLng, eventLat, eventLng);

        return {
          id: feat.id || `usgs-${Math.random()}`,
          title: feat.properties?.title || 'Seismic Incident',
          place: feat.properties?.place || 'Unknown location',
          magnitude: Math.round(mag * 10) / 10,
          time: feat.properties?.time || Date.now(),
          updated: feat.properties?.updated || Date.now(),
          depthKm: Math.round(depth * 10) / 10,
          coordinates: { lat: eventLat, lng: eventLng },
          distanceKm: dist,
          url: feat.properties?.url || 'https://earthquake.usgs.gov/',
          type: 'earthquake',
          significance: feat.properties?.sig || 0,
        };
      });

      setEvents(parsedEvents);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to load global disaster feed:', err);
      setError(err?.message || 'Failed to connect to public disaster feed');
    } finally {
      setIsLoading(false);
    }
  }, [gpsLocation]);

  useEffect(() => {
    fetchLiveDisasterEvents();
    // Auto refresh every 60 seconds
    const timer = setInterval(() => {
      fetchLiveDisasterEvents();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchLiveDisasterEvents]);

  // Sort and filter events
  const displayedEvents = React.useMemo(() => {
    let list = [...events];

    if (maxDistanceFilter > 0) {
      list = list.filter((e) => e.distanceKm <= maxDistanceFilter);
    }

    if (filterMode === 'PROXIMITY') {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (filterMode === 'MAGNITUDE') {
      list.sort((a, b) => b.magnitude - a.magnitude);
    } else {
      list.sort((a, b) => b.time - a.time);
    }

    return compact ? list.slice(0, 6) : list.slice(0, 24);
  }, [events, filterMode, maxDistanceFilter, compact]);

  const nearestEvent = events.length > 0
    ? [...events].sort((a, b) => a.distanceKm - b.distanceKm)[0]
    : null;

  return (
    <div className={`glass-panel rounded-3xl border border-white/90 bg-white/95 shadow-xl overflow-hidden ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'}`}>
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Public Disaster Stream
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              USGS Global Real-Time API
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Activity className="w-6 h-6 text-rose-600" />
            Global Disaster & Hazard Feed
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-world seismic and environmental disasters calculated relative to your current GPS coordinates.
          </p>
        </div>

        {/* Live GPS & Refresh Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <Navigation className={`w-3.5 h-3.5 ${isGpsLive ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>GPS: {gpsLocation.lat.toFixed(2)}°, {gpsLocation.lng.toFixed(2)}°</span>
            {isGpsLive && <span className="text-[10px] text-emerald-600 font-bold ml-1">Live</span>}
          </div>

          <button
            onClick={() => fetchLiveDisasterEvents()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition active:scale-95 disabled:opacity-50"
            title="Refresh disaster feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Proximity Summary Callout */}
      {nearestEvent && (
        <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/50 border border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-200 shrink-0">
              M{nearestEvent.magnitude}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                  Closest Recorded Event to You
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {timeAgo(nearestEvent.time)}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                {nearestEvent.place}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Proximity</span>
              <span className="text-sm font-black text-indigo-700 font-mono">
                {nearestEvent.distanceKm.toLocaleString()} km away
              </span>
            </div>
            {onPlotOnMap && (
              <button
                onClick={() => onPlotOnMap(nearestEvent.coordinates, nearestEvent.place)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
              >
                Locate
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterMode('PROXIMITY')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              filterMode === 'PROXIMITY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nearest to My Location
          </button>
          <button
            onClick={() => setFilterMode('MAGNITUDE')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              filterMode === 'MAGNITUDE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Highest Magnitude
          </button>
          <button
            onClick={() => setFilterMode('RECENT')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              filterMode === 'RECENT'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Most Recent
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="hidden sm:inline">Range:</span>
          <select
            value={maxDistanceFilter}
            onChange={(e) => setMaxDistanceFilter(Number(e.target.value))}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 border border-slate-200 text-slate-700 outline-none"
          >
            <option value={0}>Worldwide (All)</option>
            <option value={1000}>Within 1,000 km</option>
            <option value={3000}>Within 3,000 km</option>
            <option value={6000}>Within 6,000 km</option>
          </select>
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="mt-4">
        {isLoading && events.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-medium">Connecting to live USGS seismic and hazard telemetry...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span>Unable to retrieve live API stream: {error}</span>
            <button
              onClick={() => fetchLiveDisasterEvents()}
              className="font-bold underline ml-2 hover:text-amber-950"
            >
              Retry
            </button>
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No disaster events recorded within the selected distance filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedEvents.map((evt) => {
              const isHigh = evt.magnitude >= 5.0;
              const isModerate = evt.magnitude >= 3.5;
              const isNearby = evt.distanceKm < 1500;

              return (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isHigh
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : isModerate
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        M {evt.magnitude}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isNearby
                          ? 'bg-purple-100 text-purple-700 font-bold'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        📍 {evt.distanceKm.toLocaleString()} km
                      </span>
                    </div>

                    {/* Place and Details */}
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 leading-snug">
                      {evt.place}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-mono">
                      <span>Depth: {evt.depthKm} km</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {timeAgo(evt.time)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    {handlePlot && (
                      <button
                        onClick={() => handlePlot(evt.coordinates, evt.place)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Plot on Map
                      </button>
                    )}

                    <a
                      href={evt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 ml-auto font-medium"
                      title="View on official USGS site"
                    >
                      <span>USGS Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
