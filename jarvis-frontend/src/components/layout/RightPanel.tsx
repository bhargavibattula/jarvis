import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Brain, Mic } from 'lucide-react';
import { useState } from 'react';
import { AgentTrace } from '@/components/agents/AgentTrace';
import { MemoryPanel } from '@/components/memory/MemoryPanel';
import { VoicePanel } from '@/components/voice/VoicePanel';
import { clsx } from 'clsx';
import { useJarvisStore } from '@/stores/jarvisStore';
import { useJarvisWebSocket, setVoiceResponseCallback } from '@/hooks/useWebSocket';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

type Tab = 'agents' | 'memory' | 'voice';

const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: 'agents', icon: Bot, label: 'AGENTS' },
  { id: 'memory', icon: Brain, label: 'MEMORY' },
  { id: 'voice', icon: Mic, label: 'VOICE' },
];

export function RightPanel() {
  const [tab, setTab] = useState<Tab>('voice');
  const { isStreaming, currentAgent, voiceActive } = useJarvisStore();
  const { sendMessage } = useJarvisWebSocket();

  const {
    voiceState,
    lastTranscript,
    wakeDetected,
    activateVoiceAssistant,
    deactivateVoiceAssistant,
    manualListen,
    stopListening,
    onResponseReady,
  } = useVoiceAssistant(sendMessage);

  // Wire onResponseReady into WebSocket so it's called when done arrives
  // We use the module-level setter to avoid prop drilling
  setVoiceResponseCallback(voiceActive ? onResponseReady : null);

  return (
    <div className="w-64 flex flex-col border-l border-jarvis-border bg-jarvis-bg/95">
      {/* Tab header */}
      <div className="flex border-b border-jarvis-border">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all relative',
              tab === id
                ? 'text-jarvis-glow bg-jarvis-glow/5'
                : 'text-jarvis-dim hover:text-jarvis-text'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="font-display text-[8px] tracking-widest">{label}</span>

            {/* Activity indication */}
            {id === 'agents' && (isStreaming || currentAgent) && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-jarvis-success animate-pulse" />
            )}
            {id === 'voice' && voiceActive && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-jarvis-accent animate-pulse" />
            )}

            {tab === id && (
              <motion.div
                layoutId="right-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-jarvis-glow"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {tab === 'agents' && <AgentTrace />}
            {tab === 'memory' && <MemoryPanel />}
            {tab === 'voice' && (
              <VoicePanel
                voiceState={voiceState}
                lastTranscript={lastTranscript}
                wakeDetected={wakeDetected}
                onActivate={activateVoiceAssistant}
                onDeactivate={deactivateVoiceAssistant}
                onManualListen={manualListen}
                onStopListening={stopListening}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom decoration */}
      <div className="h-px bg-gradient-to-r from-transparent via-jarvis-glow/30 to-transparent" />
    </div>
  );
}
