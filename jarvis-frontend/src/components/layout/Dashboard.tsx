import { motion } from 'framer-motion';
import { 
  Activity, 
  Cpu, 
  Database, 
  Globe, 
  Shield, 
  Zap, 
  Search, 
  Mail, 
  Calendar, 
  Code, 
  Cloud, 
  TrendingUp,
  Clock,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';
import { useJarvisStore } from '@/stores/jarvisStore';
import { JarvisOrb } from './JarvisOrb';
import { Panel, StatusDot, ProgressBar } from '../ui/Panel';
import { format } from 'date-fns';
import { cloneElement } from 'react';
import { clsx } from 'clsx';

export function Dashboard() {
  const { status, memories, activeAgentEvents, messages } = useJarvisStore();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar bg-jarvis-bg/50">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<Cpu className="w-4 h-4 text-jarvis-glow" />}
            label="Neural Load"
            value="14.2%"
            trend="+2.1%"
            color="glow"
          />
          <StatCard 
            icon={<Database className="w-4 h-4 text-jarvis-accent" />}
            label="Memory Core"
            value={`${memories.length}`}
            sublabel="Active nodes"
            color="accent"
          />
          <StatCard 
            icon={<Activity className="w-4 h-4 text-jarvis-success" />}
            label="System Latency"
            value={`${status.latency}ms`}
            sublabel="Steady state"
            color="success"
          />
          <StatCard 
            icon={<Shield className="w-4 h-4 text-jarvis-warn" />}
            label="Security Protocol"
            value="Active"
            sublabel="Level 4 bypass prevention"
            color="warn"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - System Overview */}
          <div className="lg:col-span-2 space-y-6">
            <Panel title="System Core Visualization" className="h-[400px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.05)_0%,transparent_70%)] pointer-events-none" />
              
              {/* Animated HUD Grid */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, var(--jarvis-glow) 1px, transparent 1px), linear-gradient(to bottom, var(--jarvis-glow) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              </div>

              <div className="flex flex-col items-center gap-8 relative z-10">
                <JarvisOrb size="lg" />
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-display font-bold tracking-[0.3em] text-white text-glow">
                    JARVIS <span className="text-jarvis-glow">V.2.0</span>
                  </h2>
                  <p className="text-jarvis-dim font-mono text-[9px] tracking-widest uppercase">
                    Quantum Neural Interface · Build 2024.12
                  </p>
                </div>
              </div>

              {/* Orbital HUD indicators */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] border border-jarvis-glow/10 rounded-full border-dashed animate-reverse-spin" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] border border-jarvis-accent/5 rounded-full animate-slow-spin" />
            </Panel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Panel title="Agent Network Status" className="h-[280px]">
                <div className="p-4 space-y-4">
                  <AgentStatus icon={<Globe />} name="Search Agent" status="idle" />
                  <AgentStatus icon={<Code />} name="Coder Pro" status="idle" />
                  <AgentStatus icon={<Mail />} name="Comm Unit" status="active" />
                  <AgentStatus icon={<Cloud />} name="Drive Sync" status="idle" />
                  <AgentStatus icon={<TrendingUp />} name="Finance Tracker" status="idle" />
                </div>
              </Panel>
              <Panel title="Active Processes" className="h-[280px]">
                <div className="p-4 space-y-5">
                 <ProcessItem label="Neural Synthesis" value={85} color="glow" />
                 <ProcessItem label="Semantic Indexing" value={42} color="accent" />
                 <ProcessItem label="Pattern Recognition" value={67} color="success" />
                 <ProcessItem label="Environment Mapping" value={15} color="warn" />
                </div>
              </Panel>
            </div>
          </div>

          {/* Right Column - Activity & Logs */}
          <div className="space-y-6">
            <Panel title="Recent Activity" className="h-[430px]">
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {messages.slice(-5).reverse().map((msg, i) => (
                    <div key={msg.id} className="flex gap-3">
                      <div className={clsx(
                        "mt-1 w-6 h-6 rounded-sm flex items-center justify-center shrink-0 border border-jarvis-border",
                        msg.role === 'user' ? "bg-jarvis-panel" : "bg-jarvis-glow/10"
                      )}>
                        {msg.role === 'user' ? <MessageSquare className="w-3 h-3 text-jarvis-dim" /> : <Zap className="w-3 h-3 text-jarvis-glow" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-display font-medium uppercase text-white tracking-widest">
                            {msg.role === 'user' ? 'Direct Input' : 'Response'}
                          </span>
                          <span className="text-[8px] font-mono text-jarvis-dim">
                            {format(msg.timestamp, 'HH:mm:ss')}
                          </span>
                        </div>
                        <p className="text-[11px] text-jarvis-text line-clamp-2 leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-2">
                      <Activity className="w-8 h-8 text-jarvis-dim" />
                      <span className="text-[10px] font-display tracking-widest uppercase">No recent activity</span>
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            <Panel title="System Diagnostics" className="h-[250px]">
               <div className="p-4 space-y-3 font-mono text-[9px] text-jarvis-dim uppercase tracking-widest">
                  <div className="flex justify-between items-center text-jarvis-success">
                    <span>{">"} WEBSOCKET_CONNECTED</span>
                    <span>OK</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{">"} LLM_ENDPOINT_READY</span>
                    <span>SONNET_3.5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{">"} MEMORY_CLUSTER_01</span>
                    <span>98.2% AVL</span>
                  </div>
                  <div className="flex justify-between items-center text-jarvis-warn">
                    <span>{">"} AGENT_ORCHESTRATOR</span>
                    <span>RE-INDEXING...</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-jarvis-border/30">
                    <div className="flex justify-between items-center mb-1">
                      <span>Neural Stability</span>
                      <span>99.9%</span>
                    </div>
                    <div className="w-full h-1 bg-jarvis-border rounded-full overflow-hidden">
                       <div className="w-[99.9%] h-full bg-jarvis-success shadow-glow-sm" />
                    </div>
                  </div>
               </div>
            </Panel>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value, sublabel, trend, color }: any) {
  return (
    <Panel className="p-4 flex flex-col gap-2 group hover:border-jarvis-glow/40 transition-colors">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-jarvis-bg rounded-md border border-jarvis-border">
          {icon}
        </div>
        {trend && (
          <span className="text-[9px] font-mono text-jarvis-success bg-jarvis-success/5 px-1.5 py-0.5 rounded border border-jarvis-success/20">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-display font-bold text-white tracking-tight">{value}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] font-display font-medium uppercase text-jarvis-dim tracking-widest">{label}</span>
          {sublabel && (
            <>
              <span className="text-jarvis-border text-[8px]">|</span>
              <span className="text-[8px] font-mono text-jarvis-dim/60 leading-none">{sublabel}</span>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}

function AgentStatus({ icon, name, status }: any) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-jarvis-bg/50 border border-jarvis-border/50 hover:border-jarvis-glow/20 transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-jarvis-panel border border-jarvis-border group-hover:border-jarvis-glow/30 transition-colors">
          {cloneElement(icon, { className: 'w-4 h-4 text-jarvis-dim group-hover:text-jarvis-glow transition-colors' })}
        </div>
        <div>
          <div className="text-[10px] font-display font-bold uppercase tracking-widest text-white">{name}</div>
          <div className="text-[8px] font-mono text-jarvis-dim uppercase tracking-tighter">Status: {status}</div>
        </div>
      </div>
      <StatusDot active={status === 'active'} size="sm" />
    </div>
  );
}

function ProcessItem({ label, value, color }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <span className="text-[9px] font-display font-medium uppercase tracking-widest text-jarvis-dim">
          {label}
        </span>
        <span className="text-[10px] font-mono text-white opacity-80">
          {value}%
        </span>
      </div>
      <ProgressBar value={value} color={color} />
    </div>
  );
}
