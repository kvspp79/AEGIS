import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Calendar, 
  Upload, 
  Camera, 
  CheckCircle2, 
  Shield, 
  Ambulance, 
  Radio
} from 'lucide-react';
import { UserRole } from '../types';
import { AegisLogo } from './AegisLogo';

interface UserProfileData {
  name: string;
  age: string;
  email: string;
  phone: string;
  photoUrl: string;
  role: UserRole;
}

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  activeUserName: string;
  onSelectRole: (role: UserRole, userName: string, profile?: UserProfileData) => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  activeUserName,
  onSelectRole,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState(activeUserName || '');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole === 'COMMANDER' ? 'RESPONDER' : currentRole);
  const [rememberMe, setRememberMe] = useState(true);

  const [authError, setAuthError] = useState<string | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setAuthError('Full Name is required. Please type your full name manually.');
      return;
    }

    const rawPhone = phone.replace(/[^\d]/g, '');
    const cleanPhone = rawPhone.startsWith('91') && rawPhone.length > 10 ? rawPhone.slice(2) : rawPhone;
    if (!cleanPhone || cleanPhone.length !== 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const parsedAge = parseInt(age.trim(), 10);
    if (!age.trim() || isNaN(parsedAge) || parsedAge < 10 || parsedAge > 115) {
      setAuthError('Please enter a valid age between 10 and 115.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    const trimmedPassword = password.trim();
    if (!trimmedPassword || trimmedPassword.length < 4) {
      setAuthError('Password must be at least 4 characters long.');
      return;
    }

    const formattedPhone = `+91 ${cleanPhone}`;
    const profile: UserProfileData = {
      name: trimmedName,
      age: parsedAge.toString(),
      email: trimmedEmail,
      phone: formattedPhone,
      photoUrl: photoUrl || '',
      role: selectedRole,
    };
    if (rememberMe) {
      localStorage.setItem('aegis_user_profile', JSON.stringify(profile));
    }
    onSelectRole(selectedRole, profile.name, profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <AegisLogo className="w-8 h-8 rounded-xl shadow-xs" />
              {isSignUp ? 'Create Citizen / Responder Account' : 'Sign in to AEGIS'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure emergency verification with phone, location, and verified profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
              <span>{authError}</span>
            </div>
          )}

          {/* Avatar Photo Upload & Preview */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center overflow-hidden border-2 border-indigo-300 shadow-inner">
                {photoUrl ? (
                  <img src={photoUrl} alt="User Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">{name ? name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <label 
                htmlFor="user-photo-input"
                className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 shadow-md transition"
                title="Upload Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
              <input 
                id="user-photo-input" 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload}
                className="hidden" 
              />
            </div>

            <div className="flex-1">
              <div className="text-xs font-bold text-slate-800">Your Photo / Identity</div>
              <p className="text-[11px] text-slate-500">
                Helps search and rescue responders identify you during evacuation and dispatch.
              </p>
            </div>
          </div>

          {/* Full Name & Age */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Type your full name"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none font-medium text-slate-800 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Age</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="1"
                  max="110"
                  placeholder="28"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none font-medium text-slate-800 transition"
                />
              </div>
            </div>
          </div>

          {/* Email / Gmail */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address (Gmail)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="youremail@gmail.com"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none font-medium text-slate-800 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none font-medium text-slate-800 transition"
              />
            </div>
          </div>

          {/* Phone Number with +91 Prefix */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Mobile Number (SOS SMS & Calling)
            </label>
            <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-indigo-500 bg-slate-50">
              <span className="flex items-center gap-1 px-3 py-2 bg-slate-100 border-r border-slate-200 text-xs font-bold text-slate-700">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                value={phone.replace(/^\+91\s*/, '')}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="98401 23456"
                className="flex-1 px-3 py-2 text-xs bg-transparent focus:bg-white outline-none font-medium text-slate-800 transition"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Emergency responders will call this number when you transmit an SOS signal.
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Select Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('CITIZEN')}
                className={`p-2.5 rounded-2xl border text-left transition flex flex-col items-center text-center gap-1 ${
                  selectedRole === 'CITIZEN'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Radio className={`w-4 h-4 ${selectedRole === 'CITIZEN' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold block">Citizen</span>
                <span className="text-[10px] text-slate-500">SOS Triage & Map</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('RESPONDER')}
                className={`p-2.5 rounded-2xl border text-left transition flex flex-col items-center text-center gap-1 ${
                  selectedRole === 'RESPONDER'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Ambulance className={`w-4 h-4 ${selectedRole === 'RESPONDER' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold block">Responder</span>
                <span className="text-[10px] text-slate-500">Field Dispatch & Hospitals</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSignUp ? 'Register & Enter Dashboard' : `Sign In as ${name}`}</span>
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an emergency profile? Create One"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
