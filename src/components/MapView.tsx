import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { 
  Incident, 
  IncidentStatus,
  Responder, 
  Shelter, 
  Coordinates, 
  DSAPathResult 
} from '../types';
import { calculateNearestHospitalWithBeds } from '../services/hospitalDistanceService';
import { MissionAccomplishedCue } from './MissionAccomplishedCue';
import { 
  Flame, 
  Waves, 
  Building, 
  Stethoscope, 
  Truck, 
  Hospital,
  Play,
  Pause,
  Clock,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Navigation,
  AlertTriangle,
  RotateCcw,
  Activity
} from 'lucide-react';

export interface MapViewProps {
  apiKey: string;
  incidents: Incident[];
  responders: Responder[];
  shelters: Shelter[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident | null) => void;
  selectedResponder: Responder | null;
  onSelectResponder: (resp: Responder | null) => void;
  activeRoute?: DSAPathResult | null;
  onCalculateRoute?: (fromNodeId: string, toNodeId: string, algorithm: 'DIJKSTRA' | 'A_STAR' | 'BELLMAN_FORD') => void;
  onQuickDispatch?: (incidentId: string) => void;
  highlightedIncidentId?: string | null;
  responderConsoleMode?: boolean;
  assignedHospital?: Shelter | null;
  onMissionAccomplished?: (incidentId: string, responderId: string) => void;
}

// Generate realistic road waypoints following clean street grid lines with congestion deflection
function generateRoadWaypoints(start: Coordinates, end: Coordinates, congestionWeight = 1.0): Coordinates[] {
  // Congestion deflection: if corridor is congested (>1.1), detour through alternate cross street
  const deflection = congestionWeight > 1.1 ? (congestionWeight - 1.0) * 0.003 : 0;
  const midLat = start.lat + (end.lat - start.lat) * 0.45 + deflection;
  const midLng = start.lng + (end.lng - start.lng) * 0.55 - deflection;

  const keyPoints: Coordinates[] = [
    { ...start },
    { lat: start.lat, lng: midLng },
    { lat: midLat, lng: midLng },
    { lat: end.lat, lng: midLng },
    { ...end }
  ];

  const points: Coordinates[] = [];
  for (let i = 0; i < keyPoints.length - 1; i++) {
    const p1 = keyPoints[i];
    const p2 = keyPoints[i + 1];
    const steps = 8;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      points.push({
        lat: p1.lat + (p2.lat - p1.lat) * t,
        lng: p1.lng + (p2.lng - p1.lng) * t,
      });
    }
  }
  points.push({ ...end });
  return points;
}

// Inner helper component to draw dynamic traffic-aware road polyline onto Google Map
const MapRouteRenderer: React.FC<{ 
  routeCoordinates: Coordinates[]; 
  fullRouteCoordinates?: Coordinates[];
  stage?: 'EN_ROUTE_TO_INCIDENT' | 'ARRIVED_ON_SCENE' | 'EVACUATING_TO_HOSPITAL' | 'RESOLVED';
  incidentStatus?: IncidentStatus;
}> = ({ routeCoordinates, fullRouteCoordinates, stage = 'EN_ROUTE_TO_INCIDENT', incidentStatus }) => {
  const map = useMap();

  useEffect(() => {
    // CRITICAL: Stop animated polyline completely once the incident status becomes 'RESOLVED' or stage is 'RESOLVED'
    if (!map || routeCoordinates.length < 2 || stage === 'RESOLVED' || incidentStatus === 'RESOLVED') {
      return;
    }

    const gmaps = (window as unknown as { google?: { maps?: any } }).google;
    if (gmaps && gmaps.maps) {
      // 1. Background ghost route line (active during mission only)
      let backgroundLine: any = null;
      if (fullRouteCoordinates && fullRouteCoordinates.length >= 2) {
        backgroundLine = new gmaps.maps.Polyline({
          path: fullRouteCoordinates,
          geodesic: true,
          strokeColor: '#64748b',
          strokeOpacity: 0.35,
          strokeWeight: 4,
        });
        backgroundLine.setMap(map);
      }

      // Color scheme based on mission leg:
      const isHospitalLeg = stage === 'EVACUATING_TO_HOSPITAL';
      const glowColor = isHospitalLeg ? '#10b981' : '#3b82f6';
      const mainColor = isHospitalLeg ? '#059669' : '#2563eb';

      // 2. Outer glowing emergency corridor
      const glowLine = new gmaps.maps.Polyline({
        path: routeCoordinates,
        geodesic: true,
        strokeColor: glowColor,
        strokeOpacity: 0.35,
        strokeWeight: 10,
      });

      // 3. Core active polyline
      const lineSymbol = {
        path: gmaps.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 2,
        strokeColor: '#ffffff',
        fillColor: '#ffffff',
        fillOpacity: 0.9,
      };

      const mainLine = new gmaps.maps.Polyline({
        path: routeCoordinates,
        geodesic: true,
        strokeColor: mainColor,
        strokeOpacity: 0.95,
        strokeWeight: 5,
        icons: [
          {
            icon: lineSymbol,
            offset: '100%',
            repeat: '140px',
          },
        ],
      });

      glowLine.setMap(map);
      mainLine.setMap(map);

      let animInterval: any = null;
      let count = 0;
      animInterval = setInterval(() => {
        count = (count + 1) % 200;
        const icons = mainLine.get('icons');
        if (icons && icons[0]) {
          icons[0].offset = `${(count / 2)}%`;
          mainLine.set('icons', icons);
        }
      }, 120);

      // Cleanup effect that clears the interval and unmounts all lines completely
      return () => {
        if (animInterval) clearInterval(animInterval);
        if (backgroundLine) backgroundLine.setMap(null);
        glowLine.setMap(null);
        mainLine.setMap(null);
      };
    }
  }, [map, routeCoordinates, fullRouteCoordinates, stage, incidentStatus]);

  return null;
};

