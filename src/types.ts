export type SeverityLevel = 'CRITICAL' | 'SEVERE' | 'MODERATE' | 'WATCH' | 'ADVISORY' | 'HIGH' | 'EXTREME' | 'LOW';

export type DisasterType = 
  | 'EARTHQUAKE' 
  | 'FLOOD' 
  | 'WILDFIRE' 
  | 'CYCLONE' 
  | 'CHEMICAL_LEAK' 
  | 'BUILDING_COLLAPSE' 
  | 'LANDSLIDE' 
  | 'TSUNAMI'
  | 'FIRE'
  | 'MEDICAL'
  | 'TRANSIT_ACCIDENT'
  | 'INDUSTRIAL_HAZARD'
  | 'BLACKOUT';

export type IncidentType = DisasterType;

export type ResponderType = 
  | 'AMBULANCE' 
  | 'FIRE_ENGINE' 
  | 'NDRF_SAR' 
  | 'HAZMAT' 
  | 'RESCUE_BOAT' 
  | 'AIR_AMBULANCE' 
  | 'DRONE_RECON' 
  | 'POLICE_ESCORT';

export type ResponderStatus = 'AVAILABLE' | 'DISPATCHED' | 'ON_SCENE' | 'RETURNING' | 'MAINTENANCE' | 'BUSY';

export type IncidentStatus = 'REPORTED' | 'ASSESSED' | 'ASSIGNED' | 'RESPONDING' | 'RESOLVED' | 'ACTIVE' | 'CONTAINED' | 'VERIFIED';

export type UserRole = 'COMMANDER' | 'RESPONDER' | 'CITIZEN' | 'STUDENT';

export type MainTabType = 
  | 'home' 
  | 'map' 
  | 'dispatch' 
  | 'report' 
  | 'resources' 
  | 'weather' 
  | 'analytics' 
  | 'network' 
  | 'simulation' 
  | 'dsa'
  | 'responderConsole'
  | 'hospitalStatus';

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DecisionStep {
  stepNumber: number;
  phase: string;
  factor: string;
  weightPct: number;
  explanation: string;
  algorithmUsed: string;
}

export interface DecisionExplanation {
  id?: string;
  targetId: string;
  targetTitle: string;
  category?: 'URGENCY_ESTIMATION' | 'DISPATCH_ROUTING' | 'RESOURCE_KNAPSACK' | 'SEVERED_ZONE_ISOLATION' | 'EARTHQUAKE_TSUNAMI_RISK';
  decisionType?: string;
  summary: string;
  confidenceScore: number; // 0 - 100
  inputs: Record<string, string | number>;
  steps: DecisionStep[];
  humanSafeguardNote?: string;
}

export interface CitizenReport {
  id: string;
  timestamp: string;
  incidentType: DisasterType;
  description: string;
  locationName: string;
  coordinates: Coordinates;
  photoUrl?: string;
  estimatedUrgency: UrgencyLevel;
  confidenceScore: number;
  reasoning: string;
  isOfflineQueued?: boolean;
  status: 'REPORTED' | 'ASSESSED' | 'ASSIGNED' | 'RESPONDING' | 'RESOLVED';
  decisionExplanation?: DecisionExplanation;
}

export interface WeatherTelemetry {
  city: string;
  temperatureC: number;
  condition: string;
  windSpeedKmh: number;
  windDirection: string;
  barometricPressureHpa: number;
  humidityPct: number;
  precipitationRateMmHr: number;
  stormAlertStatus: 'CLEAR' | 'WATCH' | 'WARNING' | 'EXTREME';
}

export interface EnvironmentalSensorFeed {
  id: string;
  name: string;
  type: 'SEISMIC' | 'RIVER_LEVEL' | 'TSUNAMI_BUOY' | 'AIR_TOXICITY';
  currentReading: number;
  unit: string;
  dangerThreshold: number;
  status: 'SAFE' | 'ELEVATED' | 'DANGER' | 'CRITICAL';
  coordinates: Coordinates;
  lastUpdated: string;
}

export interface EarthquakeRiskParams {
  magnitude: number;
  depthKm: number;
  epicenterDistanceKm: number;
  faultMechanism: 'STRIKE_SLIP' | 'SUBDUCTION_MEGATHRUST' | 'NORMAL_FAULT';
  soilAmplification: 'HARD_ROCK' | 'DENSE_SOIL' | 'SOFT_ALLUVIUM_LIQUEFACTION';
}

export interface TsunamiPredictionResult {
  tsunamiRiskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  estimatedWaveHeightM: number;
  estimatedArrivalMinutes: number;
  confidenceScore: number;
  affectedCoastlineKm: number;
  safetyGuidance: string[];
}

export interface ResourceAllocationPlan {
  strategyName: string;
  rationale: string;
  efficiencyIndexPct: number;
  coverageGapPct: number;
  recommendedDispatches: {
    resourceId: string;
    resourceName: string;
    assignedIncidentId: string;
    incidentTitle: string;
    priorityScore: number;
    etaMinutes: number;
  }[];
  projectedReliefYield: string;
}

