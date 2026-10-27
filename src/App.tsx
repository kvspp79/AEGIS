/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  INITIAL_INCIDENTS, 
  INITIAL_RESPONDERS, 
  INITIAL_SHELTERS, 
  INITIAL_SUPPLIES, 
  ROUTING_NODES, 
  ROUTING_EDGES 
} from './data/disasterItems';
import { 
  Incident, 
  Responder, 
  Shelter, 
  ResourceSupply, 
  UserRole, 
  MainTabType,
  IncidentStatus,
  DSAPathResult,
  DecisionExplanation 
} from './types';
import { 
  EmergencyGraph, 
  EmergencyPriorityQueue, 
  DisasterTrie, 
  DispatchCommandStack,
  DispatchAction 
} from './services/dsaEngine';
import { playEmergencyAlertSound } from './utils/audioAlerts';

// Modular View & Navigation Components
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { CitizenReportView } from './components/CitizenReportView';
import { MapView } from './components/MapView';
import { SmartDispatchBoard } from './components/SmartDispatchBoard';
import { ResourceAllocationModule } from './components/ResourceAllocationModule';
import { WeatherEnvironmentalFeeds } from './components/WeatherEnvironmentalFeeds';
import { AnalyticsReportingDashboard } from './components/AnalyticsReportingDashboard';
import { ResponderConsoleView } from './components/ResponderConsoleView';
import { HospitalStatusView } from './components/HospitalStatusView';

// Modals
import { DecisionExplanationModal } from './components/DecisionExplanationModal';
import { UserLoginModal } from './components/UserLoginModal';
import { UserLoginView } from './components/UserLoginView';
import { ReportIncidentModal } from './components/ReportIncidentModal';
import { BroadcastSOSModal } from './components/BroadcastSOSModal';
import { AccountSettingsModal, UserAccountProfile } from './components/AccountSettingsModal';
import { PythonProjectDownloadModal } from './components/PythonProjectDownloadModal';

