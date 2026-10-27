import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Calendar, 
  Camera, 
  CheckCircle2, 
  Ambulance, 
  Radio,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { UserRole } from '../types';
import { AegisLogo } from './AegisLogo';

export interface UserProfileData {
  name: string;
  age: string;
  email: string;
  phone: string;
  photoUrl: string;
  role: UserRole;
}

interface UserLoginViewProps {
  onLoginSuccess: (profile: UserProfileData) => void;
  initialRole?: UserRole;
  initialName?: string;
}

export const UserLoginView: React.FC<UserLoginViewProps> = ({
  onLoginSuccess,
  initialRole = 'CITIZEN',
  initialName = '',
}) => {
  // Strict empty states - user must input all fields manually
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    initialRole === 'COMMANDER' ? 'RESPONDER' : initialRole
  );
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

    // 1. Strict validation: Full Name
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setAuthError('Full Name is required. Please manually enter your full legal name.');
      return;
    }

    // 2. Strict validation: Phone Number
    const rawPhone = phone.replace(/[^\d]/g, '');
    const cleanPhone = rawPhone.startsWith('91') && rawPhone.length > 10 ? rawPhone.slice(2) : rawPhone;
    if (!cleanPhone || cleanPhone.length !== 10) {
      setAuthError('Please manually enter your valid 10-digit mobile number (e.g. 98401 23456).');
      return;
    }

    // 3. Strict validation: Age
    const parsedAge = parseInt(age.trim(), 10);
    if (!age.trim() || isNaN(parsedAge) || parsedAge < 10 || parsedAge > 115) {
      setAuthError('Please enter a valid age between 10 and 115.');
      return;
    }

    // 4. Strict validation: Email Address
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    // 5. Strict validation: Password
    const trimmedPassword = password.trim();
    if (!trimmedPassword || trimmedPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    const formattedPhone = `+91 ${cleanPhone}`;

    const profile: UserProfileData = {
      name: trimmedName,
      age: parsedAge.toString(),
      email: trimmedEmail,
      phone: formattedPhone,
      photoUrl: photoUrl || '',
      role: selectedRole === 'COMMANDER' ? 'RESPONDER' : selectedRole,
    };

    if (rememberMe) {
      localStorage.setItem('aegis_user_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('aegis_user_profile');
    }

    onLoginSuccess(profile);
  };

  const isEmailValid = email.includes('@') && email.includes('.');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Brand Header */}
      <div className="mb-6 flex items-center gap-2.5">
        <AegisLogo className="w-9 h-9 rounded-xl shadow-md shadow-blue-500/20" />
        <div>
          <span className="text-2xl font-black text-slate-900 tracking-tight block leading-none">AEGIS</span>
          <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Emergency Management System</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* Left Side: Modern Flat Reception / Office Illustration */}
        <div className="lg:col-span-5 bg-gradient-to-br from-sky-50/70 via-blue-50/40 to-indigo-50/60 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-100">
          
          <div className="relative z-10">
            <span className="px-2.5 py-1 rounded-full bg-blue-100/80 text-blue-700 text-[10px] font-black uppercase tracking-wider">
              Official Access Portal
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
              Verified Emergency Coordination
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Manual authentication ensures accountability across citizen distress calls and emergency responder dispatches.
            </p>
          </div>

          {/* Flat Vector Illustration */}
          <div className="relative z-10 my-4 flex items-center justify-center">
            <svg
              viewBox="0 0 460 320"
              className="w-full max-w-[380px] h-auto drop-shadow-sm"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="30" y1="280" x2="430" y2="280" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="210" cy="110" r="14" fill="#FEF08A" opacity="0.7" stroke="#FACC15" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="110" cy="150" r="10" fill="#BAE6FD" opacity="0.6" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="340" cy="90" r="12" fill="#BAE6FD" opacity="0.6" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Citizen Avatar */}
              <circle cx="120" cy="115" r="18" fill="#FBBF24" />
              <path d="M106 115 C 106 100, 134 100, 134 115 C 134 110, 126 102, 116 105 Z" fill="#1E293B" />
              <rect x="117" y="132" width="6" height="8" fill="#FBBF24" />
              <path d="M96 140 L144 140 L138 215 L102 215 Z" fill="#F59E0B" />
              <path d="M138 148 L170 185 L190 188" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="190" cy="188" r="4" fill="#FBBF24" />
              <path d="M102 148 L86 195 L84 210" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
              <circle cx="84" cy="215" r="4" fill="#FBBF24" />
              <rect x="70" y="215" width="28" height="22" rx="3" fill="#F43F5E" />
              <path d="M78 215 L78 210 L90 210 L90 215" stroke="#E11D48" strokeWidth="2" />
              <line x1="112" y1="215" x2="108" y2="280" stroke="#3730A3" strokeWidth="9" strokeLinecap="round" />
              <line x1="128" y1="215" x2="132" y2="280" stroke="#3730A3" strokeWidth="9" strokeLinecap="round" />
              <rect x="96" y="278" width="16" height="6" rx="3" fill="#0F172A" />
              <rect x="128" y="278" width="16" height="6" rx="3" fill="#0F172A" />

              {/* Desk */}
              <rect x="165" y="190" width="180" height="90" rx="4" fill="#38BDF8" opacity="0.9" />
              <path d="M165 200 L345 200 L345 280 L165 280 Z" fill="#0284C7" />
              <polygon points="165,200 345,200 345,280 165,280" fill="#0EA5E9" opacity="0.3" />
              <rect x="160" y="186" width="190" height="7" rx="3.5" fill="#E2E8F0" />
              <polygon points="205,186 245,186 242,168 208,168" fill="#64748B" />
              <rect x="207" y="170" width="33" height="15" fill="#0284C7" />
              <rect x="198" y="186" width="54" height="2.5" rx="1" fill="#94A3B8" />

              {/* Dispatch Officer */}
              <circle cx="280" cy="135" r="16" fill="#FDE047" />
              <path d="M266 130 C 266 112, 294 112, 294 130 C 298 145, 296 160, 296 165 C 290 160, 288 145, 284 140 C 278 145, 274 158, 268 165 C 264 155, 264 140, 266 130 Z" fill="#4338CA" />
              <circle cx="276" cy="136" r="1.5" fill="#1E293B" />
              <circle cx="284" cy="136" r="1.5" fill="#1E293B" />
              <path d="M277 142 Q 280 145 283 142" stroke="#1E293B" strokeWidth="1" strokeLinecap="round" />
              <path d="M260 160 L300 160 L304 190 L256 190 Z" fill="#F472B6" />

              {/* Plants */}
              <polygon points="318,186 332,186 330,173 320,173" fill="#F43F5E" />
              <path d="M325 173 Q 320 160 318 152 Q 328 156 325 173" fill="#22C55E" />
              <polygon points="365,280 395,280 392,255 368,255" fill="#F59E0B" />
              <path d="M380 255 Q 380 200 376 170" stroke="#0284C7" strokeWidth="3" />
              <path d="M380 240 Q 360 220 355 195 Q 375 205 380 230" fill="#38BDF8" opacity="0.9" />
              <path d="M380 220 Q 405 200 412 175 Q 395 190 380 215" fill="#0EA5E9" />
            </svg>
          </div>

          <div className="relative z-10 text-[11px] text-slate-500 font-medium">
            Strict authentication enabled • Zero auto-generated profiles
          </div>
        </div>

        {/* Right Side: Clean Strict Manual Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
          
          <div className="mb-4">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              User Credential Authentication
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Please manually fill in your personal details, phone number, and credentials.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">

            {/* Full Name Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  required
                  placeholder="Type your full legal name"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-slate-900 font-medium transition"
                />
              </div>
            </div>

            {/* Mobile & Age Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mobile Number (+91) <span className="text-rose-500">*</span>
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition">
                  <span className="px-3 py-2.5 bg-slate-100 border-r border-slate-200 text-[11px] font-bold text-slate-700 select-none flex items-center">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    required
                    maxLength={10}
                    placeholder="10-digit number"
                    className="w-full px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Age <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    required
                    min={10}
                    max={115}
                    placeholder="e.g. 32"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-slate-900 font-medium transition"
                  />
                </div>
              </div>
            </div>

            {/* Email Address Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  required
                  placeholder="name@organization.com"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-slate-900 font-medium transition"
                />
                {isEmailValid && (
                  <div className="absolute right-3 top-2.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  required
                  placeholder="Enter your security password"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-slate-900 font-medium transition"
                />
              </div>
            </div>

            {/* System Role Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Select Your System Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedRole('CITIZEN')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                    selectedRole === 'CITIZEN'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-300 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Radio className={`w-5 h-5 ${selectedRole === 'CITIZEN' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-bold block">Citizen</span>
                    <span className="text-[10px] text-slate-500">SOS Distress Reports</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('RESPONDER')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                    selectedRole === 'RESPONDER'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-300 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Ambulance className={`w-5 h-5 ${selectedRole === 'RESPONDER' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-bold block">Responder</span>
                    <span className="text-[10px] text-slate-500">Fleet & Trauma Console</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Photo / ID Upload (Optional) & Remember Me */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded flex items-center justify-center transition ${
                    rememberMe ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-[11px] font-medium text-slate-600">Save login on this device</span>
              </label>

              <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer hover:text-blue-600 transition">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                <span>{photoUrl ? 'ID Photo Attached ✓' : 'Attach ID Photo (Optional)'}</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-login-submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                <span>Verify & Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};
