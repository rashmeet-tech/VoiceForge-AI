import { config } from '../config/index.js';
import { agentRepository, rulebookRepository, ruleRepository } from '../repositories/index.js';
import { findRulebookFlexible, simulationService } from './simulation.service.js';

export interface ElevenLabsStatusResponse {
  apiKeyConfigured: boolean;
  defaultAgentIdConfigured: boolean;
  configuredAgentId: string | null;
  activeDatabaseAgentId: string | null;
  activeDatabaseAgentName: string | null;
  syncStatus: 'synced' | 'pending' | 'manual_sync_required' | 'not_configured';
  syncedVersion: number | null;
  syncedAt: string | null;
}

export interface ElevenLabsAgentInspection {
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

export class ElevenLabsService {
  /**
   * Resolve target ElevenLabs agent ID from parameter, SQLite, or config
   */
  public resolveAgentId(customAgentId?: string): string | null {
    if (customAgentId && customAgentId.trim()) {
      return customAgentId.trim();
    }
    if (config.elevenlabsAgentId && config.elevenlabsAgentId.trim()) {
      return config.elevenlabsAgentId.trim();
    }
    const agents = agentRepository.findAll();
    const match = agents.find((a) => a.elevenlabs_agent_id && a.elevenlabs_agent_id.trim());
    return match?.elevenlabs_agent_id || null;
  }

  /**
   * Get basic backend integration status
   */
  public getStatus(): ElevenLabsStatusResponse {
    const agents = agentRepository.findAll();
    const primaryAgent = agents[0] || null;

    let syncStatus: ElevenLabsStatusResponse['syncStatus'] = 'not_configured';
    if (primaryAgent?.elevenlabs_sync_status) {
      syncStatus = primaryAgent.elevenlabs_sync_status as ElevenLabsStatusResponse['syncStatus'];
    }

    return {
      apiKeyConfigured: Boolean(config.elevenlabsApiKey && config.elevenlabsApiKey.trim().length > 5),
      defaultAgentIdConfigured: Boolean(config.elevenlabsAgentId && config.elevenlabsAgentId.trim().length > 3),
      configuredAgentId: config.elevenlabsAgentId || null,
      activeDatabaseAgentId: primaryAgent?.elevenlabs_agent_id || null,
      activeDatabaseAgentName: primaryAgent?.name || null,
      syncStatus,
      syncedVersion: primaryAgent?.elevenlabs_synced_version || null,
      syncedAt: primaryAgent?.elevenlabs_synced_at || null,
    };
  }

