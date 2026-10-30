import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  FileText,
  CheckSquare,
  Bot,
  FlaskConical,
  BarChart3,
  Wand2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const steps = [
    {
      step: '01',
      titleKey: 'howItWorksPage.step1Title',
      subtitleKey: 'howItWorksPage.step1Sub',
      icon: MessageSquare,
      descKey: 'howItWorksPage.step1Desc',
      example: 'User Input: "We are an appointment-based clinic open Mon-Fri 9-6. Cancelation fee is $25 if under 24 hours. Emergency calls after hours must go to Dr. Smith at 555-0199."',
      outcome: 'Natural language raw context captured and pre-processed.',
    },
    {
      step: '02',
      titleKey: 'howItWorksPage.step2Title',
      subtitleKey: 'howItWorksPage.step2Sub',
      icon: FileText,
      descKey: 'howItWorksPage.step2Desc',
      example: 'Parsed Rules: R-01 (Hours & Booking), R-02 (Emergency Referral), R-03 (Late Cancellation Billing).',
      outcome: 'Explicit, auditable rulebook replacing fuzzy prompt instructions.',
    },
    {
      step: '03',
      titleKey: 'howItWorksPage.step3Title',
      subtitleKey: 'howItWorksPage.step3Sub',
      icon: CheckSquare,
      descKey: 'howItWorksPage.step3Desc',
      example: 'Action: Tagged R-02 (Emergency Triage) as CRITICAL to mandate 100% test pass rate.',
      outcome: 'Business owner full control and validation.',
    },
    {
      step: '04',
      titleKey: 'howItWorksPage.step4Title',
      subtitleKey: 'howItWorksPage.step4Sub',
      icon: Bot,
      descKey: 'howItWorksPage.step4Desc',
      example: 'Persona Profile: "Sarah" • Professional healthcare receptionist • 1.0x cadence.',
      outcome: 'Configured voice assistant persona ready for evaluation.',
    },
    {
      step: '05',
      titleKey: 'howItWorksPage.step5Title',
      subtitleKey: 'howItWorksPage.step5Sub',
      icon: FlaskConical,
      descKey: 'howItWorksPage.step5Desc',
      example: 'Simulation: Caller tries to negotiate a discount on urgent root canal at 9pm.',
      outcome: 'Simulation run across 4 test scenarios assessing rule compliance.',
    },
    {
      step: '06',
      titleKey: 'howItWorksPage.step6Title',
      subtitleKey: 'howItWorksPage.step6Sub',
      icon: BarChart3,
      descKey: 'howItWorksPage.step6Desc',
      example: 'Metrics: 4/4 Tests Evaluated • 100% Critical Rules Cleared • 96.4% Overall Score.',
      outcome: 'Clear pass/fail transparency before customer exposure.',
    },
    {
      step: '07',
      titleKey: 'howItWorksPage.step7Title',
      subtitleKey: 'howItWorksPage.step7Sub',
      icon: Wand2,
      descKey: 'howItWorksPage.step7Desc',
      example: 'Refinement: Wording updated to explicitly distinguish medical emergencies from voluntary cancellations.',
      outcome: 'Regressions eliminated and rules fortified.',
    },
    {
      step: '08',
      titleKey: 'howItWorksPage.step8Title',
      subtitleKey: 'howItWorksPage.step8Sub',
      icon: ShieldCheck,
      descKey: 'howItWorksPage.step8Desc',
      example: 'Gate Check: Zero regressions on critical rules R-02 and R-04 &rarr; GATE UNLOCKED.',
      outcome: 'Safe, verified voice agent ready for production phone lines.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aiLavender text-primary text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('howItWorksPage.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-mainText tracking-tight">
          {t('howItWorksPage.title')}
        </h1>
        <p className="text-mutedText text-base sm:text-lg leading-relaxed">
          {t('howItWorksPage.subtitle')}
        </p>
      </div>

      {/* Horizontal Step Navigation Bar */}
      <div className="bg-white p-3 rounded-2xl border border-borderMuted shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {steps.map((s, idx) => {
            const isActive = activeStepIndex === idx;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStepIndex(idx)}
                className={`flex-1 px-3 py-2.5 rounded-xl text-center transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-sm'
                    : 'text-mainText hover:bg-[#F3F4F8]'
                }`}
              >
                <div className="text-[10px] uppercase font-mono tracking-wider opacity-80">
                  {t('pipeline.step')} {s.step}
                </div>
                <div className="text-xs font-bold truncate">{t(s.titleKey)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Active Step Spotlight */}
      <div className="bg-card rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-card">
        {(() => {
          const current = steps[activeStepIndex];
          const Icon = current.icon;
          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-borderMuted pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-aiLavender text-primary flex items-center justify-center font-bold">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-secondary uppercase">
                      {t('pipeline.step')} {current.step} / 08
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-mainText">
                      {t(current.titleKey)} — {t(current.subtitleKey)}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={activeStepIndex === 0}
                    onClick={() => setActiveStepIndex(activeStepIndex - 1)}
                    className="px-3 py-1.5 rounded-lg border border-borderMuted text-xs font-semibold text-mainText disabled:opacity-40 hover:bg-[#F9FAFC]"
                  >
                    {t('common.back')}
                  </button>
                  <button
                    disabled={activeStepIndex === steps.length - 1}
                    onClick={() => setActiveStepIndex(activeStepIndex + 1)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-40 hover:bg-primary-hover"
                  >
                    {t('common.next')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-mutedText uppercase tracking-wider">
                    {t('featuresPage.badge')}
                  </h4>
                  <p className="text-sm text-mainText leading-relaxed">
                    {t(current.descKey)}
                  </p>
                  <div className="p-3 rounded-xl bg-successBg border border-[#C6EFDC] text-xs text-successText font-medium">
                    <strong>{t('common.status')}:</strong> {current.outcome}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-mutedText uppercase tracking-wider">
                    Live Demo Scenario
                  </h4>
                  <div className="p-4 rounded-xl bg-[#F9FAFC] border border-borderMuted text-xs font-mono text-mainText leading-relaxed space-y-2">
                    <div className="text-[10px] uppercase font-bold text-secondary">
                      Apex Dental Demonstration
                    </div>
                    <div>{current.example}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Grid of All 8 Steps */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-mainText text-center">
          {t('howItWorksPage.title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((st, i) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                onClick={() => setActiveStepIndex(i)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  activeStepIndex === i
                    ? 'bg-aiLavender/40 border-primary shadow-sm'
                    : 'bg-card border-borderMuted hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm font-black text-secondary">
                    {st.step}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-aiLavender text-primary flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-mainText mb-1">{t(st.titleKey)}</h4>
                <p className="text-xs text-mutedText leading-relaxed line-clamp-3">
                  {t(st.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="text-center pt-6 space-y-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-secondary shadow-md hover:opacity-95 transition-all"
        >
          <span>{t('home.ctaBannerBtn')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
