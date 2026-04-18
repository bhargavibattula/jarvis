import { motion } from 'framer-motion';
import { 
  Activity, Cpu, Database, Globe, Shield, Zap, Search, Mail, Calendar, Code, 
  Cloud, TrendingUp, Clock, MessageSquare, Terminal, Send, Loader2, Mic, MicOff 
} from 'lucide-react';
import { useJarvisStore } from '@/stores/jarvisStore';
import { JarvisOrb } from './JarvisOrb';
import { Panel, StatusDot, ProgressBar } from '../ui/Panel';
import { format } from 'date-fns';
import { cloneElement, useState } from 'react';
import { clsx } from 'clsx';
import { useJarvisWebSocket } from '@/hooks/useWebSocket';
import { useVoice } from '@/hooks/useVoice';

export function Dashboard() {
  const { status, memories, activeAgentEvents, messages, mode, voiceListening } = useJarvisStore();
  const { sendMessage } = useJarvisWebSocket();
  const { startListening, stopListening, transcribe } = useVoice();
  const [inputValue, setInputValue] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue, mode);
    setInputValue('');
  };

  const handleMicClick = async () => {
    if (voiceListening) {
      stopListening();
    } else {
      const blobPromise = startListening();
      const blob = await blobPromise;
      if (blob) {
        setIsTranscribing(true);
        const text = await transcribe(blob);
        setIsTranscribing(false);
        if (text) {
          sendMessage(text, mode);
        }
      }
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-jarvis-bg/50">
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-7xl mx-auto space-y-6 pb-20"
        >
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard 
              icon={<Cpu className="w-4 h-4 text-jarvis-glow" />}
              label="Neural Load"
              value={status.connected ? "14.2%" : "0.0%"}
              trend={status.connected ? "+2.1%" : "OFFLINE"}
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
              value={status.connected ? `${status.latency}ms` : '---'}
              sublabel="Direct Link"
              color="success"
            />
            <StatCard 
              icon={<Shield className="w-4 h-4 text-jarvis-warn" />}
              label="Security Protocol"
              value={status.connected ? "Active" : "Secured"}
              sublabel="Neural Guard"
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
                      Quantum Neural Interface · Build 2025.1
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
                    <AgentStatus icon={<Globe />} name="Search Agent" status={status.activeAgents.includes('search') ? 'active' : 'idle'} />
                    <AgentStatus icon={<Code />} name="Coder Pro" status={status.activeAgents.includes('coder') ? 'active' : 'idle'} />
                    <AgentStatus icon={<Mail />} name="Comm Unit" status={status.activeAgents.includes('email') ? 'active' : 'idle'} />
                    <AgentStatus icon={<TrendingUp />} name="Finance Tracker" status={status.activeAgents.includes('finance') ? 'active' : 'idle'} />
                  </div>
                </Panel>
                <Panel title="Active Processes" className="h-[280px]">
                  <div className="p-4 space-y-5">
                   <ProcessItem label="Neural Synthesis" value={status.connected ? 85 : 0} color="glow" />
                   <ProcessItem label="Semantic Indexing" value={memories.length > 0 ? 42 : 0} color="accent" />
                   <ProcessItem label="Pattern Recognition" value={status.connected ? 67 : 0} color="success" />
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
                    {messages.slice(-10).reverse().map((msg) => (
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

              <Panel title="Neural Log (Real-time)" className="h-[250px]">
                 <div className="h-full overflow-y-auto p-4 space-y-2 font-mono text-[9px] text-jarvis-dim uppercase tracking-widest custom-scrollbar">
                    {!status.connected && (
                      <div className="flex justify-between items-center text-jarvis-warn">
                        <span>{">"} SYSTEM_OFFLINE</span>
                        <span className="animate-pulse">WAITING...</span>
                      </div>
                    )}
                    {status.connected && (
                      <div className="flex justify-between items-center text-jarvis-success">
                        <span>{">"} WEBSOCKET_CONNECTED</span>
                        <span>OK</span>
                      </div>
                    )}
                    {activeAgentEvents.slice(-10).map((event, i) => (
                      <div key={event.id || i} className={clsx(
                        "flex justify-between items-start gap-4",
                        event.event_type === 'error' ? 'text-jarvis-warn' : 'text-jarvis-glow'
                      )}>
                        <span>{">"} {event.agent ? `${event.agent}_` : ''}{event.event_type}</span>
                        <span className="text-right truncate max-w-[100px]">
                          {event.event_type === 'token' ? '...' : (event.data?.tool as string || 'OK')}
                        </span>
                      </div>
                    ))}
                 </div>
              </Panel>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Access Input */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-jarvis-glow/20 via-jarvis-accent/20 to-jarvis-glow/20 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center gap-2 p-2 bg-jarvis-panel/90 backdrop-blur-md border border-jarvis-border rounded-lg shadow-2xl">
            <div className="flex items-center justify-center w-10 h-10 rounded bg-jarvis-bg border border-jarvis-border">
              <Terminal className="w-4 h-4 text-jarvis-dim" />
            </div>
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={voiceListening ? "LISTENING..." : "DIRECT COMMAND INPUT..."}
              className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white placeholder:text-jarvis-dim/40 tracking-widest"
            />
            
            <button 
              onClick={handleMicClick}
              className={clsx(
                "flex items-center justify-center w-10 h-10 rounded-full transition-all relative group",
                voiceListening ? "bg-jarvis-accent/20 text-jarvis-accent shadow-glow-accent" : "bg-jarvis-panel text-jarvis-dim hover:text-jarvis-glow"
              )}
            >
              {voiceListening && (
                <motion.div 
                  className="absolute inset-0 rounded-full border border-jarvis-accent"
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
              {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin text-jarvis-glow" /> : voiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button 
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="flex items-center justify-center w-10 h-10 rounded bg-jarvis-glow/10 text-jarvis-glow hover:bg-jarvis-glow hover:text-white transition-all disabled:opacity-20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
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
          <span className={clsx(
            "text-[9px] font-mono px-1.5 py-0.5 rounded border",
            trend === 'OFFLINE' ? 'text-jarvis-warn border-jarvis-warn/20 bg-jarvis-warn/5' : 'text-jarvis-success border-jarvis-success/20 bg-jarvis-success/5'
          )}>
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