  /**
   * Generate a secure, short-lived signed WebSocket URL from ElevenLabs API
   * without exposing the API key to the client browser.
   */
  public async getSignedUrl(customAgentId?: string): Promise<{ signedUrl: string; agentId: string }> {
    const agentId = this.resolveAgentId(customAgentId);

    if (!agentId) {
      throw new Error(
        'No ElevenLabs Agent ID found. Please set ELEVENLABS_AGENT_ID in backend/.env or configure it in Agent Studio.'
      );
    }

    if (!config.elevenlabsApiKey || !config.elevenlabsApiKey.trim()) {
      throw new Error(
        'ELEVENLABS_API_KEY is not configured in backend/.env. To start authenticated voice calls with private agents, add your ElevenLabs API key.'
      );
    }

    const endpoint = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(
      agentId
    )}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'xi-api-key': config.elevenlabsApiKey.trim(),
      },
    });

    if (!response.ok) {
      let errDetail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errJson = (await response.json()) as { detail?: { message?: string } | string; message?: string };
        if (typeof errJson.detail === 'string') {
          errDetail = errJson.detail;
        } else if (errJson.detail?.message) {
          errDetail = errJson.detail.message;
        } else if (errJson.message) {
          errDetail = errJson.message;
        }
      } catch {
        // Not JSON
      }

      if (response.status === 401) {
        throw new Error(`ElevenLabs Authentication Failed: Invalid API Key (${errDetail})`);
      } else if (response.status === 404) {
        throw new Error(`ElevenLabs Agent Not Found: Agent ID "${agentId}" was not found in your ElevenLabs account.`);
      } else {
        throw new Error(`ElevenLabs API Error: ${errDetail}`);
      }
    }

    const data = (await response.json()) as { signed_url: string };
    if (!data.signed_url) {
      throw new Error('ElevenLabs API response did not contain a signed_url property.');
    }

    return {
      signedUrl: data.signed_url,
      agentId,
    };
  }

  /**
   * Inspect remote ElevenLabs Agent configuration for diagnostics, missing knowledge base,
   * unconfigured tools, or missing guardrails.
   */
  public async inspectAgent(customAgentId?: string): Promise<ElevenLabsAgentInspection> {
    const agentId = this.resolveAgentId(customAgentId);

    const diagnostics: ElevenLabsAgentInspection['diagnostics'] = [];

    if (!config.elevenlabsApiKey || !config.elevenlabsApiKey.trim()) {
      diagnostics.push({
        category: 'credentials',
        level: 'warning',
        message: 'Backend ELEVENLABS_API_KEY is not set.',
        actionableAdvice: 'Configure ELEVENLABS_API_KEY in backend/.env to enable live agent inspection and rule synchronization.',
      });
    }

    if (!agentId) {
      diagnostics.push({
        category: 'credentials',
        level: 'warning',
        message: 'No ElevenLabs Agent ID configured.',
        actionableAdvice: 'Provide your ElevenLabs Agent ID (from elevenlabs.io/app/conversational-ai) in Agent Studio or backend/.env.',
      });

      return {
        agentId: '',
        exists: false,
        hasVoiceForgeRules: false,
        toolsCount: 0,
        tools: [],
        knowledgeBaseCount: 0,
        knowledgeBaseDocs: [],
        guardrailStatus: 'unknown',
        diagnostics,
      };
    }

    // If no API key, return static diagnostic checklist for manual dashboard configuration
    if (!config.elevenlabsApiKey || !config.elevenlabsApiKey.trim()) {
      return {
        agentId,
        exists: false,
        hasVoiceForgeRules: false,
        toolsCount: 0,
        tools: [],
        knowledgeBaseCount: 0,
        knowledgeBaseDocs: [],
        guardrailStatus: 'unknown',
        diagnostics: [
          ...diagnostics,
          {
            category: 'knowledge_base',
            level: 'info',
            message: 'Knowledge Base verification requires ElevenLabs API Key.',
            actionableAdvice: 'Verify your clinic policy PDFs and schedule documents are uploaded in the ElevenLabs dashboard under "Knowledge Base".',
          },
          {
            category: 'tools',
            level: 'info',
            message: 'Tool integration check requires ElevenLabs API Key.',
            actionableAdvice: 'Check that appointment booking or calendar webhooks are configured under "Tools" in the ElevenLabs dashboard.',
          },
          {
            category: 'guardrails',
            level: 'info',
            message: 'Approved rulebook sync pending.',
            actionableAdvice: 'Use the "Sync Approved Rules" button once API key is set, or manually paste the rule prompt into your agent instructions.',
          },
        ],
      };
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}`, {
        method: 'GET',
        headers: {
          'xi-api-key': config.elevenlabsApiKey.trim(),
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          diagnostics.push({
            category: 'credentials',
            level: 'warning',
            message: `Agent ID "${agentId}" not found in your ElevenLabs account.`,
            actionableAdvice: 'Check your Agent ID in the ElevenLabs Conversational AI dashboard and paste it into VoiceForge Agent Studio.',
          });
        } else {
          diagnostics.push({
            category: 'credentials',
            level: 'warning',
            message: `ElevenLabs API HTTP ${response.status}: ${response.statusText}`,
            actionableAdvice: 'Check that your API key has "conversational_ai" permissions.',
          });
        }

        return {
          agentId,
          exists: false,
          hasVoiceForgeRules: false,
          toolsCount: 0,
          tools: [],
          knowledgeBaseCount: 0,
          knowledgeBaseDocs: [],
          guardrailStatus: 'unknown',
          diagnostics,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const agentData = (await response.json()) as any;
      const convConfig = agentData.conversation_config || {};
      const agentConfig = convConfig.agent || {};
      const promptObj = agentConfig.prompt || {};
      const promptText: string = typeof promptObj === 'string' ? promptObj : promptObj.prompt || '';
      const tts = convConfig.tts || {};

      // Analyze prompt for VoiceForge rule signatures
      const hasVoiceForgeRules = promptText.includes('VOICEFORGE APPROVED BUSINESS RULES');
      let voiceForgeRulesVersion: number | null = null;
      if (hasVoiceForgeRules) {
        const match = promptText.match(/APPROVED BUSINESS RULES \(v(\d+)\)/);
        if (match && match[1]) {
          voiceForgeRulesVersion = parseInt(match[1], 10);
        }
      }

      // Analyze Knowledge Base
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kbList: any[] = Array.isArray(promptObj.knowledge_base) ? promptObj.knowledge_base : [];
      const knowledgeBaseDocs = kbList.map((k) => ({
        id: k.id || k.name || 'doc',
        name: k.name || k.id || 'Untitled Document',
        type: k.type || 'file',
      }));

      if (knowledgeBaseDocs.length === 0) {
        diagnostics.push({
          category: 'knowledge_base',
          level: 'warning',
          message: 'No Knowledge Base documents attached to this ElevenLabs agent.',
          actionableAdvice: 'For optimal clinic answers (e.g. detailed doctor bios, pricing sheets), upload documents to your agent\'s Knowledge Base in ElevenLabs.',
        });
      } else {
        diagnostics.push({
          category: 'knowledge_base',
          level: 'ok',
          message: `${knowledgeBaseDocs.length} Knowledge Base document(s) detected.`,
          actionableAdvice: 'Knowledge base is active and grounded.',
        });
      }

      // Analyze Tools
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolList: any[] = Array.isArray(promptObj.tools)
        ? promptObj.tools
        : Array.isArray(promptObj.tool_ids)
        ? promptObj.tool_ids.map((id: string) => ({ id, name: id }))
        : [];

      const tools = toolList.map((t) => ({
        id: typeof t === 'string' ? t : t.id || 'tool',
        name: typeof t === 'string' ? t : t.name || t.id || 'Tool',
        type: typeof t === 'object' ? t.type : 'webhook',
      }));

      if (tools.length === 0) {
        diagnostics.push({
          category: 'tools',
          level: 'info',
          message: 'No external booking or webhook tools attached to this ElevenLabs agent.',
          actionableAdvice: 'If this agent should book appointments into an EHR/Google Calendar, configure Client Tools or Webhooks in ElevenLabs.',
        });
      }

      // Analyze Guardrails & Approved Rules
      if (hasVoiceForgeRules) {
        diagnostics.push({
          category: 'guardrails',
          level: 'ok',
          message: `VoiceForge approved business rules (v${voiceForgeRulesVersion || 1}) are injected into the agent prompt.`,
          actionableAdvice: 'Agent instructions match your approved VoiceForge rulebook.',
        });
      } else {
        diagnostics.push({
          category: 'guardrails',
          level: 'warning',
          message: 'Approved VoiceForge business rules are NOT yet synchronized to this ElevenLabs agent prompt.',
          actionableAdvice: 'Click "Sync Approved Rules" to inject verified business rules into the agent prompt.',
        });
      }

      return {
        agentId,
        exists: true,
        name: agentData.name || 'ElevenLabs Receptionist',
        language: agentConfig.language || 'en',
        voiceId: tts.voice_id || 'default',
        firstMessage: agentConfig.first_message || '',
        llmModel: promptObj.llm || 'gemini-2.0-flash',
        promptLength: promptText.length,
        promptPreview: promptText.substring(0, 200) + (promptText.length > 200 ? '...' : ''),
        hasVoiceForgeRules,
        voiceForgeRulesVersion,
        toolsCount: tools.length,
        tools,
        knowledgeBaseCount: knowledgeBaseDocs.length,
        knowledgeBaseDocs,
        guardrailStatus: hasVoiceForgeRules ? 'active' : 'missing',
        diagnostics,
      };
    } catch (err: unknown) {
      diagnostics.push({
        category: 'credentials',
        level: 'warning',
        message: err instanceof Error ? err.message : 'Failed to query ElevenLabs API',
        actionableAdvice: 'Check network connectivity to https://api.elevenlabs.io.',
      });

      return {
        agentId,
        exists: false,
        hasVoiceForgeRules: false,
        toolsCount: 0,
        tools: [],
        knowledgeBaseCount: 0,
        knowledgeBaseDocs: [],
        guardrailStatus: 'unknown',
        diagnostics,
      };
    }
  }

  /**
   * Format approved business rules into structured prompt instructions
   */
  public generateRulePromptSnippet(rulebookId: string): {
    snippet: string;
    version: number;
    rulesCount: number;
    rulebookName: string;
  } {
    const rulebook = findRulebookFlexible(rulebookId);
    if (!rulebook) {
      throw new Error(`Rulebook ${rulebookId} not found.`);
    }

    const rules = ruleRepository.findByRulebookId(rulebook.id);
    const approvedRules = rules.filter((r) => r.status === 'approved' || rulebook.status === 'approved');

    let lines: string[] = [];
    lines.push(`\n=== VOICEFORGE APPROVED BUSINESS RULES (v${rulebook.version}) ===`);
    lines.push(`The following ${approvedRules.length} operational business policies are APPROVED and MANDATORY for all customer interactions:`);

    approvedRules.forEach((r, idx) => {
      const critTag = r.is_critical ? '[CRITICAL GUARDRAIL]' : '[POLICY]';
      lines.push(`Rule ${idx + 1} ${critTag}: ${r.title} (${r.category})`);
      lines.push(`- Condition: When customer inquiry or situation involves: "${r.condition_text}"`);
      lines.push(`- Action: You MUST strictly enforce: "${r.action_text}"`);
    });

    lines.push('=== END VOICEFORGE APPROVED BUSINESS RULES ===\n');

    return {
      snippet: lines.join('\n'),
      version: rulebook.version,
      rulesCount: approvedRules.length,
      rulebookName: rulebook.name,
    };
  }

  /**
   * Synchronize the approved rulebook with the ElevenLabs agent.
   * If ELEVENLABS_API_KEY is configured, patches the agent prompt via API.
   * Otherwise, provides the exact prompt snippet for manual configuration and flags status.
   */
  public async syncRulesToAgent(
    rulebookId: string,
    customAgentId?: string
  ): Promise<{
    success: boolean;
    synced: boolean;
    pendingManualSync?: boolean;
    version: number;
    rulesCount: number;
    agentId: string;
    promptSnippet: string;
    message: string;
  }> {
    const rulebook = findRulebookFlexible(rulebookId);
    if (!rulebook) {
      throw new Error(`Rulebook "${rulebookId}" not found`);
    }

    // Verify readiness gate
    const gate = simulationService.evaluateDeploymentGate(rulebook.id);
    if (!gate.ready) {
      throw new Error(
        `Cannot synchronize rules to ElevenLabs: Deployment Readiness Gate is BLOCKED. Blockers: ${gate.blockers.join('; ')}`
      );
    }

    const agentId = this.resolveAgentId(customAgentId);
    if (!agentId) {
      throw new Error('No ElevenLabs Agent ID configured. Configure your Agent ID in Agent Studio first.');
    }

    const { snippet, version, rulesCount } = this.generateRulePromptSnippet(rulebook.id);

    // If no API key is provided, we format the snippet and mark SQLite as manual sync required
    if (!config.elevenlabsApiKey || !config.elevenlabsApiKey.trim()) {
      // Record in SQLite
      agentRepository.update(rulebook.agent_id, {
        elevenlabs_agent_id: agentId,
        elevenlabs_synced_at: null,
        elevenlabs_sync_status: 'manual_sync_required',
        elevenlabs_synced_version: version,
      });

      return {
        success: true,
        synced: false,
        pendingManualSync: true,
        version,
        rulesCount,
        agentId,
        promptSnippet: snippet,
        message:
          'ELEVENLABS_API_KEY is not set in backend/.env. The approved rulebook prompt has been generated. Copy and paste it into your ElevenLabs Agent dashboard under System Prompt.',
      };
    }

    try {
      // 1. Fetch current agent configuration
      const getRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}`, {
        method: 'GET',
        headers: {
          'xi-api-key': config.elevenlabsApiKey.trim(),
        },
      });

      if (!getRes.ok) {
        throw new Error(`Failed to fetch current ElevenLabs agent (HTTP ${getRes.status}: ${getRes.statusText})`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentData = (await getRes.json()) as any;
      const currentPrompt: string =
        typeof currentData?.conversation_config?.agent?.prompt?.prompt === 'string'
          ? currentData.conversation_config.agent.prompt.prompt
          : typeof currentData?.conversation_config?.agent?.prompt === 'string'
          ? currentData.conversation_config.agent.prompt
          : '';

      // 2. Remove existing VoiceForge rules section if already present, and append fresh snippet
      const cleanPrompt = currentPrompt
        .replace(/=== VOICEFORGE APPROVED BUSINESS RULES[\s\S]*?=== END VOICEFORGE APPROVED BUSINESS RULES ===/g, '')
        .trim();

      const updatedPrompt = `${cleanPrompt}\n\n${snippet}`.trim();

      // 3. Patch the remote agent
      const patchRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': config.elevenlabsApiKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_config: {
            agent: {
              prompt: {
                prompt: updatedPrompt,
              },
            },
          },
        }),
      });

      if (!patchRes.ok) {
        let patchErr = `HTTP ${patchRes.status}: ${patchRes.statusText}`;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pJson = (await patchRes.json()) as any;
          if (pJson?.detail) patchErr = typeof pJson.detail === 'string' ? pJson.detail : JSON.stringify(pJson.detail);
        } catch {
          // ignore
        }
        throw new Error(`Failed to patch ElevenLabs agent prompt: ${patchErr}`);
      }

      // 4. Update SQLite agent record with verified sync timestamp
      const nowIso = new Date().toISOString();
      agentRepository.update(rulebook.agent_id, {
        elevenlabs_agent_id: agentId,
        elevenlabs_synced_at: nowIso,
        elevenlabs_sync_status: 'synced',
        elevenlabs_synced_version: version,
      });

      return {
        success: true,
        synced: true,
        version,
        rulesCount,
        agentId,
        promptSnippet: snippet,
        message: `Successfully synchronized ${rulesCount} approved business rules (v${version}) directly to ElevenLabs Agent "${agentId}".`,
      };
    } catch (err: unknown) {
      // Fallback: update status to manual sync required
      agentRepository.update(rulebook.agent_id, {
        elevenlabs_agent_id: agentId,
        elevenlabs_synced_at: null,
        elevenlabs_sync_status: 'manual_sync_required',
        elevenlabs_synced_version: version,
      });

      return {
        success: false,
        synced: false,
        pendingManualSync: true,
        version,
        rulesCount,
        agentId,
        promptSnippet: snippet,
        message: `Could not patch remote ElevenLabs agent directly: ${
          err instanceof Error ? err.message : String(err)
        }. Please copy the generated prompt snippet into your ElevenLabs dashboard.`,
      };
    }
  }
}

export const elevenlabsService = new ElevenLabsService();
