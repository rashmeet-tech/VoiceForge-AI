export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  database: 'connected' | 'disconnected' | 'error';
}

export interface Agent {
  id: string;
  name: string;
  business_name: string;
  business_type: string;
  description: string;
  purpose: string;
  greeting: string;
  tone: string;
  supported_languages: string; // JSON string e.g. '["en","hi"]'
  primary_language: string;
  voice_id?: string | null;
  elevenlabs_agent_id?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Rulebook {
  id: string;
  agent_id: string;
  version: number;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Rule {
  id: string;
  rulebook_id: string;
  rule_number: number;
  title: string;
  condition_text: string;
  action_text: string;
  is_critical: number; // 0 or 1
  category: string;
  status: string; // 'draft' | 'approved' | 'active'
  created_at: string;
  updated_at: string;
}

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs?: number;
}

const DEFAULT_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

export class ApiClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config?: Partial<ApiClientConfig>) {
    this.baseUrl = config?.baseUrl || DEFAULT_BASE_URL;
    this.timeoutMs = config?.timeoutMs || 8000;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        let errMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData?.error?.message) {
            errMessage = errData.error.message;
          }
        } catch {
          // Response body was not JSON
        }
        throw new Error(errMessage);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Health check endpoint
   */
  public async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // --- Agents API ---

  public async listAgents(): Promise<{ success: boolean; data: Agent[] }> {
    return this.request<{ success: boolean; data: Agent[] }>('/agents');
  }

  public async getAgent(id: string): Promise<{ success: boolean; data: Agent }> {
    return this.request<{ success: boolean; data: Agent }>(`/agents/${id}`);
  }

  public async createAgent(data: {
    businessName: string;
    businessType?: string;
    description: string;
    purpose?: string;
    name?: string;
    greeting?: string;
    tone?: string;
    supportedLanguages?: string[];
  }): Promise<{ success: boolean; data: Agent; message?: string }> {
    return this.request<{ success: boolean; data: Agent; message?: string }>('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateAgent(
    id: string,
    updates: {
      name?: string;
      greeting?: string;
      tone?: string;
      purpose?: string;
      supportedLanguages?: string[];
      elevenlabsAgentId?: string;
      status?: string;
    }
  ): Promise<{ success: boolean; data: Agent; message?: string }> {
    return this.request<{ success: boolean; data: Agent; message?: string }>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async generateRulebook(agentId: string): Promise<{
    success: boolean;
    data: { rulebook: Rulebook; rules: Rule[] };
    meta?: { generatorType: string; disclaimer: string };
  }> {
    return this.request<{
      success: boolean;
      data: { rulebook: Rulebook; rules: Rule[] };
      meta?: { generatorType: string; disclaimer: string };
    }>(`/agents/${agentId}/generate-rulebook`, {
      method: 'POST',
    });
  }

  // --- Rulebooks & Rules API ---

  public async getRulebook(rulebookId: string): Promise<{
    success: boolean;
    data: { rulebook: Rulebook; rules: Rule[]; agent?: Agent };
  }> {
    return this.request<{
      success: boolean;
      data: { rulebook: Rulebook; rules: Rule[]; agent?: Agent };
    }>(`/rulebooks/${rulebookId}`);
  }

  public async getRulebooksForAgent(agentId: string): Promise<{
    success: boolean;
    data: Rulebook[];
  }> {
    return this.request<{ success: boolean; data: Rulebook[] }>(`/rulebooks/agent/${agentId}`);
  }

  public async addRule(
    rulebookId: string,
    rule: {
      ruleNumber?: number;
      title: string;
      conditionText: string;
      actionText: string;
      isCritical?: boolean;
      category?: string;
    }
  ): Promise<{ success: boolean; data: Rule; message?: string }> {
    return this.request<{ success: boolean; data: Rule; message?: string }>(`/rulebooks/${rulebookId}/rules`, {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  public async updateRule(
    ruleId: string,
    updates: {
      title?: string;
      conditionText?: string;
      actionText?: string;
      isCritical?: boolean;
      category?: string;
      status?: string;
    }
  ): Promise<{ success: boolean; data: Rule; message?: string }> {
    return this.request<{ success: boolean; data: Rule; message?: string }>(`/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async deleteRule(ruleId: string): Promise<{
    success: boolean;
    data: { id: string; deleted: boolean };
    message?: string;
  }> {
    return this.request<{
      success: boolean;
      data: { id: string; deleted: boolean };
      message?: string;
    }>(`/rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  public async approveRulebook(rulebookId: string): Promise<{
    success: boolean;
    data: { rulebook: Rulebook; rules: Rule[] };
    message?: string;
  }> {
    return this.request<{
      success: boolean;
      data: { rulebook: Rulebook; rules: Rule[] };
      message?: string;
    }>(`/rulebooks/${rulebookId}/approve`, {
      method: 'POST',
    });
  }

  // --- Testing, Simulation, Scorecard & Deployment Gate API ---

  public async generateTestCases(rulebookId: string): Promise<{
    success: boolean;
    data: TestCase[];
    meta?: { count: number; disclaimer: string };
  }> {
    return this.request<{
      success: boolean;
      data: TestCase[];
      meta?: { count: number; disclaimer: string };
    }>(`/testing/${rulebookId}/generate`, {
      method: 'POST',
    });
  }

  public async getTestCases(rulebookId: string): Promise<{
    success: boolean;
    data: TestCase[];
    meta?: { count: number };
  }> {
    return this.request<{
      success: boolean;
      data: TestCase[];
      meta?: { count: number };
    }>(`/testing/${rulebookId}/cases`);
  }

  public async runSimulatedTests(
    rulebookId: string,
    testCaseId?: string
  ): Promise<{
    success: boolean;
    data: {
      testRun: TestRun;
      testCases: TestCase[];
      scorecard: ScorecardMetrics;
    };
    message?: string;
  }> {
    return this.request<{
      success: boolean;
      data: {
        testRun: TestRun;
        testCases: TestCase[];
        scorecard: ScorecardMetrics;
      };
      message?: string;
    }>(`/testing/${rulebookId}/run`, {
      method: 'POST',
      body: JSON.stringify(testCaseId ? { testCaseId } : {}),
    });
  }

  public async getLatestTestRun(rulebookId: string): Promise<{
    success: boolean;
    data: {
      testRun: TestRun | null;
      testCases: TestCase[];
      scorecard: ScorecardMetrics;
    };
  }> {
    return this.request<{
      success: boolean;
      data: {
        testRun: TestRun | null;
        testCases: TestCase[];
        scorecard: ScorecardMetrics;
      };
    }>(`/testing/${rulebookId}/latest`);
  }

  public async getTestHistory(rulebookId: string): Promise<{
    success: boolean;
    data: TestRun[];
  }> {
    return this.request<{
      success: boolean;
      data: TestRun[];
    }>(`/testing/${rulebookId}/history`);
  }

  public async refineRule(
    rulebookId: string,
    payload: {
      ruleId: string;
      title?: string;
      conditionText?: string;
      actionText?: string;
      isCritical?: boolean;
    }
  ): Promise<{
    success: boolean;
    data: {
      rule: Rule;
      rulebook: Rulebook;
    };
    message?: string;
  }> {
    return this.request<{
      success: boolean;
      data: {
        rule: Rule;
        rulebook: Rulebook;
      };
      message?: string;
    }>(`/testing/${rulebookId}/refine`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getScorecard(rulebookId: string): Promise<{
    success: boolean;
    data: ScorecardMetrics;
  }> {
    const res = await this.getLatestTestRun(rulebookId);
    const scorecard = res.data.scorecard;
    return {
      success: res.success,
      data: {
        ...scorecard,
        gateEligible: scorecard.criticalFailed === 0 && scorecard.totalTests > 0,
      },
    };
  }

  public async getDeploymentGateStatus(rulebookId: string): Promise<{
    success: boolean;
    data: DeploymentGateStatus;
  }> {
    return this.request<{
      success: boolean;
      data: DeploymentGateStatus;
    }>(`/deploy-gate/${rulebookId}/status`);
  }

  public async checkDeploymentGate(rulebookId: string): Promise<{
    success: boolean;
    data: DeploymentGateStatus;
  }> {
    return this.getDeploymentGateStatus(rulebookId);
  }

  // --- ElevenLabs Conversational AI Integration API ---

  public async getElevenLabsStatus(): Promise<{
    success: boolean;
    data: ElevenLabsStatus;
  }> {
    return this.request<{
      success: boolean;
      data: ElevenLabsStatus;
    }>('/elevenlabs/status');
  }

  public async getElevenLabsInspection(agentId?: string): Promise<{
    success: boolean;
    data: ElevenLabsInspection;
  }> {
    const query = agentId ? `?agentId=${encodeURIComponent(agentId)}` : '';
    return this.request<{
      success: boolean;
      data: ElevenLabsInspection;
    }>(`/elevenlabs/inspect${query}`);
  }

  public async getElevenLabsSignedUrl(agentId?: string): Promise<{
    success: boolean;
    data: { signedUrl: string; agentId: string };
    message?: string;
  }> {
    return this.request<{
      success: boolean;
      data: { signedUrl: string; agentId: string };
      message?: string;
    }>('/elevenlabs/signed-url', {
      method: 'POST',
      body: JSON.stringify(agentId ? { agentId } : {}),
    });
  }

  public async syncRulesToElevenLabs(
    rulebookId: string,
    agentId?: string
  ): Promise<{
    success: boolean;
    data: ElevenLabsSyncResult;
    message?: string;
  }> {
    return this.request<{
      success: boolean;
      data: ElevenLabsSyncResult;
      message?: string;
    }>(`/elevenlabs/sync-rules/${rulebookId}`, {
      method: 'POST',
      body: JSON.stringify(agentId ? { agentId } : {}),
    });
  }

  public async getElevenLabsRuleSnippet(rulebookId: string): Promise<{
    success: boolean;
    data: {
      snippet: string;
      version: number;
      rulesCount: number;
      rulebookName: string;
    };
  }> {
    return this.request<{
      success: boolean;
      data: {
        snippet: string;
        version: number;
        rulesCount: number;
        rulebookName: string;
      };
    }>(`/elevenlabs/rules-snippet/${rulebookId}`);
  }
}

export interface TestCase {
  id: string;
  rulebook_id: string;
  rule_id: string | null;
  rule_number: number | null;
  rule_ref: string | null;
  title: string;
  category: string;
  customer_utterance: string;
  expected_behavior: string;
  simulated_response: string | null;
  result: 'pass' | 'fail' | 'pending';
  explanation: string | null;
  is_critical: number;
  created_at: string;
  updated_at: string;
}

export interface TestRun {
  id: string;
  agent_id: string;
  rulebook_id: string;
  rulebook_version: number;
  status: 'passed' | 'failed' | 'pending';
  score: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  critical_total: number;
  critical_passed: number;
  critical_failed: number;
  overall_compliance: number;
  critical_compliance: number;
  details_json: string | null;
  created_at: string;
}

export interface ScorecardMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  overallCompliance: number;
  criticalTotal: number;
  criticalPassed: number;
  criticalFailed: number;
  criticalCompliance: number;
  gateEligible?: boolean;
  ruleBreakdown: Array<{
    ruleId: string | null;
    ruleRef: string;
    ruleNumber: number;
    title: string;
    isCritical: boolean;
    testsCount: number;
    passCount: number;
    failCount: number;
    status: 'pass' | 'fail';
  }>;
  failedRules: Array<{
    ruleId: string | null;
    ruleRef: string;
    ruleNumber: number;
    title: string;
    isCritical: boolean;
    customerUtterance: string;
    expectedBehavior: string;
    simulatedResponse: string;
    violationExplanation: string;
    recommendation: string;
  }>;
}

export interface DeploymentGateStatus {
  status: 'READY_FOR_ELEVENLABS_INTEGRATION' | 'BLOCKED';
  ready: boolean;
  agentExists: boolean;
  rulebookExists: boolean;
  rulebookApproved: boolean;
  rulebookVersion: number;
  latestRunVersion: number | null;
  versionMatches: boolean;
  criticalTestsPassed: boolean;
  criticalCompliance: number;
  overallCompliance: number;
  checks: Array<{
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }>;
  blockers: string[];
  disclaimer: string;
}

export interface ElevenLabsStatus {
  apiKeyConfigured: boolean;
  defaultAgentIdConfigured: boolean;
  configuredAgentId: string | null;
  activeDatabaseAgentId: string | null;
  activeDatabaseAgentName: string | null;
  syncStatus: 'synced' | 'pending' | 'manual_sync_required' | 'not_configured';
  syncedVersion: number | null;
  syncedAt: string | null;
}

export interface ElevenLabsInspection {
  agentId: string;
  exists: boolean;
  name?: string;
  language?: string;
  voiceId?: string;
  firstMessage?: string;
  llmModel?: string;
  promptLength?: number;
  promptPreview?: string;
  hasVoiceForgeRules: boolean;
  voiceForgeRulesVersion?: number | null;
  toolsCount: number;
  tools: Array<{ id: string; name?: string; type?: string }>;
  knowledgeBaseCount: number;
  knowledgeBaseDocs: Array<{ id: string; name?: string; type?: string }>;
  guardrailStatus: 'active' | 'missing' | 'unknown';
  diagnostics: Array<{
    category: 'knowledge_base' | 'tools' | 'guardrails' | 'prompt' | 'credentials';
    level: 'ok' | 'warning' | 'info';
    message: string;
    actionableAdvice: string;
  }>;
}

export interface ElevenLabsSyncResult {
  success: boolean;
  synced: boolean;
  pendingManualSync?: boolean;
  version: number;
  rulesCount: number;
  agentId: string;
  promptSnippet: string;
  message: string;
}

// Export default singleton instance
export const api = new ApiClient();

