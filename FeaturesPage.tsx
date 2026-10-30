import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Bot,
  FlaskConical,
  BarChart3,
  Wand2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const { t } = useTranslation();

  const featureSections = [
    {
      id: 'plain-input',
      titleKey: 'featuresPage.section1Title',
      badgeKey: 'featuresPage.section1Badge',
      icon: MessageSquare,
      summaryKey: 'featuresPage.section1Summary',
      points: [
        'Type or dictate operational rules, service hours, cancellation windows, and escalation procedures.',
        'No prompt engineering syntax, JSON structures, or developer jargon required.',
        'Accepts multi-paragraph policy narratives and automatically breaks them into discrete logic clauses.',
      ],
      sample: 'Example: "Our clinic is open Mon-Fri 9am to 6pm. We do not do walk-in root canals. Emergencies after hours go to doctor at 555-0199."',
    },
    {
      id: 'rulebook',
      titleKey: 'featuresPage.section2Title',
      badgeKey: 'featuresPage.section2Badge',
      icon: FileText,
      summaryKey: 'featuresPage.section2Summary',
      points: [
        'Structured condition (IF) and action (THEN) schema for every operational boundary.',
        'Explicit rule numbering (R-01, R-02, R-03) and categorization (Billing, Safety, Scheduling).',
        'Toggle high-liability rules as "Critical" to require mandatory test verification before deployment.',
      ],
      sample: 'Rule R-02 (Critical): IF caller exhibits severe dental trauma THEN immediately transfer/direct to on-call surgeon.',
    },
    {
      id: 'agent-config',
      titleKey: 'featuresPage.section3Title',
      badgeKey: 'featuresPage.section3Badge',
      icon: Bot,
      summaryKey: 'featuresPage.section3Summary',
      points: [
        'Select persona profiles tailored for healthcare, legal, retail, or field service receptionists.',
        'Configure conversational pacing, empathy parameters, and response conciseness.',
        'Designed specifically for Phase 2 ElevenLabs Conversational Voice Agent integration without frontend API key leakage.',
      ],
      sample: 'Configuration: Sarah • Warm Dental Receptionist • 1.0x Pace • English (US)',
    },
    {
      id: 'testing',
      titleKey: 'featuresPage.section4Title',
      badgeKey: 'featuresPage.section4Badge',
      icon: FlaskConical,
      summaryKey: 'featuresPage.section4Summary',
      points: [
        'Simulate demanding callers attempting to bargain prices below your authorized limit.',
        'Evaluate urgent after-hours emergency calls to ensure triage procedures execute flawlessly.',
        'Verify that cancellation policies and fees are properly communicated without agent concessions.',
      ],
      sample: 'Test Case TC-04: Adversarial caller demands non-refundable surgical fee waiver over the phone.',
    },
    {
      id: 'scorecard',
      titleKey: 'featuresPage.section5Title',
      badgeKey: 'featuresPage.section5Badge',
      icon: BarChart3,
      summaryKey: 'featuresPage.section5Summary',
      points: [
        'Rule-by-rule pass rates identifying exactly where the agent complied or deviated.',
        'Distinct scorecard segregation between general policy rules and critical safety rules.',
        'Exportable audit trails for stakeholder verification and quality assurance.',
      ],
      sample: 'Current Suite Score: 96.4% Overall Adherence • 100% Critical Rules Passed',
    },
    {
      id: 'refine',
      titleKey: 'featuresPage.section6Title',
      badgeKey: 'featuresPage.section6Badge',
      icon: Wand2,
      summaryKey: 'featuresPage.section6Summary',
      points: [
        'Instantly view why a simulated call failed compliance criteria.',
        'Receive AI suggestions to eliminate ambiguity in condition or action wording.',
        'One-click re-testing to immediately confirm that the refinement fixed the regression.',
      ],
      sample: 'Refinement: Clarified medical emergency exception criteria for cancellation fee waivers.',
    },
    {
      id: 'deploy-gate',
      titleKey: 'featuresPage.section7Title',
      badgeKey: 'featuresPage.section7Badge',
      icon: ShieldAlert,
      summaryKey: 'featuresPage.section7Summary',
      points: [
        'Protects small businesses against liability, rogue hallucinated quotes, and safety violations.',
        'Binary gate locks production release until all critical tests pass without exception.',
        'Eliminates the fear of unpredictable LLM drift in live customer-facing phone calls.',
      ],
      sample: 'Gate Status: UNLOCKED (2/2 Critical Rules Validated • 0 Regressions)',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aiLavender text-primary text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('featuresPage.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-mainText tracking-tight">
          {t('featuresPage.title')}
        </h1>
        <p className="text-mutedText text-base sm:text-lg leading-relaxed">
          {t('featuresPage.subtitle')}
        </p>
      </div>

      {/* Explicit Architecture Disclaimer Notice */}
      <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3.5 shadow-sm">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-amber-950 text-sm">
            {t('login.demoNoticeTitle')}
          </p>
          <p className="leading-relaxed">
            {t('home.heroSubtitle')}
          </p>
        </div>
      </div>

      {/* Feature Deep Dive Sections */}
      <div className="space-y-10 max-w-5xl mx-auto">
        {featureSections.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={f.id}
              className="bg-card rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-card hover:shadow-card-hover transition-all"
            >
              <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-aiLavender text-primary flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-primary bg-[#F4F5FB] px-3 py-1 rounded-full">
                      {t(f.badgeKey)}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-mainText">
                    {t(f.titleKey)}
                  </h3>

                  <p className="text-sm text-mutedText leading-relaxed">
                    {t(f.summaryKey)}
                  </p>

                  <ul className="space-y-2 pt-2 text-xs text-mainText">
                    {f.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual Sample Card */}
                <div className="w-full lg:w-80 shrink-0 p-4 sm:p-5 rounded-2xl bg-[#F8F9FD] border border-borderMuted space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-mutedText uppercase tracking-wider">
                    <span>{t('common.status')}</span>
                    <span className="text-primary font-mono">{t('pipeline.step')} {idx + 1}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-borderMuted/80 text-xs font-mono text-mainText leading-relaxed shadow-sm">
                    {f.sample}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA Banner */}
      <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-primary to-secondary p-8 text-white text-center space-y-4 shadow-lg">
        <h3 className="text-2xl font-extrabold tracking-tight">
          {t('home.ctaBannerTitle')}
        </h3>
        <p className="text-sm text-white/80 max-w-xl mx-auto">
          {t('home.ctaBannerSubtitle')}
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary font-bold text-sm shadow-md hover:bg-slate-50 transition-colors"
          >
            <span>{t('home.ctaBannerBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
