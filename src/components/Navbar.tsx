import React from 'react';
import { 
  AlertTriangle, 
  Send,
  Radio,
  Ambulance,
  User,
  Download
} from 'lucide-react';
import { MainTabType, UserRole, Incident } from '../types';
import { AegisLogo } from './AegisLogo';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  userRole: UserRole;
  activeUserName: string;
  activeIncidentsCount: number;
  criticalAlertsCount: number;
  incidents?: Incident[];
  onOpenReportModal: () => void;
  onOpenBroadcastModal: () => void;
  onOpenLoginModal: () => void;
  onOpenAccountSettings?: () => void;
  onLogout?: () => void;
  onSwitchRole?: (role: UserRole) => void;
  onSelectIncident?: (incident: Incident) => void;
  onOpenPythonModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  activeUserName,
  activeIncidentsCount,
  criticalAlertsCount,
  incidents = [],
  onOpenReportModal,
  onOpenBroadcastModal,
  onOpenLoginModal,
  onOpenAccountSettings,
  onLogout,
  onSwitchRole,
  onSelectIncident,
  onOpenPythonModal,
}) => {
  // Retrieve saved profile photo if available
  const savedProfile = (() => {
    try {
      const p = localStorage.getItem('aegis_user_profile');
      return p ? JSON.parse(p) : null;
    } catch {
      return null;
    }
  })();

  const photoUrl = savedProfile?.photoUrl || '';

  return (
    <header className="sticky top-0 z-30 w-full px-3 sm:px-6 py-2 transition-all border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        
        {/* Left: Flooded House App Logo + AEGIS Name */}
        <div className="flex items-center gap-2.5 shrink-0">
          <AegisLogo className="w-7 h-7 rounded-xl shadow-xs" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900 tracking-tight">
              AEGIS
            </span>
            {activeIncidentsCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {activeIncidentsCount} Active
              </span>
            )}
          </div>
        </div>

        {/* Center: Live Role Switcher (Citizen SOS / Responder Console) */}
        {onSwitchRole && (
          <div className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                onSwitchRole('CITIZEN');
                setActiveTab('report');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
                userRole === 'CITIZEN'
                  ? 'bg-white text-blue-700 shadow-xs ring-1 ring-blue-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              <span>Citizen SOS</span>
            </button>

            <button
              onClick={() => {
                onSwitchRole('RESPONDER');
                setActiveTab('responderConsole');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
                userRole === 'RESPONDER'
                  ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ambulance className="w-3.5 h-3.5 text-emerald-600" />
              <span>Responder & Hospital Console</span>
            </button>
          </div>
        )}

        {/* Right Tools: Minimized SOS Button, Notification Bell, Broadcast, and Profile */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Minimized Emergency SOS Button */}
          <button
            id="navbar-btn-sos-report"
            onClick={onOpenReportModal}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95 transition"
            title="Send Instant Emergency SOS"
          >
            <Send className="w-3 h-3" />
            <span>SOS</span>
          </button>

          {/* Centralized Dispatch History & Alerts Notification Bell */}
          <NotificationBell 
            incidents={incidents} 
            onSelectIncident={onSelectIncident} 
          />

          {/* Download Python Project ZIP & Modal */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenPythonModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95 transition cursor-pointer"
              title="Download runnable Python project ZIP & VS Code setup"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span className="text-[11px] font-extrabold">Download Python Code</span>
            </button>
            {onOpenPythonModal && (
              <button
                onClick={onOpenPythonModal}
                className="hidden sm:flex items-center px-2 py-1 text-[11px] font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 active:scale-95 transition cursor-pointer"
                title="View Python DSA Algorithms & VS Code Instructions"
              >
                DSA Info
              </button>
            )}
          </div>

          {/* Quick Alert Broadcast */}
          <button
            id="navbar-btn-broadcast"
            onClick={onOpenBroadcastModal}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-95 transition"
            title="Broadcast Emergency Advisory"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden md:inline text-[11px]">Broadcast</span>
          </button>

          {/* User Profile / Account Settings Pill */}
          <button
            id="navbar-btn-login-profile"
            onClick={onOpenAccountSettings || onOpenLoginModal}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 transition text-slate-800"
            title="Account Settings & Profile"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center overflow-hidden shadow-xs">
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : activeUserName ? (
                activeUserName.charAt(0).toUpperCase()
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="text-left hidden xl:block">
              <span className="text-[11px] font-bold text-slate-800 block leading-tight truncate max-w-[110px]">
                {activeUserName || 'Account'}
              </span>
              <span className="text-[9px] text-slate-400 font-mono block leading-tight">
                {userRole}
              </span>
            </div>
          </button>

        </div>

      </div>
    </header>
  );
};
