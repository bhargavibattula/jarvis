import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Clock, Tag, Search } from 'lucide-react';
import { useJarvisStore } from '@/stores/jarvisStore';
import { useState } from 'react';

// Demo memories for display
const demoMemories = [
  { id: '1', content: 'User prefers dark mode interfaces and minimalist design', category: 'preference', relevance: 0.95 },
  { id: '2', content: 'Working on a full-stack Jarvis AI project with FastAPI backend', category: 'context', relevance: 0.88 },
  { id: '3', content: 'Lives in Bangalore, India. IST timezone (UTC+5:30)', category: 'personal', relevance: 0.72 },
  { id: '4', content: 'Prefers Python 3.12+ with async/await patterns', category: 'tech', relevance: 0.91 },
  { id: '5', content: 'Uses React 18 with TypeScript and Tailwind CSS', category: 'tech', relevance: 0.85 },
];

const categoryColors: Record<string, string> = {
  preference: 'text-jarvis-glow border-jarvis-glow/40 bg-jarvis-glow/5',
  context: 'text-blue-400 border-blue-400/40 bg-blue-400/5',
  personal: 'text-jarvis-accent border-jarvis-accent/40 bg-jarvis-accent/5',
  tech: 'text-purple-400 border-purple-400/40 bg-purple-400/5',
  fact: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/5',
};

export function MemoryPanel() {
  const { recentMemoryAccess, activeAgentEvents } = useJarvisStore();
  const [search, setSearch] = useState('');

  const memoryEvents = activeAgentEvents.filter(
    (e) => e.event_type === 'memory_read' || e.event_type === 'memory_write'
  );

  const filtered = demoMemories.filter(
    (m) =>
      !search || m.content.toLowerCase().includes(search.toLowerCase()) || m.category.includes(search)
  );

  return (
    <div className="h-full flex flex-col gap-0">
      {/* Memory stats */}
      <div className="grid grid-cols-3 gap-px border-b border-jarvis-border/30">
        {[
          { label: 'STORED', value: demoMemories.length, color: 'text-jarvis-glow' },
          { label: 'ACCESSED', value: memoryEvents.length, color: 'text-jarvis-accent' },
          { label: 'RELEVANCE', value: '88%', color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center py-2 bg-jarvis-panel/30">
            <span className={`font-display text-base font-bold ${color}`}>{value}</span>
            <span className="font-mono text-[8px] text-jarvis-dim tracking-widest">{label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-jarvis-border/30">
        <div className="flex items-center gap-2 px-2 py-1.5 border border-jarvis-border/50 rounded bg-jarvis-bg/40">
          <Search className="w-3 h-3 text-jarvis-dim flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="flex-1 bg-transparent font-mono text-[10px] text-jarvis-text placeholder-jarvis-border outline-none"
          />
        </div>
      </div>

      {/* Memory list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        <AnimatePresence>
          {filtered.map((mem, i) => (
            <motion.div
              key={mem.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`
                relative p-2.5 border rounded cursor-pointer transition-all group
                ${recentMemoryAccess.includes(mem.id)
                  ? 'border-jarvis-glow/40 bg-jarvis-glow/5 shadow-glow-sm'
                  : 'border-jarvis-border/40 bg-jarvis-panel/40 hover:border-jarvis-border'
                }
              `}
            >
              {/* Recent access glow */}
              {recentMemoryAccess.includes(mem.id) && (
                <motion.div
                  className="absolute inset-0 rounded border border-jarvis-glow/60"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              <div className="flex items-start justify-between gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 border rounded text-[8px] font-mono tracking-widest uppercase ${
                    categoryColors[mem.category] || categoryColors.fact
                  }`}
                >
                  <Tag className="w-2 h-2" />
                  {mem.category}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1 rounded-full bg-jarvis-border overflow-hidden">
                    <div
                      className="h-full bg-jarvis-glow rounded-full"
                      style={{ width: `${(mem.relevance || 0) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[8px] text-jarvis-dim">
                    {Math.round((mem.relevance || 0) * 100)}%
                  </span>
                </div>
              </div>
              <p className="font-body text-[11px] text-jarvis-text leading-relaxed">{mem.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Recent access log */}
      {memoryEvents.length > 0 && (
        <div className="px-3 py-2 border-t border-jarvis-border/30">
          <div className="font-display text-[9px] tracking-widest text-jarvis-dim uppercase mb-1.5">
            Recent Access
          </div>
          <div className="space-y-1">
            {memoryEvents.slice(-3).map((evt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-1 h-1 rounded-full ${
                    evt.event_type === 'memory_write' ? 'bg-jarvis-accent' : 'bg-jarvis-glow/60'
                  }`}
                />
                <span className="font-mono text-[9px] text-jarvis-dim">
                  {evt.event_type === 'memory_write' ? 'WRITE' : 'READ'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
