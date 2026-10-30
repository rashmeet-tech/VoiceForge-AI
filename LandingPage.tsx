import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  FlaskConical,
  MessageSquarePlus,
  Layers,
} from 'lucide-react';
import { WorkflowPipelinePreview } from '../../components/common/WorkflowPipelinePreview';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  const featureCards = [
    {
      titleKey: 'home.feature1Title',
      descKey: 'home.feature1Desc',
      icon: MessageSquarePlus,
      tagKey: 'home.feature1Tag',
    },
    {
      titleKey: 'home.feature2Title',
      descKey: 'home.feature2Desc',
      icon: FileCheck,
      tagKey: 'home.feature2Tag',
    },
    {
      titleKey: 'home.feature3Title',
      descKey: 'home.feature3Desc',
      icon: FlaskConical,
      tagKey: 'home.feature3Tag',
    },
    {
      titleKey: 'home.feature4Title',
      descKey: 'home.feature4Desc',
      icon: ShieldCheck,
      tagKey: 'home.feature4Tag',
    },
  ];

  const quickSteps = [
    {
      step: '01',
      titleKey: 'home.step1Title',
      descKey: 'home.step1Desc',
    },
    {
      step: '02',
      titleKey: 'home.step2Title',
      descKey: 'home.step2Desc',
    },
    {
      step: '03',
      titleKey: 'home.step3Title',
      descKey: 'home.step3Desc',
    },
    {
      step: '04',
      titleKey: 'home.step4Title',
      descKey: 'home.step4Desc',
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-aiLavender text-primary text-xs font-bold border border-primary/20 shadow-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-secondary" />
            <span>{t('home.badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-mainText tracking-tight leading-tight">
            {t('home.heroTitle')}
          </h1>

          <p className="text-base sm:text-lg text-mutedText max-w-2xl mx-auto leading-relaxed">
            {t('home.heroSubtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-95 shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{t('home.ctaPrimary')}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-mainText bg-white border border-borderMuted hover:border-primary shadow-sm hover:shadow-md transition-all"
            >
              <span>{t('home.ctaSecondary')}</span>
            </Link>
          </div>

          {/* Foundation feature pills */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-mutedText">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {t('home.pill1')}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {t('home.pill2')}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {t('home.pill3')}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Visual Workflow Pipeline Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <WorkflowPipelinePreview />
      </section>

      {/* 3. Feature Highlights Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="px-3 py-1 rounded-full bg-aiLavender text-primary text-xs font-bold uppercase tracking-wider">
            {t('home.featuresHeading')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-mainText tracking-tight">
            {t('home.featuresSubheading')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCards.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.titleKey}
                className="bg-card rounded-2xl p-6 border border-borderMuted shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-aiLavender text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-[#F4F5FB] px-2.5 py-0.5 rounded-full">
                      {t(feat.tagKey)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-mainText mb-2 group-hover:text-primary transition-colors">
                    {t(feat.titleKey)}
                  </h3>
                  <p className="text-xs text-mutedText leading-relaxed">
                    {t(feat.descKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-8">
          <Link
            to="/features"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover"
          >
            <span>{t('nav.features')} &rarr;</span>
          </Link>
        </div>
      </section>

      {/* 4. How It Works Quick Preview */}
      <section className="bg-white border-y border-borderMuted py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-aiLavender text-primary text-xs font-bold uppercase tracking-wider">
              {t('home.stepsHeading')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-mainText tracking-tight">
              {t('home.stepsSubheading')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickSteps.map((st) => (
              <div
                key={st.step}
                className="p-6 rounded-2xl bg-[#F7F8FC] border border-borderMuted space-y-3 relative"
              >
                <span className="text-3xl font-black text-secondary/30 font-mono block">
                  {st.step}
                </span>
                <h4 className="text-sm font-bold text-mainText">{t(st.titleKey)}</h4>
                <p className="text-xs text-mutedText leading-relaxed">{t(st.descKey)}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-mainText bg-white border border-borderMuted hover:border-primary shadow-sm transition-all"
            >
              <span>{t('nav.seeHowItWorks')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Call-to-Action Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-primary via-[#6763E5] to-secondary p-8 sm:p-14 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>{t('brand.name')}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {t('home.ctaBannerTitle')}
            </h2>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              {t('home.ctaBannerSubtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl bg-white text-primary font-bold text-sm text-center shadow-md hover:bg-slate-50 transition-colors"
            >
              {t('home.ctaBannerBtn')}
            </Link>
            <Link
              to="/faq"
              className="px-6 py-3.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm text-center backdrop-blur-md transition-colors"
            >
              {t('nav.faq')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
