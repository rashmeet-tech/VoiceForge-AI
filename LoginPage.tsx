import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mic2,
  ArrowRight,
  User,
  Building2,
  Info,
  LogOut,
} from 'lucide-react';
import { useDemoAuth } from '../../context/DemoAuthContext';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, login, logout } = useDemoAuth();

  const [displayName, setDisplayName] = useState<string>(user.name || 'Dr. Sarah Chen');
  const [businessName, setBusinessName] = useState<string>(user.businessName || 'Apex Dental Clinic');
  const [industry, setIndustry] = useState<string>(user.industry || 'Dental Healthcare');

  const presets = [
    {
      labelKey: 'login.presetDental',
      name: 'Dr. Sarah Chen',
      business: 'Apex Dental Clinic',
      industry: 'Dental Healthcare',
    },
    {
      labelKey: 'login.presetLaw',
      name: 'David Vance, Esq.',
      business: 'Vance & Associates Legal',
      industry: 'Legal Services',
    },
    {
      labelKey: 'login.presetAuto',
      name: 'Mike Kowalski',
      business: 'Precision Auto Works',
      industry: 'Automotive Services',
    },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setDisplayName(preset.name);
    setBusinessName(preset.business);
    setIndustry(preset.industry);
  };

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(displayName, businessName, industry);
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-card rounded-3xl p-6 sm:p-9 border border-borderMuted shadow-dropdown space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white mx-auto shadow-md shadow-primary/20">
            <Mic2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-mainText">
            {t('login.title')}
          </h2>
          <p className="text-xs sm:text-sm text-mutedText">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Clear Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">{t('login.demoNoticeTitle')}</p>
            <p className="leading-relaxed">
              {t('login.demoNoticeText')}
            </p>
          </div>
        </div>

        {/* Quick Demo Persona Presets */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">
            {t('login.presetsTitle')}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => (
              <button
                key={p.labelKey}
                type="button"
                onClick={() => applyPreset(p)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                  businessName === p.business
                    ? 'bg-aiLavender border-primary text-primary font-bold'
                    : 'bg-[#F9FAFC] border-borderMuted text-mainText hover:bg-white'
                }`}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleDemoLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-mainText flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>{t('login.displayNameLabel')}</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('login.displayNamePlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-borderMuted text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-mainText"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-mainText flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-secondary" />
              <span>{t('login.businessNameLabel')}</span>
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t('login.businessNamePlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-borderMuted text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-mainText"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-95 shadow-md shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('login.submitBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Current Active Session & Logout option */}
        {user.isLoggedIn && (
          <div className="pt-4 border-t border-borderMuted flex items-center justify-between text-xs text-mutedText">
            <span className="truncate">{t('login.currentSession')} <strong>{user.name}</strong></span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold text-xs ml-2 shrink-0"
            >
              <LogOut className="w-3 h-3" />
              <span>{t('login.resetSession')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