// Traffic Layer Component
const MapTrafficLayer: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const gmaps = (window as unknown as { google?: { maps?: any } }).google;
    if (!gmaps || !gmaps.maps || !gmaps.maps.TrafficLayer) return;
    const trafficLayer = new gmaps.maps.TrafficLayer();
    if (enabled) {
      trafficLayer.setMap(map);
    }
    return () => {
      trafficLayer.setMap(null);
    };
  }, [map, enabled]);
  return null;
};

// Automatic Camera Controller: ONLY pans or fits bounds when the target incident changes!
// Does NOT jerk or continuously pan every 2 seconds during vehicle movement.
const MapCameraController: React.FC<{
  targetCoords: Coordinates | null;
  initialVehicleCoords: Coordinates | null;
  forceResetTrigger?: number;
}> = ({ targetCoords, initialVehicleCoords, forceResetTrigger }) => {
  const map = useMap();
  const lastTargetKeyRef = useRef<string>('');

  useEffect(() => {
    if (!map || !targetCoords) return;

    const currentKey = `${targetCoords.lat.toFixed(4)},${targetCoords.lng.toFixed(4)}_${forceResetTrigger || 0}`;
    if (lastTargetKeyRef.current === currentKey) return;
    lastTargetKeyRef.current = currentKey;

    const gmaps = (window as unknown as { google?: { maps?: any } }).google;
    if (gmaps && gmaps.maps) {
      if (initialVehicleCoords) {
        const bounds = new gmaps.maps.LatLngBounds();
        bounds.extend(new gmaps.maps.LatLng(targetCoords.lat, targetCoords.lng));
        bounds.extend(new gmaps.maps.LatLng(initialVehicleCoords.lat, initialVehicleCoords.lng));
        map.fitBounds(bounds, { top: 60, right: 60, bottom: 80, left: 60 });
      } else {
        map.panTo({ lat: targetCoords.lat, lng: targetCoords.lng });
        map.setZoom(14);
      }
    }
  }, [map, targetCoords, initialVehicleCoords, forceResetTrigger]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  apiKey,
  incidents,
  responders,
  shelters,
  selectedIncident,
  onSelectIncident,
  selectedResponder,
  onSelectResponder,
  highlightedIncidentId,
  responderConsoleMode = false,
  assignedHospital,
  onMissionAccomplished,
}) => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  // Congestion index tracking (1.0 = clear, >1.3 = congested, adjusted dynamically)
  const [congestionIndex, setCongestionIndex] = useState<number>(1.05);

  // Mission accomplished celebratory cue
  const [showTaskCompleteModal, setShowTaskCompleteModal] = useState<boolean>(false);
  const [completedMissionData, setCompletedMissionData] = useState<{
    incident: Incident;
    responder?: Responder | null;
    hospital?: Shelter | null;
  } | null>(null);

  const defaultCenter = useMemo(() => {
    if (selectedIncident) return selectedIncident.coordinates;
    if (userLocation) return userLocation;
    if (incidents.length > 0) return incidents[0].coordinates;
    return { lat: 11.0168, lng: 76.9558 }; // Coimbatore Center
  }, [userLocation, selectedIncident, incidents]);

  // Active Mission & Road Route States
  const [missionRoute, setMissionRoute] = useState<Coordinates[]>([]);
  const [isSimulatingMovement, setIsSimulatingMovement] = useState(false);
  const [vehicleProgressPct, setVehicleProgressPct] = useState(0);
  const [liveVehicleCoords, setLiveVehicleCoords] = useState<Coordinates | null>(null);
  const [cameraResetCount, setCameraResetCount] = useState(0);
  
  const [activeDispatchMission, setActiveDispatchMission] = useState<{
    incident: Incident;
    responder: Responder;
    hospital: Shelter;
    stage: 'EN_ROUTE_TO_INCIDENT' | 'ARRIVED_ON_SCENE' | 'EVACUATING_TO_HOSPITAL' | 'RESOLVED';
    etaSeconds: number;
    distanceKm: number;
  } | null>(null);

  // Layer Visibility Toggles (only for full map mode)
  const [showHotspots, setShowHotspots] = useState(true);
  const [showResponders, setShowResponders] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);

  // Helper to calculate Google Maps or fallback route between 2 points with congestion awareness
  const calculateRouteWaypoints = useCallback((
    start: Coordinates, 
    end: Coordinates, 
    onReady: (points: Coordinates[]) => void,
    weight = 1.0
  ) => {
    const fallback = generateRoadWaypoints(start, end, weight);
    const gmaps = (window as unknown as { google?: { maps?: any } }).google?.maps;
    if (gmaps && gmaps.DirectionsService) {
      try {
        const ds = new gmaps.DirectionsService();
        ds.route(
          {
            origin: new gmaps.LatLng(start.lat, start.lng),
            destination: new gmaps.LatLng(end.lat, end.lng),
            travelMode: gmaps.TravelMode.DRIVING,
          },
          (result: any, status: string) => {
            if (status === 'OK' && result?.routes?.[0]?.overview_path) {
              const realCoords = result.routes[0].overview_path.map((p: any) => ({
                lat: p.lat(),
                lng: p.lng(),
              }));
              onReady(realCoords);
            } else {
              onReady(fallback);
            }
          }
        );
      } catch {
        onReady(fallback);
      }
    } else {
      onReady(fallback);
    }
  }, []);

  // Acquire user device GPS (only in non-console mode)
  useEffect(() => {
    if (responderConsoleMode) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setUserLocation({ lat: 11.0168, lng: 76.9558 });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [responderConsoleMode]);

  // Track mission and completion states so the simulation never loops endlessly
  const activeMissionIncidentIdRef = useRef<string | null>(null);
  const completedMissionsRef = useRef<Set<string>>(new Set());

  // Set up live vehicle route ONLY when an active, non-resolved incident is targeted
  // BUGFIX: Does NOT fallback to incidents[0] if no incident is selected!
  useEffect(() => {
    const target = selectedIncident || (highlightedIncidentId ? incidents.find((i) => i.id === highlightedIncidentId) : null);
    
    // CRITICAL: If no incident is selected or if the incident is RESOLVED, stop all movement!
    if (!target) {
      setIsSimulatingMovement(false);
      setActiveDispatchMission(null);
      setMissionRoute([]);
      setLiveVehicleCoords(null);
      activeMissionIncidentIdRef.current = null;
      return;
    }

    // If resolved, ensure simulation is completely stopped and route polylines are cleared
    if (target.status === 'RESOLVED') {
      setIsSimulatingMovement(false);
      setMissionRoute([]);
      activeMissionIncidentIdRef.current = target.id;
      if (activeDispatchMission && activeDispatchMission.stage !== 'RESOLVED') {
        setActiveDispatchMission((m) => m ? {
          ...m,
          stage: 'RESOLVED',
          etaSeconds: 0,
          distanceKm: 0,
          responder: {
            ...m.responder,
            status: 'AVAILABLE',
            assignedIncidentId: undefined,
          },
        } : null);
      }
      return;
    }

    // If this incident is already currently running or completed, don't duplicate
    if (
      activeMissionIncidentIdRef.current === target.id ||
      completedMissionsRef.current.has(target.id)
    ) {
      return;
    }

    // Pick assigned responder or available responder
    const responder = selectedResponder || 
      responders.find((r) => r.id === target.assignedResponderId) || 
      responders.find((r) => r.status === 'AVAILABLE') || 
      responders[0];

    activeMissionIncidentIdRef.current = target.id;

    // Starting position ~2km from incident or responder's actual position
    const startPos: Coordinates = (responder?.currentCoordinates && (Math.abs(responder.currentCoordinates.lat - target.coordinates.lat) < 0.15))
      ? responder.currentCoordinates
      : {
          lat: target.coordinates.lat + 0.018,
          lng: target.coordinates.lng - 0.015,
        };

    const targetPos = target.coordinates;

    // Calculate nearest hospital with verified beds
    calculateNearestHospitalWithBeds(targetPos, shelters).then((hospResult) => {
      const nearestHospital = assignedHospital || hospResult.nearest?.hospital || shelters[0];
      const verifiedDistKm = hospResult.nearest?.distanceKm || 2.4;

      calculateRouteWaypoints(startPos, targetPos, (points) => {
        setMissionRoute(points);
        setLiveVehicleCoords(startPos);
        setVehicleProgressPct(0);

        // Only start moving if assigned or responding
        const shouldSimulate = target.status === 'ASSIGNED' || target.status === 'RESPONDING';
        setIsSimulatingMovement(shouldSimulate);

        setActiveDispatchMission({
          incident: target,
          responder: responder || responders[0],
          hospital: nearestHospital,
          stage: 'EN_ROUTE_TO_INCIDENT',
          etaSeconds: Math.round(verifiedDistKm * 60),
          distanceKm: verifiedDistKm,
        });
        setCameraResetCount((c) => c + 1);
      }, congestionIndex);
    });
  }, [selectedIncident, highlightedIncidentId, selectedResponder, shelters, assignedHospital, calculateRouteWaypoints, congestionIndex, responders, incidents]);

  // Compute remaining active polyline between vehicle's current location and destination
  const remainingRoute = useMemo(() => {
    if (!liveVehicleCoords || missionRoute.length < 2 || selectedIncident?.status === 'RESOLVED' || activeDispatchMission?.stage === 'RESOLVED') {
      return [];
    }
    const totalSegments = missionRoute.length - 1;
    const exactIndex = Math.min(totalSegments, Math.floor((vehicleProgressPct / 100) * totalSegments));
    const slice = missionRoute.slice(exactIndex + 1);
    return [liveVehicleCoords, ...slice];
  }, [liveVehicleCoords, missionRoute, vehicleProgressPct, selectedIncident?.status, activeDispatchMission?.stage]);

  // REAL-TIME CONGESTION UPDATE LOOP: Re-calculates route every 5 seconds to account for traffic fluctuations
  // Strictly stops when mission is resolved or incident is resolved
  useEffect(() => {
    if (!isSimulatingMovement || !liveVehicleCoords || !activeDispatchMission) return;
    if (activeDispatchMission.stage === 'RESOLVED' || activeDispatchMission.stage === 'ARRIVED_ON_SCENE' || selectedIncident?.status === 'RESOLVED') return;

    const destination = activeDispatchMission.stage === 'EVACUATING_TO_HOSPITAL'
      ? activeDispatchMission.hospital.coordinates
      : activeDispatchMission.incident.coordinates;

    const interval = setInterval(() => {
      // Immediate cancellation if status or stage transitioned to RESOLVED
      if (activeDispatchMission.stage === 'RESOLVED' || selectedIncident?.status === 'RESOLVED') {
        clearInterval(interval);
        return;
      }

      // Fluctuate congestion weight (1.02 to 1.45) every 5 seconds to simulate dynamic road conditions
      const dynamicWeight = +(1.05 + Math.abs(Math.sin(Date.now() / 8000)) * 0.4).toFixed(2);
      setCongestionIndex(dynamicWeight);

      calculateRouteWaypoints(liveVehicleCoords, destination, (updatedRoute) => {
        if (updatedRoute && updatedRoute.length >= 2 && selectedIncident?.status !== 'RESOLVED' && activeDispatchMission.stage !== 'RESOLVED') {
          setMissionRoute(updatedRoute);
        }
      }, dynamicWeight);
    }, 5000);

    return () => clearInterval(interval);
  }, [isSimulatingMovement, liveVehicleCoords, activeDispatchMission, selectedIncident?.status, calculateRouteWaypoints]);

  // Real-time vehicle movement simulation updating smoothly
  useEffect(() => {
    if (!isSimulatingMovement || missionRoute.length < 2 || selectedIncident?.status === 'RESOLVED' || activeDispatchMission?.stage === 'RESOLVED') return;

    const coords = missionRoute;
    const totalSegments = coords.length - 1;

    const interval = setInterval(() => {
      setVehicleProgressPct((prev) => {
        const step = 100 / 12; // 12 steps per leg for steady realistic pace
        const next = prev + step;

        if (next >= 100) {
          const finalCoord = coords[coords.length - 1];
          setLiveVehicleCoords(finalCoord);

          setActiveDispatchMission((currentMission) => {
            if (!currentMission) return null;

            if (currentMission.stage === 'EN_ROUTE_TO_INCIDENT') {
              // 1. Reached incident scene!
              setIsSimulatingMovement(false);

              // 2. Triage pause (2.5s), then evacuate to nearest hospital
              setTimeout(() => {
                const incCoords = currentMission.incident.coordinates;
                calculateNearestHospitalWithBeds(incCoords, shelters).then((hospResult) => {
                  const chosenHospital = assignedHospital || hospResult.nearest?.hospital || currentMission.hospital;
                  const distKm = hospResult.nearest?.distanceKm || 2.4;

                  calculateRouteWaypoints(incCoords, chosenHospital.coordinates, (hospitalRoute) => {
                    setMissionRoute(hospitalRoute);
                    setLiveVehicleCoords(incCoords);
                    setVehicleProgressPct(0);
                    setIsSimulatingMovement(true);

                    setActiveDispatchMission((m) => m ? {
                      ...m,
                      hospital: chosenHospital,
                      stage: 'EVACUATING_TO_HOSPITAL',
                      etaSeconds: Math.round(distKm * 55),
                      distanceKm: distKm,
                    } : null);
                  }, congestionIndex);
                });
              }, 2500);

              return {
                ...currentMission,
                stage: 'ARRIVED_ON_SCENE',
                etaSeconds: 0,
                distanceKm: 0,
              };

            } else if (currentMission.stage === 'EVACUATING_TO_HOSPITAL') {
              // Reached hospital! Patient safely admitted.
              // Clear interval immediately, snap vehicle to hospital coords, and empty route to prevent ghost lines:
              clearInterval(interval);
              setIsSimulatingMovement(false);
              setLiveVehicleCoords(currentMission.hospital.coordinates);
              setMissionRoute([]); // Zero residual ghost lines!

              if (activeMissionIncidentIdRef.current) {
                completedMissionsRef.current.add(activeMissionIncidentIdRef.current);
              }

              // Trigger final 'Mission Accomplished' cue & immediate status cleanup to AVAILABLE
              setCompletedMissionData({
                incident: currentMission.incident,
                responder: {
                  ...currentMission.responder,
                  status: 'AVAILABLE',
                  assignedIncidentId: undefined,
                },
                hospital: currentMission.hospital,
              });
              setShowTaskCompleteModal(true);

              if (onMissionAccomplished) {
                onMissionAccomplished(currentMission.incident.id, currentMission.responder.id);
              }

              return {
                ...currentMission,
                stage: 'RESOLVED',
                etaSeconds: 0,
                distanceKm: 0,
                responder: {
                  ...currentMission.responder,
                  status: 'AVAILABLE',
                  assignedIncidentId: undefined,
                },
              };
            }

            return currentMission;
          });

          return 100;
        }

        // Interpolate along path
        const exactIndex = (next / 100) * totalSegments;
        const baseIndex = Math.floor(exactIndex);
        const fraction = exactIndex - baseIndex;
        
        const p1 = coords[baseIndex];
        const p2 = coords[Math.min(baseIndex + 1, totalSegments)];

        const currentLat = p1.lat + (p2.lat - p1.lat) * fraction;
        const currentLng = p1.lng + (p2.lng - p1.lng) * fraction;

        setLiveVehicleCoords({ lat: currentLat, lng: currentLng });

        // Update ETA and remaining distance smoothly
        setActiveDispatchMission((m) => {
          if (!m) return null;
          const remainingPct = Math.max(0, 1 - next / 100);
          const baseEta = m.stage === 'EVACUATING_TO_HOSPITAL' ? 140 : 160;
          const baseDist = m.distanceKm || 2.4;
          return {
            ...m,
            etaSeconds: Math.round(remainingPct * baseEta),
            distanceKm: +(remainingPct * baseDist).toFixed(1),
          };
        });

        return next;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isSimulatingMovement, missionRoute, shelters, assignedHospital, calculateRouteWaypoints, congestionIndex, onMissionAccomplished, selectedIncident?.status, activeDispatchMission?.stage]);

  // Replay vehicle animation manually if desired
  const handleReplayDispatch = () => {
    const target = selectedIncident;
    if (!target) return;

    if (activeMissionIncidentIdRef.current) {
      completedMissionsRef.current.delete(activeMissionIncidentIdRef.current);
    }
    completedMissionsRef.current.delete(target.id);
    activeMissionIncidentIdRef.current = target.id;

    const responder = selectedResponder || responders.find((r) => r.status === 'AVAILABLE') || responders[0];
    const startPos = {
      lat: target.coordinates.lat + 0.018,
      lng: target.coordinates.lng - 0.015,
    };

    calculateNearestHospitalWithBeds(target.coordinates, shelters).then((hospResult) => {
      const hosp = assignedHospital || hospResult.nearest?.hospital || shelters[0];
      const dist = hospResult.nearest?.distanceKm || 2.4;

      calculateRouteWaypoints(startPos, target.coordinates, (points) => {
        setMissionRoute(points);
        setVehicleProgressPct(0);
        setLiveVehicleCoords(startPos);
        setIsSimulatingMovement(true);
        setActiveDispatchMission({
          incident: target,
          responder,
          hospital: hosp,
          stage: 'EN_ROUTE_TO_INCIDENT',
          etaSeconds: 160,
          distanceKm: dist,
        });
        setCameraResetCount((c) => c + 1);
      }, congestionIndex);
    });
  };

  // Designated hospital: if in console mode, only show the nearest allocated hospital!
  const designatedHospital = useMemo(() => {
    if (assignedHospital) return assignedHospital;
    if (activeDispatchMission?.hospital) return activeDispatchMission.hospital;
    return shelters[0] || null;
  }, [assignedHospital, activeDispatchMission?.hospital, shelters]);

  // Active responder vehicle position
  const activeVehiclePosition = liveVehicleCoords || selectedResponder?.currentCoordinates || responders[0]?.currentCoordinates;

  return (
    <div className={`relative w-full overflow-hidden bg-slate-100 ${
      responderConsoleMode 
        ? 'h-[360px] rounded-2xl border border-slate-700/80 shadow-inner' 
        : 'h-[calc(100vh-4rem)] flex flex-col'
    }`}>
      
      {/* Top Floating Layer Controls (Only in Full Map Mode, REMOVED in ResponderConsoleMode) */}
      {!responderConsoleMode && (
        <div className="absolute top-4 right-4 z-20 pointer-events-none flex items-center gap-2">
          <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-1 pointer-events-auto shadow-md border-white/80 bg-white/95">
            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                showHotspots ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Hotspots ({incidents.length})
            </button>
            <button
              onClick={() => setShowResponders(!showResponders)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                showResponders ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Vehicles ({responders.length})
            </button>
            <button
              onClick={() => setShowShelters(!showShelters)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                showShelters ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Hospitals ({shelters.length})
            </button>
            <button
              onClick={() => setShowTraffic(!showTraffic)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                showTraffic ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Traffic (Live)
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Congestion & Traffic Sync Indicator */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <div className="px-2.5 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md text-white border border-slate-700/80 shadow-lg text-[10px] font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Dynamic Pathing (5s Sync):</span>
          <span className="text-emerald-400 font-mono">
            {congestionIndex <= 1.15 ? 'Optimal (Non-Blocked)' : `Congestion Weight ${congestionIndex}x (Evasive)`}
          </span>
        </div>
      </div>

      {/* Main Google Maps Viewport */}
      <div className="w-full h-full">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={responderConsoleMode ? 13 : 14}
            gestureHandling="greedy"
            mapId="AEGIS_DISASTER_OPS_MAP"
            disableDefaultUI={responderConsoleMode}
            zoomControl={!responderConsoleMode}
            className="w-full h-full"
          >
            {/* Live Traffic Overlay (Enabled only in full map mode) */}
            {!responderConsoleMode && <MapTrafficLayer enabled={showTraffic} />}

            {/* Camera controller that only moves when target incident changes */}
            <MapCameraController
              targetCoords={
                activeDispatchMission?.stage === 'EVACUATING_TO_HOSPITAL'
                  ? activeDispatchMission.hospital.coordinates
                  : selectedIncident?.coordinates || null
              }
              initialVehicleCoords={activeVehiclePosition || null}
              forceResetTrigger={cameraResetCount}
            />

            {/* Animated polyline between responder's current location and the incident/hospital */}
            {selectedIncident && selectedIncident.status !== 'RESOLVED' && activeDispatchMission?.stage !== 'RESOLVED' && (
              <MapRouteRenderer 
                routeCoordinates={remainingRoute} 
                fullRouteCoordinates={missionRoute} 
                stage={activeDispatchMission?.stage}
                incidentStatus={selectedIncident.status}
              />
            )}

            {/* User Real GPS Location Marker (REMOVED in responderConsoleMode) */}
            {!responderConsoleMode && userLocation && (
              <AdvancedMarker position={userLocation} title="Your Real GPS Location">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-8 h-8 rounded-full bg-indigo-500/30 animate-ping"></div>
                  <div className="w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-lg"></div>
                </div>
              </AdvancedMarker>
            )}

            {/* =================================================================== */}
            {/* 1. VEHICLE POSITION (State-driven coordinate tracking)             */}
            {/* =================================================================== */}
            {activeVehiclePosition && (
              <AdvancedMarker position={activeVehiclePosition} title="Dispatched Emergency Unit">
                <div className="relative flex flex-col items-center">
                  <div className="absolute -top-7 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold shadow-md whitespace-nowrap flex items-center gap-1.5 border border-indigo-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span>
                      {activeDispatchMission?.stage === 'EVACUATING_TO_HOSPITAL'
                        ? `EVACUATING • ${Math.round(vehicleProgressPct)}%`
                        : activeDispatchMission?.stage === 'ARRIVED_ON_SCENE'
                        ? 'ON SCENE (TRIAGE)'
                        : activeDispatchMission?.stage === 'RESOLVED'
                        ? 'STANDBY • AT HOSPITAL'
                        : isSimulatingMovement
                        ? `EN ROUTE • ${Math.round(vehicleProgressPct)}%`
                        : 'STANDBY (READY)'}
                    </span>
                  </div>
                  <div className={`w-9 h-9 rounded-2xl text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ${
                    activeDispatchMission?.stage === 'EVACUATING_TO_HOSPITAL'
                      ? 'bg-emerald-600 ring-emerald-400/50 animate-pulse'
                      : isSimulatingMovement
                      ? 'bg-indigo-600 ring-indigo-400/40 animate-pulse'
                      : 'bg-slate-800 ring-slate-600/30'
                  }`}>
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* =================================================================== */}
            {/* 2. TARGET INCIDENT MARKER (Kept cleanly)                           */}
            {/* =================================================================== */}
            {selectedIncident && (
              <AdvancedMarker
                position={selectedIncident.coordinates}
                onClick={() => !responderConsoleMode && onSelectIncident(selectedIncident)}
                title={selectedIncident.title}
              >
                <div className="relative flex flex-col items-center">
                  <div className="absolute -top-6 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold uppercase shadow-sm border border-white whitespace-nowrap">
                    Target Scene
                  </div>
                  <div className="p-2.5 rounded-2xl shadow-2xl border-2 border-white bg-rose-600 text-white ring-4 ring-rose-400/50 flex items-center justify-center">
                    {selectedIncident.type === 'FIRE' ? <Flame className="w-4 h-4" /> :
                     selectedIncident.type === 'FLOOD' ? <Waves className="w-4 h-4" /> :
                     selectedIncident.type === 'MEDICAL' ? <Stethoscope className="w-4 h-4" /> :
                     <Building className="w-4 h-4" />}
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* Hotspots for unselected incidents: ONLY rendered if NOT in responderConsoleMode */}
            {!responderConsoleMode && showHotspots && incidents.filter((i) => i.id !== selectedIncident?.id).map((inc) => {
              const isResolved = inc.status === 'RESOLVED';
              return (
                <AdvancedMarker
                  key={inc.id}
                  position={inc.coordinates}
                  onClick={() => {
                    onSelectIncident(inc);
                    setSelectedShelter(null);
                  }}
                  title={inc.title}
                >
                  <div className={`p-2 rounded-2xl shadow-xl border-2 transition-all cursor-pointer flex items-center justify-center ${
                    isResolved
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-rose-600 border-rose-200 hover:scale-110'
                  }`}>
                    {inc.type === 'FIRE' ? <Flame className="w-3.5 h-3.5" /> :
                     inc.type === 'FLOOD' ? <Waves className="w-3.5 h-3.5" /> :
                     inc.type === 'MEDICAL' ? <Stethoscope className="w-3.5 h-3.5" /> :
                     <Building className="w-3.5 h-3.5" />}
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Other responders: ONLY rendered if NOT in responderConsoleMode */}
            {!responderConsoleMode && showResponders && responders.filter((r) => r.id !== selectedResponder?.id).map((resp) => {
              const isAssigned = resp.status === 'BUSY';
              return (
                <AdvancedMarker
                  key={resp.id}
                  position={resp.currentCoordinates}
                  onClick={() => onSelectResponder(resp)}
                  title={resp.name}
                >
                  <div className={`p-1.5 rounded-xl shadow-md border transition-all cursor-pointer ${
                    isAssigned
                      ? 'bg-amber-500 text-white border-amber-300'
                      : 'bg-indigo-600 text-white border-indigo-300 hover:scale-105'
                  }`}>
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* =================================================================== */}
            {/* 3. NEAREST HOSPITAL WITH AVAILABLE CAPACITY MARKER                  */}
            {/* =================================================================== */}
            {designatedHospital && (
              <AdvancedMarker
                position={designatedHospital.coordinates}
                onClick={() => setSelectedShelter(designatedHospital)}
                title={designatedHospital.name}
              >
                <div className="relative flex flex-col items-center">
                  <div className="absolute -top-6 px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[9px] font-bold uppercase shadow-sm border border-white whitespace-nowrap">
                    {designatedHospital.capacityTotal - designatedHospital.capacityCurrent} Beds Free
                  </div>
                  <div className="p-2 rounded-2xl bg-emerald-600 text-white border-2 border-white shadow-xl ring-4 ring-emerald-400/40 cursor-pointer flex items-center justify-center">
                    <Hospital className="w-4 h-4" />
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* Other shelters: ONLY rendered if NOT in responderConsoleMode */}
            {!responderConsoleMode && showShelters && shelters.filter((s) => s.id !== designatedHospital?.id).map((sh) => (
              <AdvancedMarker
                key={sh.id}
                position={sh.coordinates}
                onClick={() => setSelectedShelter(sh)}
                title={sh.name}
              >
                <div className="p-1.5 rounded-xl bg-emerald-600 text-white border border-emerald-300 shadow-md cursor-pointer hover:scale-110 transition">
                  <Hospital className="w-3.5 h-3.5" />
                </div>
              </AdvancedMarker>
            ))}

            {/* Incident Details InfoWindow (Full Map Mode only) */}
            {!responderConsoleMode && selectedIncident && (
              <InfoWindow
                position={selectedIncident.coordinates}
                onCloseClick={() => onSelectIncident(null)}
              >
                <div className="p-3 max-w-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      {selectedIncident.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {selectedIncident.casualties} Casualties
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {selectedIncident.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {selectedIncident.description}
                  </p>

                  <div className="text-[11px] text-slate-500">
                    📍 {selectedIncident.locationName}
                  </div>

                  {selectedIncident.photoUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 mt-1">
                      <img src={selectedIncident.photoUrl} alt="Disaster Evidence" className="w-full h-24 object-cover" />
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={handleReplayDispatch}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Replay Vehicle Dispatch</span>
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}

            {/* Shelter / Hospital InfoWindow */}
            {selectedShelter && (
              <InfoWindow
                position={selectedShelter.coordinates}
                onCloseClick={() => setSelectedShelter(null)}
              >
                <div className="p-3 max-w-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Hospital className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800 uppercase">
                      Emergency Trauma Center
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedShelter.name}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Capacity: {selectedShelter.capacityCurrent} / {selectedShelter.capacityTotal} Beds
                  </p>
                  <div className="text-[11px] text-slate-500">
                    Trauma Team on Standby • Helpline: {selectedShelter.contactPhone}
                  </div>
                </div>
              </InfoWindow>
            )}

          </Map>
        </APIProvider>
      </div>

      {/* LIVE DISPATCHED VEHICLE APPROACHING HUD / MISSION COMPLETE SUMMARY CARD */}
      {activeDispatchMission && (
        <div className={`absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex justify-center`}>
          {activeDispatchMission.stage === 'RESOLVED' ? (
            /* Dedicated Mission Complete Summary Card */
            <div className="glass-panel p-4 rounded-3xl max-w-3xl w-full pointer-events-auto shadow-2xl border border-emerald-300/80 bg-white/95 backdrop-blur-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                        Mission Complete
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Hospital Handover Verified
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mt-0.5">
                      Emergency Handover Successful — Casualties Admitted
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={handleReplayDispatch}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                    title="Replay Response Simulation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay</span>
                  </button>
                  <button
                    onClick={() => setActiveDispatchMission(null)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Vehicle Status
                  </span>
                  <div className="font-bold text-slate-900 truncate mt-0.5">
                    {activeDispatchMission.responder.name} ({activeDispatchMission.responder.plateNumber})
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>STATUS: AVAILABLE (Standby)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-teal-50/70 border border-teal-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Receiving Center
                  </span>
                  <div className="font-bold text-slate-900 truncate mt-0.5">
                    {activeDispatchMission.hospital.name}
                  </div>
                  <div className="text-[10px] font-mono text-teal-700 mt-0.5">
                    Trauma Bay Intact • Bed Deducted
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Telemetry
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {activeDispatchMission.distanceKm || 2.4} km Transit Completed
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Zero Ghost Artifacts • Route Cleared
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-3 rounded-2xl max-w-3xl w-full pointer-events-auto shadow-xl border-white/90 bg-white/95 flex flex-col sm:flex-row items-center justify-between gap-3">
              
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md shrink-0 ${
                  activeDispatchMission.stage === 'EVACUATING_TO_HOSPITAL'
                    ? 'bg-emerald-600'
                    : activeDispatchMission.stage === 'ARRIVED_ON_SCENE'
                    ? 'bg-amber-600'
                    : 'bg-indigo-600'
                }`}>
                  {activeDispatchMission.stage === 'EVACUATING_TO_HOSPITAL' ? (
                    <Hospital className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Truck className="w-5 h-5 animate-pulse" />
                  )}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {activeDispatchMission.responder.name}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      activeDispatchMission.stage === 'EVACUATING_TO_HOSPITAL'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeDispatchMission.stage === 'ARRIVED_ON_SCENE'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {activeDispatchMission.stage === 'EVACUATING_TO_HOSPITAL'
                        ? 'Evacuating to Hospital'
                        : activeDispatchMission.stage === 'ARRIVED_ON_SCENE'
                        ? 'On Scene'
                        : 'En Route'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    Receiving Center: <strong className="text-emerald-700">{activeDispatchMission.hospital.name}</strong>
                  </p>
                </div>
              </div>

              {/* Live Progress, ETA & Controls */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="w-28">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-0.5">
                    <span>Progress</span>
                    <span>{Math.round(vehicleProgressPct)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-200 ${
                        activeDispatchMission.stage === 'EVACUATING_TO_HOSPITAL'
                          ? 'bg-emerald-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${vehicleProgressPct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">ETA</span>
                  <span className="text-xs font-black text-emerald-600 font-mono">
                    {activeDispatchMission.etaSeconds > 0 
                      ? `${Math.floor(activeDispatchMission.etaSeconds / 60)}m ${activeDispatchMission.etaSeconds % 60}s`
                      : 'Arrived'}
                  </span>
                </div>

                {/* Pause / Resume Controls */}
                <button
                  onClick={() => setIsSimulatingMovement(!isSimulatingMovement)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title={isSimulatingMovement ? 'Pause' : 'Resume'}
                >
                  {isSimulatingMovement ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleReplayDispatch}
                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                  title="Restart Vehicle Animation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* MISSION ACCOMPLISHED TASK COMPLETE MODAL */}
      {showTaskCompleteModal && completedMissionData && (
        <MissionAccomplishedCue
          incident={completedMissionData.incident}
          responder={completedMissionData.responder}
          hospital={completedMissionData.hospital}
          onDismiss={() => setShowTaskCompleteModal(false)}
        />
      )}

    </div>
  );
};
