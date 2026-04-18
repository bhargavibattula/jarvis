import { motion } from 'framer-motion';
import { Shield, Cpu, Database, Zap, Server, Activity, Globe, Code } from 'lucide-react';
import { useJarvisStore } from '@/stores/jarvisStore';
import { ProgressBar } from '@/components/ui/Panel';

const systemModules = [
  { name: 'Neural Engine', status: 'online', icon: Cpu, load: 72 },
  { name: 'Memory Core', status: 'online', icon: Database, load: 45 },
  { name: 'Search Agent', status: 'online', icon: Globe, load: 30 },
  { name: 'Code Executor', status: 'standby', icon: Code, load: 0 },
  { name: 'Vector DB', status: 'online', icon: Server, load: 58 },
  { name: 'Voice Engine', status: 'standby', icon: Activity, load: 0 },
];

export function SystemPanel() {
  const { status, mode, setMode } = useJarvisStore();

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* System health */}
      <div>
        <div className="font-display text-[9px] tracking-widest text-jarvis-dim uppercase mb-3 flex items-center gap-2">
          <Shield className="w-3 h-3" /> System Health
        </div>
        <div className="space-y-3">
          {systemModules.map((mod, i) => (
            <motion.div
              key={mod.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3"
            >
              <div
                className={`w-6 h-6 rounded flex items-center justify-center border ${
                  mod.status === 'online'
                    ? 'border-jarvis-glow/30 bg-jarvis-glow/10 text-jarvis-glow'
                    : 'border-jarvis-border text-jarvis-border'
                }`}
              >
                <mod.icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] text-jarvis-text tracking-wide">{mod.name}</span>
                  <span
                    className={`font-mono text-[8px] tracking-widest uppercase ${
                      mod.status === 'online' ? 'text-jarvis-success' : 'text-jarvis-dim'
                    }`}
                  >
                    {mod.status}
                  </span>
                </div>
                <ProgressBar value={mod.load} color={mod.status === 'online' ? 'glow' : 'glow'} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* API Status */}
      <div className="border-t border-jarvis-border/30 pt-4">
        <div className="font-display text-[9px] tracking-widest text-jarvis-dim uppercase mb-3 flex items-center gap-2">
          <Zap className="w-3 h-3" /> API Connection
        </div>
        <div className="space-y-2">
          {[
            { label: 'WebSocket', value: status.connected ? 'CONNECTED' : 'DISCONNECTED', ok: status.connected },
            { label: 'Latency', value: `${status.latency}ms`, ok: status.latency < 200 },
            { label: 'Backend', value: 'localhost:8000', ok: status.connected },
          ].map(({ label, value, ok }) => (
            <div key={label} className="flex items-center justify-between px-2 py-1.5 border border-jarvis-border/30 rounded">
              <span className="font-mono text-[9px] text-jarvis-dim tracking-widest">{label}</span>
              <span className={`font-mono text-[9px] tracking-widest ${ok ? 'text-jarvis-success' : 'text-jarvis-warn'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mode config */}
      <div className="border-t border-jarvis-border/30 pt-4">
        <div className="font-display text-[9px] tracking-widest text-jarvis-dim uppercase mb-3">
          Interaction Mode
        </div>
        <div className="space-y-2">
          {[
            { id: 'focus' as const, desc: 'Precise, direct answers' },
            { id: 'research' as const, desc: 'Deep search + synthesis' },
            { id: 'creative' as const, desc: 'Exploratory & imaginative' },
          ].map(({ id, desc }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`w-full flex items-center justify-between px-3 py-2 border rounded transition-all ${
                mode === id
                  ? 'border-jarvis-glow/50 bg-jarvis-glow/10 text-jarvis-glow'
                  : 'border-jarvis-border/40 text-jarvis-dim hover:border-jarvis-border'
              }`}
            >
              <span className="font-display text-[10px] tracking-widest uppercase">{id}</span>
              <span className="font-body text-[10px] text-jarvis-dim">{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
