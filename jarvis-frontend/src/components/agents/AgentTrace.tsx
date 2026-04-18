import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '@/stores/jarvisStore';
import { Activity, Zap, Search, Code, Brain, Mail, Calendar, TrendingUp, Cloud, Newspaper, Database } from 'lucide-react';
import { clsx } from 'clsx';

const agentIcons: Record<string, React.ElementType> = {
  orchestrator: Activity,
  search: Search,
  coder: Code,
  memory: Brain,
  email: Mail,
  calendar: Calendar,
  finance: TrendingUp,
  weather: Cloud,
  news: Newspaper,
  drive: Database,
};

const agentColors: Record<string, string> = {
  orchestrator: 'text-jarvis-glow border-jarvis-glow/40 bg-jarvis-glow/5',
  search: 'text-blue-400 border-blue-400/40 bg-blue-400/5',
  coder: 'text-purple-400 border-purple-400/40 bg-purple-400/5',
  email: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/5',
  calendar: 'text-green-400 border-green-400/40 bg-green-400/5',
  finance: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/5',
  weather: 'text-sky-400 border-sky-400/40 bg-sky-400/5',
  news: 'text-orange-400 border-orange-400/40 bg-orange-400/5',
  drive: 'text-pink-400 border-pink-400/40 bg-pink-400/5',
  memory: 'text-jarvis-accent border-jarvis-accent/40 bg-jarvis-accent/5',
};

export function AgentTrace() {
  const { activeAgentEvents, currentAgent, activeTools } = useJarvisStore();

  const recentEvents = activeAgentEvents.slice(-8);

  return (
    <div className="h-full flex flex-col">
      {/* Current agent */}
      <div className="px-3 py-2 border-b border-jarvis-border/30">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3 h-3 text-jarvis-glow" />
          <span className="font-display text-[9px] tracking-widest text-jarvis-dim uppercase">Active Agent</span>
        </div>
        <AnimatePresence mode="wait">
          {currentAgent ? (
            <motion.div
              key={currentAgent}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={clsx(
                'flex items-center gap-2 px-2 py-1.5 border rounded',
                agentColors[currentAgent] || agentColors.orchestrator
              )}
            >
              {(() => {
                const Icon = agentIcons[currentAgent] || Activity;
                return <Icon className="w-3.5 h-3.5" />;
              })()}
              <span className="font-display text-[10px] tracking-widest uppercase">{currentAgent}</span>
              <div className="ml-auto flex gap-0.5">
                {[0, 0.15, 0.3].map((d) => (
                  <motion.div
                    key={d}
                    className="w-1 h-1 rounded-full bg-current"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: d }}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-2 py-1.5 border border-jarvis-border/30 rounded text-jarvis-border"
            >
              <span className="font-mono text-[9px] tracking-widest">STANDBY</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active tools */}
      {activeTools.length > 0 && (
        <div className="px-3 py-2 border-b border-jarvis-border/30">
          <div className="font-display text-[9px] tracking-widest text-jarvis-dim uppercase mb-1.5">Tool Calls</div>
          <div className="space-y-1">
            {activeTools.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-[10px]"
              >
                <div className="w-1 h-1 rounded-full bg-jarvis-accent animate-pulse" />
                <span className="font-mono text-jarvis-accent">{t.tool}</span>
                <span className="text-jarvis-dim truncate">{String(t.input).slice(0, 20)}...</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Event log */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="font-display text-[9px] tracking-widest text-jarvis-dim uppercase mb-2">Event Log</div>
        <AnimatePresence>
          {recentEvents.length === 0 ? (
            <div className="text-center py-4 text-jarvis-border font-mono text-[9px]">
              AWAITING EVENTS
            </div>
          ) : (
            recentEvents.map((evt, i) => (
              <motion.div
                key={evt.id || i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-start gap-2 py-1 border-b border-jarvis-border/20"
              >
                <div
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1',
                    evt.event_type === 'error' ? 'bg-jarvis-warn' :
                    evt.event_type === 'memory_read' || evt.event_type === 'memory_write' ? 'bg-jarvis-accent' :
                    evt.event_type === 'tool_call' ? 'bg-purple-400' :
                    evt.event_type === 'done' ? 'bg-jarvis-success' :
                    'bg-jarvis-glow/60'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[9px] text-jarvis-dim">
                    {evt.event_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  {evt.agent && (
                    <span className="ml-1 font-mono text-[9px] text-jarvis-glow/60">
                      [{evt.agent}]
                    </span>
                  )}
                  {evt.data && Object.keys(evt.data).length > 0 && (
                    <div className="font-mono text-[8px] text-jarvis-border truncate">
                      {JSON.stringify(evt.data).slice(0, 40)}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
