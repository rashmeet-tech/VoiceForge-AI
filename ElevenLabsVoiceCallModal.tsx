import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  Radio,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  Wrench,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useVoiceCall } from '../../context/VoiceCallContext';
import { api, ElevenLabsStatus, ElevenLabsInspection, Agent, Rulebook } from '../../api/client';

interface TranscriptItem {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export const ElevenLabsVoiceCallModal: React.FC = () => {
  const { isModalOpen, activeAgentId, activeRulebookId, closeCallModal } = useVoiceCall();

  // Component states
  const [backendStatus, setBackendStatus] = useState<ElevenLabsStatus | null>(null);
  const [inspection, setInspection] = useState<ElevenLabsInspection | null>(null);
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [rulebookData, setRulebookData] = useState<Rulebook | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showInspectionDrawer, setShowInspectionDrawer] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // ElevenLabs Conversational AI React SDK Hook
  const conversation = useConversation({
    onConnect: ({ conversationId }) => {
      setCustomError(null);
      setIsInitializing(false);
      setTranscripts((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          role: 'agent',
          text: `[Call Connected • Session ID: ${conversationId.substring(0, 12)}...]`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ]);
    },
    onDisconnect: (details) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (details?.reason === 'error' && details.message) {
        setCustomError(`Call disconnected: ${details.message}`);
      }
    },
    onMessage: (payload) => {
      if (payload && payload.message && payload.message.trim()) {
        const isUser = payload.source === 'user' || payload.role === 'user';
        setTranscripts((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            role: isUser ? 'user' : 'agent',
            text: payload.message.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
        ]);
      }
    },
    onError: (errMessage) => {
      setIsInitializing(false);
      setCustomError(`ElevenLabs Connection Error: ${errMessage}`);
    },
  });

  // Call duration counter
  useEffect(() => {
    if (conversation.status === 'connected') {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [conversation.status]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Load backend status and agent metadata when modal opens
  const loadMetadata = useCallback(async () => {
    try {
      const statusRes = await api.getElevenLabsStatus();
      if (statusRes.data) {
        setBackendStatus(statusRes.data);
      }

      // Check agent metadata
      const agentsRes = await api.listAgents();
      if (agentsRes.data && agentsRes.data.length > 0) {
        const selected = activeAgentId
          ? agentsRes.data.find((a) => a.id === activeAgentId) || agentsRes.data[0]
          : agentsRes.data[0];
        setAgentData(selected);

        // Fetch Rulebooks
        const rbs = await api.getRulebooksForAgent(selected.id);
        if (rbs.data && rbs.data.length > 0) {
          const matchRb = activeRulebookId
            ? rbs.data.find((r) => r.id === activeRulebookId) || rbs.data[0]
            : rbs.data[0];
          setRulebookData(matchRb);
        }

        // Run ElevenLabs Inspection
        const elAgentId = selected.elevenlabs_agent_id || statusRes.data?.configuredAgentId || undefined;
        if (elAgentId) {
          const inspectRes = await api.getElevenLabsInspection(elAgentId);
          if (inspectRes.data) {
            setInspection(inspectRes.data);
          }
        }
      }
    } catch {
      // Non-blocking metadata load error
    }
  }, [activeAgentId, activeRulebookId]);

  useEffect(() => {
    if (isModalOpen) {
      loadMetadata();
    }
  }, [isModalOpen, loadMetadata]);

  // Format call duration MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Call Handler
  const handleStartCall = async () => {
    setCustomError(null);
    setIsInitializing(true);
    setTranscripts([]);

    try {
      // Step 1: Request Microphone Access explicitly beforehand
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr: unknown) {
        setIsInitializing(false);
        const micMsg = micErr instanceof Error ? micErr.message : 'Microphone permission denied';
        setCustomError(`Microphone access is required for real-time voice conversations (${micMsg}). Please allow microphone access in your browser.`);
        return;
      }

      // Step 2: Determine Agent ID
      const targetAgentId =
        agentData?.elevenlabs_agent_id ||
        backendStatus?.configuredAgentId ||
        (import.meta.env.VITE_ELEVENLABS_AGENT_ID as string) ||
        '';

      if (!targetAgentId && !backendStatus?.apiKeyConfigured) {
        setIsInitializing(false);
        setCustomError(
          'No ElevenLabs Agent ID configured. Please configure your Agent ID in Agent Studio or in backend/.env.'
        );
        return;
      }

      // Step 3: Try to get Signed URL from secure Express backend
      let signedUrl: string | null = null;
      try {
        const signRes = await api.getElevenLabsSignedUrl(targetAgentId || undefined);
        if (signRes.data?.signedUrl) {
          signedUrl = signRes.data.signedUrl;
        }
      } catch (signErr: unknown) {
        // If backend lacks API key or fails, check if we have a public agentId fallback
        const errDetail = signErr instanceof Error ? signErr.message : String(signErr);
        if (!targetAgentId) {
          setIsInitializing(false);
          setCustomError(`Could not initiate call: ${errDetail}`);
          return;
        }
        // If targetAgentId exists, we can attempt public session fallback
      }

      // Step 4: Initiate session via ElevenLabs React SDK
      if (signedUrl) {
        await conversation.startSession({
          signedUrl,
          connectionType: 'websocket',
        });
      } else if (targetAgentId) {
        await conversation.startSession({
          agentId: targetAgentId,
        });
      } else {
        throw new Error('Neither a signed conversation URL nor a public Agent ID could be resolved.');
      }
    } catch (err: unknown) {
      setIsInitializing(false);
      setCustomError(err instanceof Error ? err.message : 'Failed to connect to ElevenLabs agent.');
    }
  };

  // End Call Handler
  const handleEndCall = async () => {
    try {
      await conversation.endSession();
    } catch {
      // ignore
    } finally {
      setIsInitializing(false);
    }
  };

  // Mute Toggle Handler
  const handleToggleMute = () => {
    const next = !conversation.isMuted;
    conversation.setMuted(next);
  };

  // Rule Synchronization Handler
  const handleSyncRules = async () => {
    if (!rulebookData) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await api.syncRulesToElevenLabs(rulebookData.id, agentData?.elevenlabs_agent_id || undefined);
      setSyncFeedback(res.message || 'Rulebook synchronization completed.');
      // Refresh inspection and metadata
      await loadMetadata();
    } catch (err: unknown) {
      setSyncFeedback(err instanceof Error ? err.message : 'Failed to synchronize rulebook');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isModalOpen) return null;

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting' || isInitializing;
  const isSpeaking = conversation.isSpeaking || conversation.mode === 'speaking';
  const isListening = conversation.isListening || conversation.mode === 'listening';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-borderMuted overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-borderMuted flex items-center justify-between bg-gradient-to-r from-aiLavender/30 via-white to-aiLavender/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-mainText">
                  {agentData?.name || 'ElevenLabs Voice Agent'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                  ElevenAgents
                </span>
              </div>
              <p className="text-xs text-mutedText">
                {agentData?.business_name || 'Apex Dental Clinic'} • Real-Time Two-Way Voice Call
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCallModal}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-mutedText hover:text-mainText transition-colors"
            title="Close voice console"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Audio Disclaimer Banner */}
        <div className="px-5 py-2.5 bg-amber-50/90 border-b border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-tight">
            <span className="font-bold">Live Conversational Audio:</span> Spoken audio is generated by ElevenLabs AI and played directly through your speakers. User microphone audio is streamed live over WebSockets. Distinct from deterministic rule tests.
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Visualizer & Connection State Card */}
          <div className="rounded-2xl border border-borderMuted p-6 bg-[#FAFBFD] flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
            {/* Visualizer Circle */}
            <div className="relative flex items-center justify-center">
              {/* Pulsing waves when speaking/listening */}
              {isConnected && (
                <div
                  className={`absolute w-36 h-36 rounded-full transition-all duration-700 ${
                    isSpeaking
                      ? 'bg-purple-200/60 scale-125 animate-ping'
                      : isListening
                      ? 'bg-emerald-200/50 scale-110 animate-pulse'
                      : 'bg-gray-100 scale-95'
                  }`}
                />
              )}

              {/* Main Avatar / Icon */}
              <div
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isConnected
                    ? isSpeaking
                      ? 'bg-gradient-to-tr from-secondary to-purple-600 text-white shadow-secondary/30 scale-105'
                      : 'bg-emerald-600 text-white shadow-emerald-500/30'
                    : isConnecting
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-gray-200 text-mutedText'
                }`}
              >
                {isConnecting ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : isConnected ? (
                  isSpeaking ? (
                    <Volume2 className="w-10 h-10 animate-bounce" />
                  ) : (
                    <Mic className="w-10 h-10 animate-pulse" />
                  )
                ) : (
                  <Phone className="w-10 h-10" />
                )}
              </div>
            </div>

            {/* Connection State Badge & Status Text */}
            <div className="space-y-1 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {isConnecting ? (
                  <span className="text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </span>
                ) : isConnected ? (
                  <span className="text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                    Connected • {formatTime(callDuration)}
                  </span>
                ) : (
                  <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    Ready to Call
                  </span>
                )}
              </div>

              <div className="text-sm font-bold text-mainText">
                {isConnecting
                  ? 'Requesting microphone and starting secure ElevenLabs audio stream...'
                  : isConnected
                  ? isSpeaking
                    ? 'Agent is speaking through your speakers...'
                    : 'Listening to your voice... Speak naturally.'
                  : 'Click "Start Voice Call" to talk with the AI Receptionist.'}
              </div>

              {/* Sound Wave Animation Bars when Speaking */}
              {isConnected && isSpeaking && (
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  <span className="w-1.5 h-6 bg-secondary rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-10 bg-primary rounded-full animate-bounce delay-150"></span>
                  <span className="w-1.5 h-8 bg-secondary rounded-full animate-bounce delay-200"></span>
                  <span className="w-1.5 h-12 bg-purple-600 rounded-full animate-bounce delay-300"></span>
                  <span className="w-1.5 h-7 bg-primary rounded-full animate-bounce delay-150"></span>
                </div>
              )}
            </div>

            {/* Active Control Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 z-10">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={handleStartCall}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4" />
                      <span>Start Voice Call</span>
                    </>
                  )}
                </button>
              ) : (
                <>
                  {/* End Call Button */}
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Voice Call</span>
                  </button>

                  {/* Mic Mute Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      conversation.isMuted
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white text-mainText border-borderMuted hover:bg-gray-50'
                    }`}
                  >
                    {conversation.isMuted ? (
                      <>
                        <MicOff className="w-4 h-4 text-amber-700" />
                        <span>Unmute Mic</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-emerald-600" />
                        <span>Mute Mic</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Error Alert Box */}
          {customError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Voice Call Notice</p>
                <p className="leading-relaxed">{customError}</p>
                <div className="pt-1 text-[11px] text-rose-700">
                  Tip: Ensure ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID are configured in <code className="bg-white/70 px-1 py-0.5 rounded font-mono">backend/.env</code> and restart the backend.
                </div>
              </div>
            </div>
          )}

          {/* Rulebook Synchronization Status Card */}
          <div className="p-4 rounded-2xl border border-borderMuted bg-white space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold text-mainText uppercase tracking-wider">
                  Approved Rulebook Synchronization
                </h4>
              </div>

              {inspection?.hasVoiceForgeRules ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Synced (v{inspection.voiceForgeRulesVersion || rulebookData?.version || 1})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Pending Rule Sync (Baseline Prompt)
                </span>
              )}
            </div>

            <p className="text-xs text-mutedText leading-relaxed">
              {inspection?.hasVoiceForgeRules
                ? `The ElevenLabs receptionist prompt is verified synchronized with approved Rulebook v${inspection.voiceForgeRulesVersion || rulebookData?.version}.`
                : 'The voice call currently connects to your baseline ElevenLabs receptionist. To ensure the agent follows your approved clinic policies, synchronize your approved rulebook.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSyncRules}
                disabled={isSyncing || !rulebookData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/95 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synchronizing Rules...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Approved Rules to ElevenLabs</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowInspectionDrawer(!showInspectionDrawer)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-mainText border border-borderMuted hover:bg-[#F9FAFC] transition-colors cursor-pointer"
              >
                <span>Agent Configuration & Tools</span>
                {showInspectionDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {syncFeedback && (
              <div className="p-2.5 rounded-xl bg-aiLavender/40 border border-primary/20 text-xs text-primary font-medium">
                {syncFeedback}
              </div>
            )}
          </div>

          {/* Collapsible Inspection & Diagnostics Drawer (Requirement 15) */}
          {showInspectionDrawer && (
            <div className="p-4 rounded-2xl border border-borderMuted bg-[#FAFBFD] space-y-3 animate-in fade-in duration-150">
              <h5 className="text-xs font-bold text-mainText uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-secondary" />
                <span>ElevenLabs Agent Inspection & Configuration Report</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white border border-borderMuted">
                  <span className="text-mutedText block text-[10px] font-semibold uppercase">Knowledge Base</span>
                  <span className="font-bold text-mainText flex items-center gap-1 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-secondary" />
                    {inspection?.knowledgeBaseCount ?? 0} Documents Attached
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-borderMuted">
                  <span className="text-mutedText block text-[10px] font-semibold uppercase">Tools & Integrations</span>
                  <span className="font-bold text-mainText flex items-center gap-1 mt-0.5">
                    <Wrench className="w-3.5 h-3.5 text-primary" />
                    {inspection?.toolsCount ?? 0} Tools Configured
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-borderMuted">
                  <span className="text-mutedText block text-[10px] font-semibold uppercase">LLM Model</span>
                  <span className="font-bold text-mainText block mt-0.5 truncate">
                    {inspection?.llmModel || 'gemini-2.0-flash'}
                  </span>
                </div>
              </div>

              {/* Diagnostic Checklist */}
              {inspection?.diagnostics && inspection.diagnostics.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-mainText block uppercase">Diagnostics & Advice:</span>
                  <div className="space-y-1.5">
                    {inspection.diagnostics.map((d, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                          d.level === 'warning'
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                            : d.level === 'ok'
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                            : 'bg-white border-borderMuted text-mainText'
                        }`}
                      >
                        <span className="font-bold shrink-0 uppercase text-[10px] px-1.5 py-0.5 rounded bg-white/70">
                          {d.category}
                        </span>
                        <div>
                          <p className="font-semibold">{d.message}</p>
                          <p className="text-[11px] text-mutedText mt-0.5">{d.actionableAdvice}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Real-Time Live Transcript Stream */}
          <div className="rounded-2xl border border-borderMuted bg-white overflow-hidden flex flex-col">
            <div className="p-3 bg-[#FAFBFD] border-b border-borderMuted flex items-center justify-between text-xs font-bold text-mainText">
              <span>Live Conversation Transcript</span>
              <span className="text-[11px] text-mutedText font-normal">
                {transcripts.length} message(s)
              </span>
            </div>

            <div className="p-4 max-h-48 overflow-y-auto space-y-3">
              {transcripts.length === 0 ? (
                <div className="py-6 text-center text-xs text-mutedText space-y-1">
                  <p>No messages exchanged yet.</p>
                  <p className="text-[11px]">Once connected, speak into your microphone to converse with the agent.</p>
                </div>
              ) : (
                transcripts.map((t) => (
                  <div
                    key={t.id}
                    className={`flex flex-col text-xs space-y-1 ${
                      t.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-mutedText px-1">
                      <span className="font-bold">{t.role === 'user' ? 'You (Caller)' : agentData?.name || 'Agent'}</span>
                      <span>•</span>
                      <span>{t.timestamp}</span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                        t.role === 'user'
                          ? 'bg-primary text-white rounded-br-xs'
                          : 'bg-[#F2F4F8] text-mainText rounded-bl-xs'
                      }`}
                    >
                      {t.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-borderMuted bg-[#FAFBFD] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-mutedText">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>API Backend: {api.getBaseUrl()}</span>
          </div>

          <button
            type="button"
            onClick={closeCallModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-mainText bg-white border border-borderMuted hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
