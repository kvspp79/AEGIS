import React, { useState } from 'react';
import { X, Radio, AlertTriangle, Send, Volume2, Shield } from 'lucide-react';
import { playEmergencyAlertSound } from '../utils/audioAlerts';

interface BroadcastSOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcast: (title: string, message: string, severity: 'CRITICAL' | 'SEVERE' | 'WARNING') => void;
}

export const BroadcastSOSModal: React.FC<BroadcastSOSModalProps> = ({
  isOpen,
  onClose,
  onBroadcast,
}) => {
  const [headline, setHeadline] = useState('IMMEDIATE EVACUATION ORDER: COASTAL & RIVERINE SECTOR');
  const [severity, setSeverity] = useState<'CRITICAL' | 'SEVERE' | 'WARNING'>('CRITICAL');
  const [message, setMessage] = useState('All residents within 2 km of coastal seawalls must evacuate inland immediately to designated Tier-1 shelters. Move to elevated ground. Sluice discharge active.');
  const [channels, setChannels] = useState({
    cellBroadcast: true,
    sirens: true,
    radioTv: true,
    shelterSpeakers: true,
  });

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    playEmergencyAlertSound(severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING');
    onBroadcast(headline, message, severity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border-white relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-lg shadow-rose-200">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>National Disaster SOS Emergency Broadcast</span>
              <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase">Priority 1</span>
            </h3>
            <p className="text-xs text-slate-700">Immediate citizen mobile flash override & siren activation</p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Broadcast Alert Headline</label>
            <input
              type="text"
              required
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Advisory Instructions</label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          {/* Distribution Channels */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">Omnichannel Dissemination</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/70 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={channels.cellBroadcast}
                  onChange={(e) => setChannels({ ...channels, cellBroadcast: e.target.checked })}
                  className="rounded text-rose-600 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">Cell Broadcast (WEA)</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/70 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={channels.sirens}
                  onChange={(e) => setChannels({ ...channels, sirens: e.target.checked })}
                  className="rounded text-rose-600 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">Municipal Sirens</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/70 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={channels.radioTv}
                  onChange={(e) => setChannels({ ...channels, radioTv: e.target.checked })}
                  className="rounded text-rose-600 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">Radio / TV EAS</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/70 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={channels.shelterSpeakers}
                  onChange={(e) => setChannels({ ...channels, shelterSpeakers: e.target.checked })}
                  className="rounded text-rose-600 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">Shelter Intercoms</span>
              </label>
            </div>
          </div>

          <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700">
            <Volume2 className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-medium">
              Audio warning tone will be synthesized via Web Audio API across all connected commander and responder consoles.
            </span>
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
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-300 flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>TRANSMIT EMERGENCY BROADCAST</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
