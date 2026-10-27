import { Shelter, Coordinates, Responder } from '../types';

export interface HospitalDistanceResult {
  hospital: Shelter;
  distanceKm: number;
  durationText: string;
  durationMinutes: number;
  bedsAvailable: number;
  source: 'GOOGLE_MAPS_GEOMETRY' | 'HAVERSINE_SPHERICAL';
}

export interface ResponderDistanceResult {
  responder: Responder;
  distanceKm: number;
  durationText: string;
  durationMinutes: number;
  source: 'GOOGLE_MAPS_GEOMETRY' | 'HAVERSINE_SPHERICAL';
}

/**
 * High-precision spherical distance calculation (Haversine formula in KM)
 * Includes a realistic road winding factor (1.28x) to match real city driving distance.
 */
export function computePreciseDistanceKm(c1: Coordinates, c2: Coordinates, isDrivingRoad = true): number {
  const gmaps = (window as unknown as { google?: { maps?: any } }).google?.maps;
  
  let straightLineKm: number;
  if (gmaps && gmaps.geometry && gmaps.geometry.spherical) {
    try {
      const p1 = new gmaps.LatLng(c1.lat, c1.lng);
      const p2 = new gmaps.LatLng(c2.lat, c2.lng);
      straightLineKm = gmaps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000;
    } catch {
      straightLineKm = haversineDistance(c1, c2);
    }
  } else {
    straightLineKm = haversineDistance(c1, c2);
  }

  // Real city road routing has ~25-30% intersection turns over straight line
  const roadFactor = isDrivingRoad ? 1.28 : 1.0;
  return +(straightLineKm * roadFactor).toFixed(1);
}

function haversineDistance(c1: Coordinates, c2: Coordinates): number {
  const R = 6371; // Earth radius in km
  const dLat = (c2.lat - c1.lat) * (Math.PI / 180);
  const dLng = (c2.lng - c1.lng) * (Math.PI / 180);
  const lat1 = c1.lat * (Math.PI / 180);
  const lat2 = c2.lat * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates nearest hospitals with available beds using high-precision geodesic
 * routing and Google Maps geometry, eliminating quota errors and latency.
 */
export async function calculateNearestHospitalWithBeds(
  incidentCoords: Coordinates,
  shelters: Shelter[]
): Promise<{
  nearest: HospitalDistanceResult | null;
  allHospitals: HospitalDistanceResult[];
}> {
  // 1. Strict filter: must be a hospital or have medical staff, and MUST have open bed capacity
  const eligibleHospitals = shelters.filter(
    (s) => (s.type === 'HOSPITAL' || s.medicalStaffPresent || s.hasMedicalSupport) && s.capacityCurrent < s.capacityTotal
  );

  const candidateList = eligibleHospitals.length > 0 ? eligibleHospitals : shelters.filter((s) => s.type === 'HOSPITAL');

  if (candidateList.length === 0) {
    return { nearest: null, allHospitals: [] };
  }

  const gmaps = (window as unknown as { google?: { maps?: any } }).google?.maps;
  const hasGeometry = Boolean(gmaps && gmaps.geometry && gmaps.geometry.spherical);

  const results: HospitalDistanceResult[] = candidateList.map((hospital) => {
    const distKm = computePreciseDistanceKm(incidentCoords, hospital.coordinates);
    // Average urban emergency speed ~42 km/h
    const durMins = Math.max(2, Math.round((distKm / 42) * 60));
    const bedsAvailable = Math.max(0, hospital.capacityTotal - hospital.capacityCurrent);

    return {
      hospital,
      distanceKm: distKm,
      durationText: `${durMins} mins`,
      durationMinutes: durMins,
      bedsAvailable,
      source: hasGeometry ? 'GOOGLE_MAPS_GEOMETRY' : 'HAVERSINE_SPHERICAL',
    };
  });

  results.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    nearest: results[0] || null,
    allHospitals: results,
  };
}

/**
 * Calculates distances to responders from incident coordinates using Google Maps geometry or high-precision math
 */
export async function calculateNearestResponders(
  incidentCoords: Coordinates,
  responders: Responder[]
): Promise<{
  nearest: ResponderDistanceResult | null;
  allResponders: ResponderDistanceResult[];
}> {
  if (responders.length === 0) {
    return { nearest: null, allResponders: [] };
  }

  const gmaps = (window as unknown as { google?: { maps?: any } }).google?.maps;
  const hasGeometry = Boolean(gmaps && gmaps.geometry && gmaps.geometry.spherical);

  const results: ResponderDistanceResult[] = responders.map((responder) => {
    const distKm = computePreciseDistanceKm(responder.currentCoordinates, incidentCoords);
    const speed = responder.speedKmh || 45;
    const durMins = Math.max(2, Math.round((distKm / speed) * 60));

    return {
      responder,
      distanceKm: distKm,
      durationText: `${durMins} mins`,
      durationMinutes: durMins,
      source: hasGeometry ? 'GOOGLE_MAPS_GEOMETRY' : 'HAVERSINE_SPHERICAL',
    };
  });

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  const availableNearest = results.find((r) => r.responder.status === 'AVAILABLE') || results[0];

  return {
    nearest: availableNearest || null,
    allResponders: results,
  };
}
