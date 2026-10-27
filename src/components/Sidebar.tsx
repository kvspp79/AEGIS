import React from 'react';
import { 
  Home, 
  Map, 
  AlertOctagon, 
  Layers, 
  FileText, 
  Radio, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  Send,
  LogOut,
  Truck,
  Hospital,
  Ambulance,
  Settings,
  User,
  Download
} from 'lucide-react';
import { MainTabType, UserRole } from '../types';
import { AegisLogo } from './AegisLogo';

interface SidebarProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  activeIncidentsCount: number;
  criticalAlertsCount: number;
  offlineQueueCount: number;
  userRole: UserRole;
  activeUserName: string;
  onOpenLoginModal: () => void;
  onOpenAccountSettings?: () => void;
  onOpenReportModal: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  activeIncidentsCount,
  criticalAlertsCount,
  offlineQueueCount,
  userRole,
  activeUserName,
  onOpenLoginModal,
  onOpenAccountSettings,
  onOpenReportModal,
  onLogout,
}) => {
  // Define full list of navigation items
  const allMenuItems: {
    id: MainTabType;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
    responderOnly?: boolean;
    citizenOnly?: boolean;
  }[] = [
    {
      id: 'home',
      label: 'Emergency Overview',
      description: 'Central overview & alerts',
      icon: <Home className="w-4 h-4" />,
    },
    {
      id: 'report',
      label: 'Citizen SOS Portal',
      description: 'Report incident & live tracking',
      icon: <Send className="w-4 h-4 text-blue-600" />,
      badge: offlineQueueCount > 0 ? `${offlineQueueCount} queued` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'responderConsole',
      label: 'Responder Console',
      description: 'Driver & hospital allocation',
      icon: <Ambulance className="w-4 h-4 text-emerald-600" />,
      badge: activeIncidentsCount > 0 ? `${activeIncidentsCount} SOS` : undefined,
      badgeColor: 'bg-emerald-600 text-white',
      responderOnly: true,
    },
    {
      id: 'hospitalStatus',
      label: 'Hospital Trauma Status',
      description: 'Emergency bed availability',
      icon: <Hospital className="w-4 h-4 text-teal-600" />,
      responderOnly: true,
    },
    {
      id: 'map',
      label: 'Tactical Map View',
      description: 'Live GPS & incident markers',
      icon: <Map className="w-4 h-4" />,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      id: 'dispatch',
      label: 'Incident Dispatch Pipeline',
      description: '5-stage operational pipeline',
      icon: <AlertOctagon className="w-4 h-4 text-amber-600" />,
      responderOnly: true,
    },
    {
      id: 'resources',
      label: 'Resource Management',
      description: 'Active vehicle missions & recycling',
      icon: <Truck className="w-4 h-4" />,
      responderOnly: true,
    },
    {
      id: 'weather',
      label: 'Real-Time India Disasters',
      description: 'Verified live disaster SITREP & alerts',
      icon: <Radio className="w-4 h-4 text-red-600" />,
      badge: criticalAlertsCount > 0 ? 'LIVE' : undefined,
      badgeColor: 'bg-red-500 text-white animate-pulse',
    },
    {
      id: 'analytics',
      label: 'Analytics & SITREP',
      description: 'Hotspots & official report preview',
      icon: <BarChart3 className="w-4 h-4" />,
      responderOnly: true,
    },
  ];

  // Strictly filter based on user directive:
  // "in responder page only keep emergency overview the responder console and hospital trauma status and tratical map view and emergeny dospatch pipline only keep them in responder remove all other from repoder page"
  const menuItems = allMenuItems.filter((item) => {
    if (userRole === 'RESPONDER') {
      const allowedResponderTabs = ['home', 'responderConsole', 'hospitalStatus', 'map', 'dispatch'];
      return allowedResponderTabs.includes(item.id);
    }
    // Citizen role:
    const allowedCitizenTabs = ['home', 'report', 'map', 'weather'];
    return allowedCitizenTabs.includes(item.id);
  });

  return (
    <aside 
      id="main-application-sidebar"
      className={`relative z-40 shrink-0 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 transition-all duration-300 flex flex-col justify-between ${
        isCollapsed ? 'w-16 sm:w-20' : 'w-64 sm:w-72'
      }`}
    >
      {/* Top Header / App Identity (AEGIS only, 5th image flooded house icon, no grid word, no 6th icon) */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <AegisLogo className="w-8 h-8 rounded-xl shadow-xs shrink-0" />
            <div className="overflow-hidden">
              <h2 className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-1.5 truncate">
                AEGIS
              </h2>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Emergency Coordination
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            <AegisLogo className="w-8 h-8 rounded-xl shadow-xs" />
          </div>
        )}

        {/* Arrow Toggle Collapse Button */}
        <button
          id="btn-toggle-sidebar"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Menu List */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all group relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`}>
                {item.icon}
              </span>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs truncate block">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {item.description}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile & Account Settings Footer */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {!isCollapsed ? (
          <>
            <button 
              type="button"
              id="sidebar-btn-account-settings"
              onClick={onOpenAccountSettings || onOpenLoginModal}
              className="w-full flex items-center justify-between p-2 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 cursor-pointer transition text-left group"
              title="Open Account Settings & Profile"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                  {activeUserName ? activeUserName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    {activeUserName || 'Account Profile'}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    {userRole} • Settings
                  </span>
                </div>
              </div>
              <Settings className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0 mr-1" />
            </button>

            <a
              href="/aegis-disaster-response-codebase.zip"
              download="aegis-disaster-response-codebase.zip"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition active:scale-98 shadow-xs"
              title="Download entire code in a ZIP file to open in VS Code"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download Code (ZIP)</span>
            </a>

            {onLogout && (
              <button
                type="button"
                id="sidebar-btn-logout"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition active:scale-98"
                title="Log out totally back to login screen"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of AEGIS</span>
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              id="sidebar-btn-collapsed-account"
              onClick={onOpenAccountSettings || onOpenLoginModal}
              className="w-8 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs"
              title="Account Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <a
              href="/aegis-disaster-response-codebase.zip"
              download="aegis-disaster-response-codebase.zip"
              className="p-2 rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
              title="Download Code ZIP"
            >
              <Download className="w-4 h-4" />
            </a>
            {onLogout && (
              <button
                type="button"
                id="sidebar-btn-collapsed-logout"
                onClick={onLogout}
                className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
