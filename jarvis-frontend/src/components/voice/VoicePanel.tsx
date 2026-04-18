import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Radio, Volume2, Square, Power } from 'lucide-react';
import { clsx } from 'clsx';
import { useJarvisStore } from '@/stores/jarvisStore';

type VoiceState = 'idle' | 'waking' | 'listening' | 'processing' | 'speaking';

interface VoicePanelProps {
  voiceState: VoiceState;
  lastTranscript: string;
  wakeDetected: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onManualListen: () => void;
  onStopListening: () => void;
}

const STATE_CONFIG: Record<VoiceState, { label: string; color: string; pulse: boolean }> = {
  idle:       { label: 'OFFLINE',       color: 'text-jarvis-dim',    pulse: false },
  waking:     { label: 'LISTENING FOR "HEY JARVIS"', color: 'text-jarvis-glow', pulse: true },
  listening:  { label: 'RECORDING COMMAND...', color: 'text-jarvis-accent', pulse: true },
  processing: { label: 'TRANSCRIBING & ROUTING...', color: 'text-jarvis-warn', pulse: true },
  speaking:   { label: 'SPEAKING RESPONSE...', color: 'text-jarvis-success', pulse: true },
};

const BARS = 28;

export function VoicePanel({
  voiceState,
  lastTranscript,
  wakeDetected,
  onActivate,
  onDeactivate,
  onManualListen,
  onStopListening,
}: VoicePanelProps) {
  const { voiceActive, isSpeaking, voiceFeedback, setVoiceFeedback, voiceError } = useJarvisStore();
  const cfg = STATE_CONFIG[voiceState];
  const isListening = voiceState === 'listening';
  const isWaking = voiceState === 'waking';

  return (
    <div className="flex flex-col gap-3 p-4 h-full overflow-y-auto custom-scrollbar">
      {/* Mic Error Callout */}
      <AnimatePresence>
        {voiceError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-jarvis-warn/10 border border-jarvis-warn/30 rounded p-3 mb-2"
          >
            <div className="flex items-start gap-2">
              <span className="text-jarvis-warn mt-0.5">⚠️</span>
              <p className="font-mono text-[10px] text-jarvis-warn leading-relaxed tracking-tight">
                {voiceError}
              </p>
            </div>
            <button 
              onClick={onActivate}
              className="mt-2 text-[9px] text-jarvis-glow underline underline-offset-2 uppercase tracking-widest font-mono"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className={clsx('w-3.5 h-3.5', cfg.color, cfg.pulse && 'animate-pulse')} />
          <span className="font-display text-[9px] tracking-widest text-jarvis-dim uppercase">
            Voice Assistant
          </span>
        </div>
        {/* TTS toggle */}
        <button
          onClick={() => setVoiceFeedback(!voiceFeedback)}
          className={clsx(
            'flex items-center gap-1 font-mono text-[8px] tracking-widest border rounded px-2 py-0.5 transition-all',
            voiceFeedback
              ? 'border-jarvis-success/50 text-jarvis-success bg-jarvis-success/10'
              : 'border-jarvis-border text-jarvis-dim hover:border-jarvis-glow/40'
          )}
        >
          <Volume2 className="w-2.5 h-2.5" />
          TTS:{voiceFeedback ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Waveform visualiser */}
      <div className="flex items-center justify-center gap-0.5 h-14 px-1">
        {[...Array(BARS)].map((_, i) => {
          const active = voiceState === 'listening' || voiceState === 'speaking';
          const baseH = active ? 15 + Math.abs(Math.sin(i * 0.6)) * 55 : isWaking ? 6 : 3;

          return (
            <motion.div
              key={i}
              className={clsx(
                'w-1 rounded-full',
                voiceState === 'listening'  ? 'bg-jarvis-accent' :
                voiceState === 'speaking'   ? 'bg-jarvis-success' :
                voiceState === 'waking'     ? 'bg-jarvis-glow/40' :
                voiceState === 'processing' ? 'bg-jarvis-warn' :
                'bg-jarvis-border/40'
              )}
              animate={
                active
                  ? { height: [`${baseH}%`, `${Math.min(100, baseH + 30)}%`, `${baseH}%`] }
                  : isWaking
                  ? { height: ['4%', '10%', '4%'] }
                  : { height: '3%' }
              }
              transition={{
                duration: active ? 0.4 + (i % 4) * 0.1 : 1.5,
                repeat: Infinity,
                delay: i * 0.04,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>

      {/* Status label */}
      <div className="text-center">
        <span className={clsx('font-mono text-[9px] tracking-widest uppercase', cfg.color, cfg.pulse && 'animate-pulse')}>
          ● {cfg.label}
        </span>
      </div>

      {/* Main mic button */}
      <div className="flex justify-center py-2">
        <div className="relative">
          {/* Pulse rings when active */}
          <AnimatePresence>
            {(isListening || isWaking) && (
              <>
                <motion.div
                  key="ring1"
                  className="absolute inset-0 rounded-full border border-jarvis-glow/30"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.7, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                <motion.div
                  key="ring2"
                  className="absolute inset-0 rounded-full border border-jarvis-glow/20"
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                />
              </>
            )}
          </AnimatePresence>

          {isListening ? (
            <button
              onClick={onStopListening}
              className="relative w-14 h-14 rounded-full border-2 border-jarvis-accent bg-jarvis-accent/20 text-jarvis-accent flex items-center justify-center transition-all hover:bg-jarvis-accent/30"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : voiceActive ? (
            <button
              onClick={onManualListen}
              disabled={voiceState === 'processing' || voiceState === 'speaking'}
              className={clsx(
                'relative w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all',
                isWaking
                  ? 'border-jarvis-glow/60 bg-jarvis-glow/10 text-jarvis-glow hover:bg-jarvis-glow/20'
                  : 'border-jarvis-border bg-jarvis-panel text-jarvis-dim opacity-50 cursor-not-allowed'
              )}
            >
              <Mic className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onActivate}
              className="relative w-14 h-14 rounded-full border-2 border-jarvis-border bg-jarvis-panel text-jarvis-dim flex items-center justify-center hover:border-jarvis-glow/40 hover:text-jarvis-glow transition-all"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Power toggle */}
      <div className="flex justify-center">
        <button
          onClick={voiceActive ? onDeactivate : onActivate}
          className={clsx(
            'flex items-center gap-2 px-4 py-1.5 rounded border font-mono text-[9px] tracking-widest uppercase transition-all',
            voiceActive
              ? 'border-jarvis-accent/60 text-jarvis-accent bg-jarvis-accent/10 hover:bg-jarvis-accent/20'
              : 'border-jarvis-border text-jarvis-dim hover:border-jarvis-glow/40 hover:text-jarvis-glow'
          )}
        >
          <Power className={clsx('w-3 h-3', voiceActive && 'animate-pulse')} />
          {voiceActive ? 'DEACTIVATE JARVIS' : 'ACTIVATE JARVIS'}
        </button>
      </div>

      {/* Wake word hint */}
      {voiceActive && !wakeDetected && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <span className="font-mono text-[8px] text-jarvis-dim tracking-widest">
            SAY <span className="text-jarvis-glow">"HEY JARVIS"</span> TO SPEAK
          </span>
          <br />
          <span className="font-mono text-[8px] text-jarvis-dim tracking-widest">
            OR TAP MIC FOR PUSH-TO-TALK
          </span>
        </motion.div>
      )}

      {/* Transcript display */}
      <AnimatePresence>
        {lastTranscript && (
          <motion.div
            key={lastTranscript}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-jarvis-glow/20 rounded bg-jarvis-glow/5 p-3"
          >
            <div className="font-mono text-[8px] text-jarvis-dim mb-1 tracking-widest">
              LAST COMMAND
            </div>
            <p className="font-body text-xs text-jarvis-text leading-relaxed">
              "{lastTranscript}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaking indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 border border-jarvis-success/30 rounded bg-jarvis-success/5 px-3 py-2"
          >
            <Volume2 className="w-3 h-3 text-jarvis-success animate-pulse" />
            <span className="font-mono text-[9px] text-jarvis-success tracking-widest">
              JARVIS IS SPEAKING...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="border-t border-jarvis-border/30 pt-3 space-y-1.5">
        <div className="font-mono text-[8px] text-jarvis-dim tracking-widest mb-2">TRY SAYING:</div>
        {[
          '"Hey Jarvis, open YouTube"',
          '"Hey Jarvis, what\'s the weather?"',
          '"Hey Jarvis, latest AI news"',
          '"Hey Jarvis, Bitcoin price"',
          '"Hey Jarvis, open Instagram"',
        ].map((ex) => (
          <div key={ex} className="font-body text-[10px] text-jarvis-dim/70 leading-relaxed">
            {ex}
          </div>
        ))}
      </div>
    </div>
  );
}
