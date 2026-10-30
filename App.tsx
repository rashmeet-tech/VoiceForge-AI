import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from './components/layouts/PublicLayout';
import { AppLayout } from './components/layouts/AppLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { FaqPage } from './pages/public/FaqPage';
import { LoginPage } from './pages/public/LoginPage';

// Application Pages
import { DashboardPage } from './pages/app/DashboardPage';
import { CreateAgentPage } from './pages/app/CreateAgentPage';
import { RulebookDemoPage } from './pages/app/RulebookDemoPage';
import { AgentStudioPage } from './pages/app/AgentStudioPage';
import { TestingDemoPage } from './pages/app/TestingDemoPage';
import { ScorecardDemoPage } from './pages/app/ScorecardDemoPage';
import { RefineDemoPage } from './pages/app/RefineDemoPage';
import { DeployGateDemoPage } from './pages/app/DeployGateDemoPage';
import { SettingsPage } from './pages/app/SettingsPage';
import { ElevenLabsVoiceCallModal } from './components/voice/ElevenLabsVoiceCallModal';

export const App: React.FC = () => {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Application Routes */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="create-agent" element={<CreateAgentPage />} />
          <Route path="rulebook/demo" element={<RulebookDemoPage />} />
          <Route path="rulebook/:rulebookId" element={<RulebookDemoPage />} />
          <Route path="agent/demo" element={<AgentStudioPage />} />
          <Route path="agent/:agentId" element={<AgentStudioPage />} />
          <Route path="testing/demo" element={<TestingDemoPage />} />
          <Route path="testing/:rulebookId" element={<TestingDemoPage />} />
          <Route path="scorecard/demo" element={<ScorecardDemoPage />} />
          <Route path="scorecard/:rulebookId" element={<ScorecardDemoPage />} />
          <Route path="refine/demo" element={<RefineDemoPage />} />
          <Route path="refine/:rulebookId" element={<RefineDemoPage />} />
          <Route path="deploy/demo" element={<DeployGateDemoPage />} />
          <Route path="deploy/:rulebookId" element={<DeployGateDemoPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global ElevenLabs Conversational Voice Call Modal */}
      <ElevenLabsVoiceCallModal />
    </>
  );
};

export default App;
