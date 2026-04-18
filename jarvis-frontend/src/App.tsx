import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';
import { BackgroundEffects } from '@/components/layout/BackgroundEffects';
import { ChatView } from '@/components/chat/ChatView';
import { MemoryPanel } from '@/components/memory/MemoryPanel';
import { AgentTrace } from '@/components/agents/AgentTrace';
import { SystemPanel } from '@/components/layout/SystemPanel';
import { Panel } from '@/components/ui/Panel';
import { useJarvisStore } from '@/stores/jarvisStore';

const panelTitles = {
  chat: 'NEURAL INTERFACE',
  memory: 'MEMORY CORE',
  agents: 'AGENT NETWORK',
  settings: 'SYSTEM CONFIG',
};

export function App() {
  const { activePanel } = useJarvisStore();

  return (
    <div className="scanlines vignette relative flex flex-col h-screen w-screen overflow-hidden font-body">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Background */}
      <BackgroundEffects />

      {/* Top bar */}
      <TopBar />

      {/* Main layout */}
      <div className="relative flex flex-1 overflow-hidden" style={{ zIndex: 1 }}>
        {/* Left sidebar */}
        <Sidebar />

        {/* Center content */}
        <main className="flex-1 overflow-hidden">
          <Panel
            className="h-full border-0 border-r border-jarvis-border rounded-none"
            title={panelTitles[activePanel]}
            subtitle={activePanel === 'chat' ? 'v2.0 · CLAUDE SONNET' : undefined}
          >
            <div className="h-[calc(100%-40px)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="h-full"
                >
                  {activePanel === 'chat' && <ChatView />}
                  {activePanel === 'memory' && (
                    <div className="h-full overflow-hidden">
                      <MemoryPanel />
                    </div>
                  )}
                  {activePanel === 'agents' && (
                    <div className="h-full overflow-hidden">
                      <AgentTrace />
                    </div>
                  )}
                  {activePanel === 'settings' && <SystemPanel />}
                </motion.div>
              </AnimatePresence>
            </div>
          </Panel>
        </main>

        {/* Right panel */}
        <RightPanel />
      </div>

      {/* Bottom status bar */}
      <div className="relative border-t border-jarvis-border/50 bg-jarvis-bg/80 px-4 h-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[8px] text-jarvis-dim tracking-widest">
            JARVIS AI SYSTEM · BUILD 2025.1
          </span>
          <span className="font-mono text-[8px] text-jarvis-border">|</span>
          <span className="font-mono text-[8px] text-jarvis-dim tracking-widest">
            ANTHROPIC CLAUDE SONNET-4
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[8px] text-jarvis-dim tracking-widest">
            LANGGRAPH · MEM0 · QDRANT
          </span>
          <div className="w-1 h-1 rounded-full bg-jarvis-success animate-pulse" />
        </div>
        {/* Sweep line */}
        <motion.div
          className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-jarvis-glow/50 to-transparent"
          style={{ width: '30%' }}
          animate={{ x: ['0%', '280%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
