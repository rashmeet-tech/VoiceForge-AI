import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  HelpCircle,
  Info,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FaqItem {
  id: string;
  category: 'Rulebooks' | 'Testing' | 'ElevenLabs' | 'Languages' | 'Deployment';
  question: string;
  answer: string;
  isImportant?: boolean;
}

export const FaqPage: React.FC = () => {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'rulebook-what': true,
    'elevenlabs-status': true,
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const faqs: FaqItem[] = [
    {
      id: 'rulebook-what',
      category: 'Rulebooks',
      question: 'What is a Business Rulebook, and why is it better than prompt engineering?',
      answer: 'Standard AI voice agents rely on loose system prompts (e.g. "Try to be helpful and give discounts reasonably"), which frequently cause hallucinations, unauthorized promises, and policy drift. A VoiceForge AI Business Rulebook decomposes policies into structured, numbered condition/action pairs (e.g., Rule R-03: IF cancellation is under 24 hours THEN charge $25). This makes agent behavior auditable, editable, and testable.',
      isImportant: true,
    },
    {
      id: 'elevenlabs-status',
      category: 'ElevenLabs',
      question: 'Is ElevenLabs integration live right now, or is it planned for Phase 2?',
      answer: 'Phase 1 (current Hackathon MVP) establishes the complete foundation: plain-language policy intake, editable rulebook architecture, persona configuration, simulation test runner, scorecards, critical-rule deployment gate, 6-language internationalization, and SQLite persistence. Real-time voice synthesis and telephony via ElevenLabs Conversational AI is architecturally prepared with clean seams and will be connected in Phase 2.',
      isImportant: true,
    },
    {
      id: 'testing-how',
      category: 'Testing',
      question: 'How does rule-based testing simulate customer conversations?',
      answer: 'VoiceForge AI runs automated simulation dialogues that challenge the agent with edge cases: callers requesting walk-in surgery, callers with after-hours medical emergencies, or callers pushing for forbidden price reductions. Each test checks whether the specific required Business Rule was triggered correctly.',
    },
    {
      id: 'critical-gate',
      category: 'Deployment',
      question: 'What is the Critical-Rule Deployment Gate?',
      answer: 'Certain business rules have severe legal, financial, or safety consequences (such as emergency triage numbers or price guarantees). When you mark a rule as "Critical", VoiceForge AI enforces a hard gate: 100% of adversarial simulations targeting that rule must pass with zero regressions before the production deployment button is unlocked.',
    },
    {
      id: 'languages-supported',
      category: 'Languages',
      question: 'Which languages are supported, and how is interface language separated from voice language?',
      answer: 'The website interface supports six languages: English, Hindi, Punjabi, Bengali, Tamil, and Hinglish, with instant local persistence. Crucially, the website interface language is isolated from agent conversation languages. An English-speaking manager can configure a Hindi or Punjabi voice receptionist without changing their own software dashboard.',
    },
    {
      id: 'database-privacy',
      category: 'Deployment',
      question: 'Where is our business data stored?',
      answer: 'VoiceForge AI uses local SQLite with Write-Ahead Logging (WAL) and clean repository data-access layers. Your business policies and test records stay private and run without complex cloud database dependencies during local evaluation.',
    },
    {
      id: 'refinement-process',
      category: 'Rulebooks',
      question: 'What happens if an agent fails a simulation test during review?',
      answer: 'You visit the Rule Refinement module (/app/refine/demo). The system analyzes the failed caller dialogue, identifies the ambiguous clause in the rule, and provides AI-guided wording improvements that you can apply with one click to retest immediately.',
    },
  ];

  const categories = [
    { id: 'All', labelKey: 'faqPage.categoryAll' },
    { id: 'Rulebooks', labelKey: 'faqPage.categoryRulebooks' },
    { id: 'Testing', labelKey: 'faqPage.categoryTesting' },
    { id: 'ElevenLabs', labelKey: 'faqPage.categoryElevenLabs' },
    { id: 'Languages', labelKey: 'faqPage.categoryLanguages' },
    { id: 'Deployment', labelKey: 'faqPage.categoryDeployment' },
  ];

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesQuery =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aiLavender text-primary text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t('faqPage.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-mainText tracking-tight">
          {t('faqPage.title')}
        </h1>
        <p className="text-mutedText text-base sm:text-lg max-w-2xl mx-auto">
          {t('faqPage.subtitle')}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('faqPage.searchPlaceholder')}
            className="w-full px-4 py-3 pl-10 rounded-2xl border border-borderMuted text-xs sm:text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-mainText"
          />
          <Search className="w-4 h-4 text-mutedText absolute left-3.5 top-3.5" />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-borderMuted text-mainText hover:bg-[#F3F4F8]'
              }`}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-borderMuted p-6">
            <p className="text-sm font-semibold text-mainText">No matching questions found.</p>
            <p className="text-xs text-mutedText mt-1">Try searching for keywords like "rules", "testing", or "ElevenLabs".</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = !!openItems[faq.id];
            return (
              <div
                key={faq.id}
                className={`bg-card rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'border-primary/40 shadow-sm'
                    : 'border-borderMuted hover:border-primary/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-primary bg-aiLavender px-2 py-0.5 rounded">
                      {faq.category}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-mainText">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-mutedText shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-mutedText leading-relaxed border-t border-borderMuted/60 bg-[#FAFAFE] animate-in fade-in duration-150">
                    <p className="pt-2">{faq.answer}</p>
                    {faq.category === 'ElevenLabs' && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                        <Info className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Integration Notice: ElevenLabs bindings will be connected in Phase 2.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom CTA */}
      <div className="p-6 rounded-3xl bg-white border border-borderMuted text-center space-y-3">
        <h3 className="text-base font-bold text-mainText">{t('home.ctaBannerTitle')}</h3>
        <p className="text-xs text-mutedText">
          {t('home.ctaBannerSubtitle')}
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-sm transition-all"
        >
          <span>{t('home.ctaBannerBtn')}</span>
        </Link>
      </div>
    </div>
  );
};
