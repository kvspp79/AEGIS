import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Shield, 
  Save, 
  CheckCircle2, 
  Heart, 
  AlertCircle,
  Radio,
  Ambulance,
  LogOut,
  Camera
} from 'lucide-react';
import { UserRole } from '../types';

export interface UserAccountProfile {
  name: string;
  phone: string;
  email: string;
  age: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  photoUrl?: string;
  role: UserRole;
}

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  currentUserName: string;
  onUpdateProfile: (updated: UserAccountProfile) => void;
  onLogout?: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  currentUserName,
  onUpdateProfile,
  onLogout,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [photoUrl, setPhotoUrl] = useState('');
  const [role, setRole] = useState<UserRole>(currentRole);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Populate from localStorage or props when opening
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('aegis_user_profile');
        if (saved) {
          const p = JSON.parse(saved);
          setName(p.name || currentUserName || '');
          setPhone((p.phone || '').replace(/^\+91\s*/, ''));
          setEmail(p.email || '');
          setAge(p.age || '26');
          setEmergencyContactName(p.emergencyContactName || '');
          setEmergencyContactPhone((p.emergencyContactPhone || '').replace(/^\+91\s*/, ''));
          setBloodGroup(p.bloodGroup || 'O+');
          setPhotoUrl(p.photoUrl || '');
          setRole(p.role || currentRole);
        } else {
          setName(currentUserName || '');
          setRole(currentRole);
        }
      } catch {
        setName(currentUserName || '');
        setRole(currentRole);
      }
      setSuccessMessage(null);
      setError(null);
    }
  }, [isOpen, currentRole, currentUserName]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/^\+91\s*/, '').trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Please enter a valid mobile number.');
      return;
    }

    const updatedProfile: UserAccountProfile = {
      name: name.trim(),
      phone: `+91 ${cleanPhone}`,
      email: email.trim(),
      age: age.trim() || '25',
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim() ? `+91 ${emergencyContactPhone.trim()}` : '',
      bloodGroup,
      photoUrl,
      role,
    };

    // 1. Save to persistent storage
    localStorage.setItem('aegis_user_profile', JSON.stringify(updatedProfile));

    // 2. Immediately update state in parent App
    onUpdateProfile(updatedProfile);

    setSuccessMessage('Account details & phone number updated successfully!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                name ? name.charAt(0).toUpperCase() : <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Account Settings</h3>
              <p className="text-xs text-slate-500">Update your profile, phone number, and emergency contacts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo & Identity Banner */}
          <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 border-2 border-white shadow-inner flex items-center justify-center overflow-hidden font-bold text-xl text-slate-600">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  name ? name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <label 
                htmlFor="account-photo-upload"
                className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 shadow-md transition"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
              <input 
                id="account-photo-upload"
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
                className="hidden" 
              />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-slate-800 block">Personal Profile & Rescue ID</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Responders and trauma centers view this ID during triage dispatch.
              </span>
            </div>
          </div>

          {/* Full Name & Age */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 font-semibold text-slate-800 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="1"
                  max="115"
                  placeholder="25"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 font-semibold text-slate-800 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Phone Number (+91 format) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phone Number (SMS Alert & Calling)
            </label>
            <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-blue-500 bg-slate-50">
              <span className="flex items-center gap-1 px-3 py-2 bg-slate-100 border-r border-slate-200 text-xs font-bold text-slate-700">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="98401 23456"
                className="flex-1 px-3 py-2 text-xs bg-white outline-none font-semibold text-slate-800"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Used by emergency response teams and local hospital ER for triage communication.
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 font-semibold text-slate-800 outline-none transition"
              />
            </div>
          </div>

          {/* Medical Blood Group & Emergency Contact */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold text-slate-800 outline-none bg-white"
              >
                <option value="O+">O+ (Universal Donor)</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+91 Emergency Contact"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold text-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Role Switch: Citizen vs Responder */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Operating Mode / Role</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('CITIZEN')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                  role === 'CITIZEN'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-2 ring-blue-300'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Radio className={`w-4 h-4 ${role === 'CITIZEN' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-xs">Citizen Mode</span>
                <span className="text-[10px] text-slate-400">SOS Portal & Alerts</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('RESPONDER')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                  role === 'RESPONDER'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold ring-2 ring-emerald-300'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Ambulance className={`w-4 h-4 ${role === 'RESPONDER' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs">Responder Mode</span>
                <span className="text-[10px] text-slate-400">Dispatch & Hospital Console</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save & Update Profile</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition"
                title="Log Out of this session"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
