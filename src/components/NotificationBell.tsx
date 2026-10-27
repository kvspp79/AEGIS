import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCircle2, 
  Ambulance, 
  Hospital, 
  AlertTriangle, 
  Clock, 
  Trash2,
  X,
  ExternalLink
} from 'lucide-react';
import { Incident } from '../types';

export interface DispatchNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'DISPATCH' | 'HOSPITAL' | 'ALERT' | 'RESOLVED';
  isRead: boolean;
  incidentId?: string;
}

interface NotificationBellProps {
  incidents: Incident[];
  onSelectIncident?: (incident: Incident) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  incidents,
  onSelectIncident,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic dispatch history tracking
  const [notifications, setNotifications] = useState<DispatchNotification[]>([
    {
      id: 'notif-1',
      title: 'Nearest Driver & Hospital Allocated',
      description: 'Ambulance Unit SAR-04 assigned to active emergency; Apollo Trauma Center receiving bay reserved.',
      timestamp: 'Just now',
      type: 'DISPATCH',
      isRead: false,
    },
    {
      id: 'notif-2',
      title: 'Hospital Capacity Synchronized',
      description: 'Central Trauma Hospital confirmed 42 emergency beds available for incoming triage.',
      timestamp: '3m ago',
      type: 'HOSPITAL',
      isRead: false,
    },
    {
      id: 'notif-3',
      title: 'Landslide Disaster Early Warning',
      description: 'NDMA Inundation bulletin issued for coastal and hillside sectors.',
      timestamp: '14m ago',
      type: 'ALERT',
      isRead: false,
    },
    {
      id: 'notif-4',
      title: 'Successful Field Extraction',
      description: 'Flood rescue unit completed evacuation of 4 stranded citizens in Sector 3.',
      timestamp: '32m ago',
      type: 'RESOLVED',
      isRead: true,
    },
  ]);

  // Update notifications when incidents change
  useEffect(() => {
    if (incidents.length > 0) {
      const latest = incidents[0];
      if (latest.status === 'ASSIGNED' || latest.status === 'RESPONDING') {
        setNotifications((prev) => {
          if (prev.some((n) => n.incidentId === latest.id)) return prev;
          return [
            {
              id: `notif-${latest.id}`,
              title: `Dispatch Assigned: ${latest.title}`,
              description: `Response vehicle en route to ${latest.locationName}. Hospital alerted.`,
              timestamp: 'Just now',
              type: 'DISPATCH',
              isRead: false,
              incidentId: latest.id,
            },
            ...prev,
          ];
        });
      }
    }
  }, [incidents]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with Red Badge Count */}
      <button
        type="button"
        id="navbar-btn-notifications"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95 flex items-center justify-center"
        title="Dispatch Events & Incident Alerts"
        aria-label="Dispatch Events & Incident Alerts"
      >
        <Bell className="w-4 h-4" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Dispatch Events & Alerts</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[10px] text-slate-400 hover:text-slate-600 transition"
                  title="Clear notifications"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active notifications or alerts.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
                    );
                    if (notif.incidentId && onSelectIncident) {
                      const match = incidents.find((i) => i.id === notif.incidentId);
                      if (match) onSelectIncident(match);
                    }
                  }}
                  className={`p-3.5 transition flex items-start gap-3 cursor-pointer hover:bg-slate-50 ${
                    !notif.isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {notif.type === 'DISPATCH' && (
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Ambulance className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {notif.type === 'HOSPITAL' && (
                      <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                        <Hospital className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {notif.type === 'ALERT' && (
                      <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {notif.type === 'RESOLVED' && (
                      <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs truncate ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                      {notif.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[10px] font-semibold text-slate-500">
              Live Centralized Dispatch Log • Real-Time Broadcasts
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