export interface SimulationState {
  currentStage: 'REPORT' | 'UNDERSTAND' | 'PRIORITIZE' | 'ASSIGN' | 'ROUTE' | 'RESPOND' | 'OPTIMIZE' | 'MONITOR' | 'RESOLVE' | 'LEARN';
  stepIndex: number;
  activeScenarioName: string;
  scenarioDescription: string;
  dsaConnectedFeature: string;
  logs: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  syllabusCategory: string;
  dsaPrinciple: string;
  explanation: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  title: string;
  type: DisasterType;
  severity: SeverityLevel;
  status: IncidentStatus;
  locationName: string;
  coordinates: Coordinates;
  reportedAt: string;
  casualties: number;
  affectedPopulation: number;
  description: string;
  assignedResponderIds?: string[];
  assignedResponderId?: string;
  basePriority: number; // 1 - 100
  agingMinutes: number;
  calculatedPriority?: number;
  hazardRadiusMeters: number;
  reporterPhone?: string;
  photoUrl?: string;
  seismicMagnitude?: number;
  depthKm?: number;
  floodWaterLevelMeters?: number;
  windSpeedKmh?: number;
}

export interface Responder {
  id: string;
  name: string;
  type: ResponderType;
  status: ResponderStatus;
  baseStation: string;
  currentCoordinates: Coordinates;
  capacity: number;
  crewCount: number;
  speedKmh: number;
  readinessTimeMinutes: number;
  currentIncidentId?: string;
  assignedIncidentId?: string;
  callsign?: string;
  plateNumber?: string;
  specialties: string[];
}

export interface Shelter {
  id: string;
  name: string;
  locationName: string;
  coordinates: Coordinates;
  capacityTotal: number;
  capacityCurrent: number;
  foodWaterStockDays: number;
  medicalStaffPresent: boolean;
  hasMedicalSupport?: boolean;
  suppliesSummary?: string;
  generatorPower: boolean;
  status: 'OPEN' | 'NEAR_CAPACITY' | 'FULL';
  contactPhone: string;
  type?: 'HOSPITAL' | 'SHELTER' | 'RELIEF_CAMP';
}

export interface ResourceSupply {
  id: string;
  name: string;
  category: 'MEDICAL' | 'SEARCH_RESCUE' | 'SHELTER_FOOD' | 'COMMUNICATION' | 'POWER_ENERGY';
  quantity: number;
  unit: string;
  weightKgPerUnit: number;
  utilityValue: number; // For Knapsack optimization
  locationId: string;
  locationName: string;
  status: 'ADEQUATE' | 'LOW' | 'CRITICAL';
}

export interface DisasterHotspot {
  id: string;
  name: string;
  coordinates: Coordinates;
  hazardType: DisasterType;
  riskScore: number; // 0 - 100
  status: 'EMERGENCY' | 'EVALUATING' | 'SECURED';
}

export interface RoutingNode {
  id: string;
  name: string;
  coordinates: Coordinates;
  elevationMeters: number;
  hazardRiskFactor: number; // 1.0 (clear) to 5.0 (hazardous/flooded)
}

export interface RoutingEdge {
  from: string;
  to: string;
  distanceKm: number;
  isBlocked: boolean;
  roadQuality: number; // factor
}

export interface DSAPathResult {
  algorithm: 'DIJKSTRA' | 'A_STAR' | 'BELLMAN_FORD';
  path: string[];
  pathCoordinates: Coordinates[];
  totalDistanceKm: number;
  estimatedMinutes: number;
  nodesVisited: number;
  executionTimeMs: number;
  timeComplexity: string;
  spaceComplexity: string;
}

export interface KnapsackItem {
  id: string;
  name: string;
  weight: number;
  value: number;
  category: string;
}

export interface KnapsackResult {
  selectedItems: KnapsackItem[];
  totalWeight: number;
  totalValue: number;
  capacity: number;
  executionTimeMs: number;
  dpTable?: number[][];
  timeComplexity: string;
  spaceComplexity: string;
}

export interface MatchingResult {
  matches: { responder: Responder; incident: Incident; score: number }[];
  unmatchedResponders: Responder[];
  unmatchedIncidents: Incident[];
  executionTimeMs: number;
  timeComplexity: string;
}

export interface DSUComponentResult {
  components: { rootId: string; members: string[]; isAccessibleToHospitals: boolean }[];
  isolatedAreas: string[];
  executionTimeMs: number;
  timeComplexity: string;
}

export interface RiskRadarMetric {
  category: string;
  score: number; // 0 - 100
  severity: SeverityLevel;
  detail: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface AuditAction {
  id: string;
  timestamp: string;
  actionType: string;
  actor: string;
  details: string;
}
