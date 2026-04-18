import { motion } from 'framer-motion';
import { Activity, Cpu, Database, Wifi, WifiOff, Clock, Mic, MicOff } from 'lucide-react';
import { useJarvisStore } from '@/stores/jarvisStore';
import { StatusDot } from '@/components/ui/Panel';
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

export function TopBar() {
  const { status, mode, setMode, voiceFeedback, setVoiceFeedback, voiceActive, voiceListening, isSpeaking } = useJarvisStore();
  const [time, setTime] = useState(new Date());
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
      setUptime((u) => u + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const modes = ['focus', 'research', 'creative'] as const;

  return (
    <div className="relative flex items-center h-12 px-6 border-b border-jarvis-border bg-jarvis-bg/80 backdrop-blur-sm z-50">
      {/* Left: Logo */}
      <div className="flex items-center gap-3 w-64">
        <div className="relative">
          <div className="w-6 h-6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-jarvis-glow" strokeWidth="1.5">
              <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" />
              <polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" opacity="0.5" />
              <circle cx="12" cy="12" r="2" fill="rgba(0,212,255,0.6)" stroke="none" />
            </svg>
          </div>
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: '0 0 12px rgba(0, 212, 255, 0.6)',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          />
        </div>
        <div>
          <div className="font-display text-sm font-bold tracking-[0.2em] text-jarvis-glow text-glow leading-none">
            JARVIS
          </div>
          <div className="font-mono text-[8px] text-jarvis-dim tracking-widest">
            ADVANCED INTELLIGENCE SYSTEM
          </div>
        </div>
      </div>

      {/* Center: Mode selector */}
      <div className="flex-1 flex items-center justify-center gap-1">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`
              relative px-4 py-1 font-display text-[10px] tracking-[0.2em] uppercase transition-all duration-200
              ${mode === m
                ? 'text-jarvis-glow border border-jarvis-glow/60 bg-jarvis-glow/10 shadow-glow-sm'
                : 'text-jarvis-dim border border-transparent hover:text-jarvis-text hover:border-jarvis-border'
              }
            `}
          >
            {m}
            {mode === m && (
              <motion.div
                layoutId="mode-indicator"
                className="absolute bottom-0 left-2 right-2 h-px bg-jarvis-glow"
              />
            )}
          </button>
        ))}
      </div>

      {/* Right: Status indicators */}
      <div className="flex items-center gap-5 w-64 justify-end">
        {/* Connection */}
        <div className="flex items-center gap-2">
          {status.connected ? (
            <Wifi className="w-3 h-3 text-jarvis-success" />
          ) : (
            <WifiOff className="w-3 h-3 text-jarvis-warn animate-pulse" />
          )}
          <span className="font-mono text-[9px] text-jarvis-dim">
            {status.connected ? `${status.latency}ms` : 'OFFLINE'}
          </span>
        </div>

        <button
          onClick={() => setVoiceFeedback(!voiceFeedback)}
          title={voiceActive ? 'Voice assistant active' : 'Toggle voice feedback'}
          className="flex items-center gap-1.5 group mr-2"
        >
          {voiceActive || voiceListening || isSpeaking ? (
            <Mic className="w-3 h-3 text-jarvis-accent animate-pulse" />
          ) : voiceFeedback ? (
            <Mic className="w-3 h-3 text-jarvis-glow" />
          ) : (
            <MicOff className="w-3 h-3 text-jarvis-dim group-hover:text-jarvis-warn transition-colors" />
          )}
          <span className={clsx(
            'font-mono text-[9px] tracking-widest transition-colors',
            isSpeaking     ? 'text-jarvis-success animate-pulse' :
            voiceListening ? 'text-jarvis-accent animate-pulse' :
            voiceActive    ? 'text-jarvis-glow' :
            voiceFeedback  ? 'text-jarvis-glow' :
                             'text-jarvis-dim group-hover:text-jarvis-warn'
          )}>
            {isSpeaking     ? 'SPEAKING' :
             voiceListening ? 'LISTENING' :
             voiceActive    ? 'VOICE:ACTIVE' :
             voiceFeedback  ? 'VOICE:ON' :
                              'VOICE:OFF'}
          </span>
        </button>

        {/* CPU */}
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-jarvis-dim" />
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1 h-3 rounded-sm transition-all duration-300 ${
                  i < (status.connected ? 3 : 1)
                    ? 'bg-jarvis-glow/70'
                    : 'bg-jarvis-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-jarvis-dim" />
          <span className="font-mono text-[9px] text-jarvis-dim">
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>

        {/* Status dot */}
        <StatusDot active={status.connected} />
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div className="h-full bg-gradient-to-r from-transparent via-jarvis-glow/40 to-transparent" />
      </div>
    </div>
  );
}