export default function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Auth gate - user starts directly at login screen
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Core Disaster Dataset
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [responders, setResponders] = useState<Responder[]>(INITIAL_RESPONDERS);
  const [shelters, setShelters] = useState<Shelter[]>(INITIAL_SHELTERS);
  const [supplies, setSupplies] = useState<ResourceSupply[]>(INITIAL_SUPPLIES);
  const [offlineReports, setOfflineReports] = useState<Partial<Incident>[]>([]);

  // Navigation & User Identity (Loaded from localStorage if available)
  const [activeTab, setActiveTab] = useState<MainTabType>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const savedProfile = (() => {
    try {
      const p = localStorage.getItem('aegis_user_profile');
      return p ? JSON.parse(p) : null;
    } catch {
      return null;
    }
  })();

  const [userRole, setUserRole] = useState<UserRole>(savedProfile?.role || 'CITIZEN');
  const [activeUserName, setActiveUserName] = useState(savedProfile?.name || '');
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(true);

  // Map & Route Selection
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedResponder, setSelectedResponder] = useState<Responder | null>(null);
  const [activeRoute, setActiveRoute] = useState<DSAPathResult | null>(null);

  // Modals & Popups
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [activeDecision, setActiveDecision] = useState<DecisionExplanation | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core DSA Engines (Graph, Priority Queue, Trie, Dispatch Undo Stack)
  const graph = useMemo(() => {
    return new EmergencyGraph(ROUTING_NODES, ROUTING_EDGES);
  }, []);

  const priorityQueue = useMemo(() => {
    const pq = new EmergencyPriorityQueue(0.5);
    incidents.forEach((inc) => pq.insert(inc));
    return pq;
  }, [incidents]);

  const trie = useMemo(() => {
    const t = new DisasterTrie();
    incidents.forEach((i) => t.insert(i.title, i.id, 'INCIDENT'));
    responders.forEach((r) => t.insert(r.name, r.id, 'RESPONDER'));
    supplies.forEach((s) => t.insert(s.name, s.id, 'SUPPLY'));
    return t;
  }, [incidents, responders, supplies]);

  const dispatchStack = useMemo(() => {
    return new DispatchCommandStack();
  }, []);

  const [undoStackCount, setUndoStackCount] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateStackStatus = useCallback(() => {
    setCanUndo(dispatchStack.canUndo());
    setCanRedo(dispatchStack.canRedo());
    setUndoStackCount(dispatchStack.getHistoryLength());
  }, [dispatchStack]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Compute Shortest Route automatically
  const handleCalculateRoute = useCallback((
    fromNodeId: string, 
    toNodeId: string, 
    algorithm: 'DIJKSTRA' | 'A_STAR' | 'BELLMAN_FORD' = 'DIJKSTRA'
  ) => {
    const result = graph.findShortestPath(fromNodeId, toNodeId, algorithm);
    setActiveRoute(result);
    return result;
  }, [graph]);

  // Dispatch Unit Action
  const handleQuickDispatch = useCallback((incidentId: string, preferredResponderId?: string) => {
    const targetIncident = incidents.find((i) => i.id === incidentId);
    if (!targetIncident) return;

    let targetResponder = preferredResponderId 
      ? responders.find((r) => r.id === preferredResponderId)
      : responders.find((r) => r.status === 'AVAILABLE');

    if (!targetResponder) {
      targetResponder = responders[0];
    }

    const prevIncidentStatus = targetIncident.status;
    const prevResponderStatus = targetResponder.status;

    const action: DispatchAction = {
      id: `DISPATCH-${Date.now()}`,
      incidentId: targetIncident.id,
      responderId: targetResponder.id,
      timestamp: new Date().toISOString(),
      type: 'DISPATCH',
      previousStatus: prevIncidentStatus,
      newStatus: 'RESPONDING',
    };

    setIncidents((prev) =>
      prev.map((inc) => (inc.id === targetIncident.id ? { ...inc, status: 'RESPONDING' } : inc))
    );
    setResponders((prev) =>
      prev.map((resp) =>
        resp.id === targetResponder!.id
          ? { ...resp, status: 'BUSY', assignedIncidentId: targetIncident.id }
          : resp
      )
    );

    dispatchStack.execute(action);
    updateStackStatus();

    setSelectedIncident(targetIncident);
    setSelectedResponder(targetResponder);
    handleCalculateRoute('NODE-01', 'NODE-07', 'DIJKSTRA');

    if (audioAlertsEnabled) {
      playEmergencyAlertSound('CRITICAL');
    }

    showToast(`Dispatched ${targetResponder.name} to "${targetIncident.title}"!`);
  }, [incidents, responders, dispatchStack, updateStackStatus, handleCalculateRoute, audioAlertsEnabled, showToast]);

  const handleUpdateIncidentStatus = useCallback((incidentId: string, newStatus: IncidentStatus) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incidentId ? { ...inc, status: newStatus } : inc))
    );
    if (newStatus === 'RESOLVED') {
      setSelectedIncident((prev) =>
        prev && prev.id === incidentId ? { ...prev, status: 'RESOLVED' } : prev
      );
      setResponders((prev) =>
        prev.map((r) =>
          r.assignedIncidentId === incidentId
            ? { ...r, status: 'AVAILABLE', assignedIncidentId: undefined }
            : r
        )
      );
      setActiveRoute(null);
    }
    showToast(`Incident #${incidentId.slice(-6)} updated to ${newStatus}`);
  }, [showToast]);

  const handleMissionAccomplished = useCallback((incidentId: string, responderId: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incidentId ? { ...inc, status: 'RESOLVED' as const } : inc))
    );
    setSelectedIncident((prev) =>
      prev && prev.id === incidentId ? { ...prev, status: 'RESOLVED' as const } : prev
    );
    setResponders((prev) =>
      prev.map((r) =>
        r.id === responderId || r.assignedIncidentId === incidentId
          ? { ...r, status: 'AVAILABLE' as const, assignedIncidentId: undefined }
          : r
      )
    );
    setActiveRoute(null);
    showToast('Mission Accomplished: Casualties admitted to trauma center. Responder returned to AVAILABLE status.');
  }, [showToast]);

  // Active Mission and Polyline Synchronization Loop:
  // Ensures the animated polyline and routing updates ONLY while an active mission is in progress,
  // stops entirely once the incident status becomes 'RESOLVED', and includes a cleanup effect
  // that clears the interval when the responder reaches destination or when mission ends.
  useEffect(() => {
    // If no incident or incident is resolved, immediately clear route and stop
    if (!selectedIncident || selectedIncident.status === 'RESOLVED') {
      if (activeRoute) {
        setActiveRoute(null);
      }
      return;
    }

    const isMissionInProgress = selectedIncident.status === 'ASSIGNED' || selectedIncident.status === 'RESPONDING';
    if (!isMissionInProgress) {
      if (activeRoute) {
        setActiveRoute(null);
      }
      return;
    }

    // Active mission interval loop
    const missionSyncInterval = setInterval(() => {
      // Re-verify current incident status from fresh list
      const latestIncident = incidents.find((i) => i.id === selectedIncident.id);
      if (!latestIncident || latestIncident.status === 'RESOLVED') {
        setActiveRoute(null);
        clearInterval(missionSyncInterval);
        return;
      }

      // Check if responder is still active
      const assignedResp = responders.find(
        (r) => r.id === latestIncident.assignedResponderId || r.assignedIncidentId === latestIncident.id
      );
      if (assignedResp && assignedResp.status === 'AVAILABLE') {
        // Responder has returned to available / destination reached
        setActiveRoute(null);
        clearInterval(missionSyncInterval);
        return;
      }

      // Update route calculation while active
      handleCalculateRoute('NODE-01', 'NODE-07', 'DIJKSTRA');
    }, 5000);

    // Cleanup effect: clears the interval when the responder reaches destination or on unmount
    return () => {
      clearInterval(missionSyncInterval);
    };
  }, [selectedIncident, incidents, responders, activeRoute, handleCalculateRoute]);

  const handleRecycleResponder = useCallback((responderId: string) => {
    setResponders((prev) =>
      prev.map((r) =>
        r.id === responderId
          ? { ...r, status: 'AVAILABLE', assignedIncidentId: undefined }
          : r
      )
    );
    showToast(`Responder unit #${responderId} recycled back to AVAILABLE`);
  }, [showToast]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    showToast('Logged out of AEGIS. Please sign in to continue.');
  }, [showToast]);

  // Handle reporting new incident: alerts all available drivers and hospitals, allocates nearest driver
  const handleReportIncident = (newInc: Partial<Incident>): Incident => {
    const incCoords = newInc.coordinates || { lat: 11.0168, lng: 76.9558 };

    // 1. Calculate distance to all available drivers and locate nearest
    const availableDrivers = responders.filter((r) => r.status === 'AVAILABLE');
    let nearestDriver: Responder | null = null;
    let minDriverDist = Infinity;

    for (const driver of availableDrivers) {
      const dLat = (driver.currentCoordinates.lat - incCoords.lat) * 111.32;
      const dLng = (driver.currentCoordinates.lng - incCoords.lng) * (111.32 * Math.cos((incCoords.lat * Math.PI) / 180));
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDriverDist) {
        minDriverDist = dist;
        nearestDriver = driver;
      }
    }

    // 2. Locate nearest available hospital with bed capacity (prioritizing local city hospitals)
    const availableHospitals = shelters.filter((s) => (s.type === 'HOSPITAL' || s.medicalStaffPresent) && s.capacityCurrent < s.capacityTotal);
    let nearestHospital: Shelter | null = null;
    let minHospDist = Infinity;

    for (const hosp of (availableHospitals.length > 0 ? availableHospitals : shelters)) {
      const dLat = (hosp.coordinates.lat - incCoords.lat) * 111.32;
      const dLng = (hosp.coordinates.lng - incCoords.lng) * (111.32 * Math.cos((incCoords.lat * Math.PI) / 180));
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minHospDist) {
        minHospDist = dist;
        nearestHospital = hosp;
      }
    }

    if (!nearestHospital || minHospDist > 20) {
      nearestHospital = shelters.find((s) => s.id === 'HOSP-CBE-01') || shelters[0];
    }

    const fullIncident: Incident = {
      id: `INC-LIVE-${Date.now().toString().slice(-4)}`,
      title: newInc.title || 'Reported Emergency Hotspot',
      type: newInc.type || 'FLOOD',
      severity: newInc.severity || 'HIGH',
      coordinates: incCoords,
      locationName: newInc.locationName || 'Metropolitan Sector',
      casualties: newInc.casualties || 1,
      affectedPopulation: newInc.affectedPopulation || 15,
      reportedAt: new Date().toISOString(),
      status: nearestDriver ? 'ASSIGNED' : 'REPORTED',
      assignedResponderId: nearestDriver?.id,
      basePriority: 75,
      calculatedPriority: 85,
      agingMinutes: 0,
      description: newInc.description || 'Emergency reported via Citizen SOS portal.',
      hazardRadiusMeters: 1000,
      reporterPhone: newInc.reporterPhone || '+91 98401 23456',
    };

    setIncidents((prev) => [fullIncident, ...prev]);
    setSelectedIncident(fullIncident);

    // If an available driver exists, auto-allocate to this emergency
    if (nearestDriver) {
      const assignedId = nearestDriver.id;
      setResponders((prev) =>
        prev.map((r) =>
          r.id === assignedId
            ? { ...r, status: 'BUSY', assignedIncidentId: fullIncident.id }
            : r
        )
      );
      setSelectedResponder(nearestDriver);
    }

    if (audioAlertsEnabled) {
      playEmergencyAlertSound('CRITICAL');
    }

    if (nearestDriver) {
      showToast(
        `🚨 SOS Alert to ${availableDrivers.length} Drivers & ${availableHospitals.length} Hospitals! Nearest Driver Allocated: ${nearestDriver.name} (${minDriverDist.toFixed(1)} km) → Receiving: ${nearestHospital?.name || 'General Trauma Center'}`
      );
    } else {
      showToast(`🚨 SOS Alert broadcast to ${responders.length} Drivers & ${shelters.length} Hospitals. No idle drivers; queued at top priority!`);
    }

    return fullIncident;
  };

  // Handle mass emergency SOS broadcast
  const handleBroadcastSOS = (title: string, message: string, severity: 'CRITICAL' | 'SEVERE' | 'WARNING') => {
    const broadcastIncident: Incident = {
      id: `SOS-${Date.now().toString().slice(-4)}`,
      title,
      type: 'CYCLONE',
      severity: severity === 'WARNING' ? 'MODERATE' : severity,
      coordinates: { lat: 13.0827, lng: 80.2707 },
      locationName: 'Metropolitan Crisis Zone',
      casualties: 12,
      affectedPopulation: 250000,
      reportedAt: 'LIVE BROADCAST',
      status: 'REPORTED',
      basePriority: 99,
      calculatedPriority: 99,
      agingMinutes: 0,
      description: message,
      hazardRadiusMeters: 5000,
    };

    setIncidents((prev) => [broadcastIncident, ...prev]);
    setActiveTab('map');
    showToast(`NATIONAL SOS BROADCAST ACTIVATED: ${title}`);
  };

  const activeIncidentsCount = incidents.filter((i) => i.status !== 'RESOLVED').length;
  const criticalAlertsCount = incidents.filter((i) => i.severity === 'CRITICAL' || i.severity === 'EXTREME').length;

  // Start directly with user login if not authenticated
  if (!isAuthenticated) {
    return (
      <UserLoginView
        initialRole={userRole}
        initialName={activeUserName}
        onLoginSuccess={(profile) => {
          setUserRole(profile.role);
          setActiveUserName(profile.name);
          setIsAuthenticated(true);
          if (profile.role === 'CITIZEN') {
            setActiveTab('report');
          } else {
            setActiveTab('home');
          }
          showToast(`Welcome, ${profile.name}! Signed in as ${profile.role}.`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex font-sans selection:bg-indigo-100 selection:text-indigo-800 antialiased">
      
      {/* 1. Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeIncidentsCount={activeIncidentsCount}
        criticalAlertsCount={criticalAlertsCount}
        offlineQueueCount={offlineReports.length}
        userRole={userRole}
        activeUserName={activeUserName}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={userRole}
          activeUserName={activeUserName}
          activeIncidentsCount={activeIncidentsCount}
          criticalAlertsCount={criticalAlertsCount}
          incidents={incidents}
          onSelectIncident={(inc) => {
            setSelectedIncident(inc);
            setActiveTab('map');
          }}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
          onLogout={handleLogout}
          onSwitchRole={(role) => {
            setUserRole(role);
            showToast(`Switched active role to ${role}`);
          }}
          onOpenPythonModal={() => setIsPythonModalOpen(true)}
        />

        {/* Floating Notification Toast */}
        {toastMessage && (
          <div className="fixed top-16 right-6 z-50 glass-panel px-4 py-2.5 rounded-2xl shadow-xl border border-indigo-200 text-xs font-bold text-slate-800 flex items-center gap-2 animate-bounce">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Dynamic Viewport Router */}
        <main className="flex-1 w-full relative pb-12">
          {activeTab === 'home' && (
            <HomeDashboard
              incidents={incidents}
              responders={responders}
              shelters={shelters}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
              onOpenDecisionExplanation={(inc) => {
                setSelectedIncident(inc);
              }}
              activeUserName={activeUserName}
              userRole={userRole}
              onOpenPythonModal={() => setIsPythonModalOpen(true)}
            />
          )}

          {activeTab === 'report' && (
            <CitizenReportView
              onSubmitReport={handleReportIncident}
              availableResponders={responders}
              offlineQueueCount={offlineReports.length}
              onTrackOnMap={(incident, responder) => {
                setSelectedIncident(incident);
                setSelectedResponder(responder);
                setActiveTab('map');
              }}
            />
          )}

          {activeTab === 'map' && (
            <MapView
              apiKey={apiKey}
              incidents={incidents}
              responders={responders}
              shelters={shelters}
              selectedIncident={selectedIncident}
              onSelectIncident={setSelectedIncident}
              selectedResponder={selectedResponder}
              onSelectResponder={setSelectedResponder}
              activeRoute={activeRoute}
              onCalculateRoute={handleCalculateRoute}
              onQuickDispatch={(incId) => handleQuickDispatch(incId)}
              onMissionAccomplished={handleMissionAccomplished}
            />
          )}

          {activeTab === 'dispatch' && (
            <SmartDispatchBoard
              incidents={incidents}
              responders={responders}
              shelters={shelters}
              onDispatchUnit={(incId, respId) => handleQuickDispatch(incId, respId)}
              onUpdateStatus={handleUpdateIncidentStatus}
              onNavigateToMap={(incident) => {
                setSelectedIncident(incident);
                setActiveTab('map');
              }}
            />
          )}

          {activeTab === 'responderConsole' && (
            <ResponderConsoleView
              apiKey={apiKey}
              incidents={incidents}
              responders={responders}
              shelters={shelters}
              onQuickDispatch={(incId: string, respId: string) => handleQuickDispatch(incId, respId)}
              onUpdateStatus={handleUpdateIncidentStatus}
              onNavigateToMap={(incident, responder) => {
                setSelectedIncident(incident);
                if (responder) setSelectedResponder(responder);
                setActiveTab('map');
              }}
              onMissionAccomplished={handleMissionAccomplished}
            />
          )}

          {activeTab === 'hospitalStatus' && (
            <HospitalStatusView
              incidents={incidents}
              shelters={shelters}
              responders={responders}
              onNavigateToMap={(incident) => {
                setSelectedIncident(incident);
                setActiveTab('map');
              }}
            />
          )}

          {activeTab === 'resources' && (
            <ResourceAllocationModule
              incidents={incidents}
              responders={responders}
              onRecycleResponder={handleRecycleResponder}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              onQuickDispatch={(incId, respId) => handleQuickDispatch(incId, respId)}
            />
          )}

          {activeTab === 'weather' && (
            <WeatherEnvironmentalFeeds />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsReportingDashboard
              incidents={incidents}
              responders={responders}
              shelters={shelters}
              onQuickDispatch={(incId) => handleQuickDispatch(incId)}
            />
          )}
        </main>

      </div>

      {/* 3. Modals & Dialogs */}
      <DecisionExplanationModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        decision={activeDecision}
      />

      <UserLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentRole={userRole}
        activeUserName={activeUserName}
        onSelectRole={(newRole, newName) => {
          setUserRole(newRole);
          setActiveUserName(newName);
          showToast(`Active profile switched to ${newName} (${newRole})`);
        }}
      />

      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={(inc) => handleReportIncident(inc)}
      />

      <BroadcastSOSModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onBroadcast={handleBroadcastSOS}
      />

      <AccountSettingsModal
        isOpen={isAccountSettingsOpen}
        onClose={() => setIsAccountSettingsOpen(false)}
        currentRole={userRole}
        currentUserName={activeUserName}
        onUpdateProfile={(updated: UserAccountProfile) => {
          setActiveUserName(updated.name);
          setUserRole(updated.role);
          showToast(`Profile updated: ${updated.name} (${updated.role})`);
        }}
        onLogout={handleLogout}
      />

      <PythonProjectDownloadModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

    </div>
  );
}
