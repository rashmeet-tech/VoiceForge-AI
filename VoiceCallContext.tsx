import React, { createContext, useContext, useState, useCallback } from 'react';

export interface VoiceCallContextType {
  isModalOpen: boolean;
  activeAgentId: string | null;
  activeRulebookId: string | null;
  openCallModal: (agentId?: string, rulebookId?: string) => void;
  closeCallModal: () => void;
}

const VoiceCallContext = createContext<VoiceCallContextType | undefined>(undefined);

export const VoiceCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activeRulebookId, setActiveRulebookId] = useState<string | null>(null);

  const openCallModal = useCallback((agentId?: string, rulebookId?: string) => {
    if (agentId) setActiveAgentId(agentId);
    if (rulebookId) setActiveRulebookId(rulebookId);
    setIsModalOpen(true);
  }, []);

  const closeCallModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <VoiceCallContext.Provider
      value={{
        isModalOpen,
        activeAgentId,
        activeRulebookId,
        openCallModal,
        closeCallModal,
      }}
    >
      {children}
    </VoiceCallContext.Provider>
  );
};

export const useVoiceCall = (): VoiceCallContextType => {
  const context = useContext(VoiceCallContext);
  if (!context) {
    throw new Error('useVoiceCall must be used within a VoiceCallProvider');
  }
  return context;
};

