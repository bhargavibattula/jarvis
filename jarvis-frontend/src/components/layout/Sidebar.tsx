import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Brain, Bot, Settings, ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-react';
import { useJarvisStore } from '@/stores/jarvisStore';
import { JarvisOrb } from './JarvisOrb';
import { clsx } from 'clsx';

const navItems = [
  { id: 'chat' as const, icon: MessageSquare, label: 'NEURAL CHAT' },
  { id: 'memory' as const, icon: Brain, label: 'MEMORY CORE' },
  { id: 'agents' as const, icon: Bot, label: 'AGENT HUB' },
  { id: 'settings' as const, icon: Settings, label: 'SYSTEM' },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activePanel, setActivePanel, clearMessages, messages } = useJarvisStore();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 220 : 60 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col border-r border-jarvis-border bg-jarvis-bg/95 z-40 overflow-hidden"
      >
        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-16 z-50 w-6 h-6 rounded-full border border-jarvis-border bg-jarvis-panel flex items-center justify-center text-jarvis-dim hover:text-jarvis-glow hover:border-jarvis-glow/60 transition-all"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>

        {/* Orb section */}
        <div className="flex flex-col items-center py-6 border-b border-jarvis-border/50">
          <JarvisOrb size="sm" />
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 text-center"
            >
              <div className="font-mono text-[9px] text-jarvis-dim tracking-widest">SESSION ACTIVE</div>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 group',
                activePanel === id
                  ? 'bg-jarvis-glow/10 text-jarvis-glow border border-jarvis-glow/30'
                  : 'text-jarvis-dim hover:text-jarvis-text hover:bg-jarvis-muted/20 border border-transparent'
              )}
            >
              <Icon
                className={clsx(
                  'flex-shrink-0 w-4 h-4 transition-all',
                  activePanel === id
                    ? 'text-jarvis-glow drop-shadow-glow'
                    : 'group-hover:text-jarvis-text'
                )}
              />
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-display text-[10px] tracking-[0.15em] font-medium whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
              {activePanel === id && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute left-0 w-0.5 h-8 bg-jarvis-glow rounded-r"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        {sidebarOpen && (
          <div className="p-3 border-t border-jarvis-border/50 space-y-2">
            <button
              onClick={clearMessages}
              disabled={messages.length === 0}
              className="w-full flex items-center gap-2 px-3 py-2 text-jarvis-dim hover:text-jarvis-warn border border-transparent hover:border-jarvis-warn/30 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="font-mono text-[9px] tracking-widest">CLEAR SESSION</span>
            </button>
          </div>
        )}

        {/* Data stream decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-px overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full bg-gradient-to-b from-transparent via-jarvis-glow/40 to-transparent h-20"
              style={{
                animation: `dataFlow ${3 + i}s linear infinite`,
                animationDelay: `${i * 1.2}s`,
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
