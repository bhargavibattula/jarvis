import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Radio } from 'lucide-react';
import { useJarvisStore } from '@/stores/jarvisStore';
import { useVoice } from '@/hooks/useVoice';
import { clsx } from 'clsx';

interface VoicePanelProps {
  onTranscript?: (text: string) => void;
}

export function VoicePanel({ onTranscript }: VoicePanelProps) {
  const { voiceListening, voiceActive, setVoiceListening, setVoiceActive } = useJarvisStore();
  const { startListening, stopListening, transcribe } = useVoice();
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<Promise<Blob | null> | null>(null);

  const handleMicToggle = async () => {
    if (voiceListening) {
      stopListening();
      setIsProcessing(true);
      // Wait for the blob
      setTimeout(async () => {
        setIsProcessing(false);
      }, 1000);
    } else {
      setTranscript('');
      recordingRef.current = startListening();
      const blob = await recordingRef.current;
      if (blob) {
        setIsProcessing(true);
        const text = await transcribe(blob);
        setIsProcessing(false);
        if (text) {
          setTranscript(text);
          onTranscript?.(text);
        }
      }
    }
  };

  // Waveform bars
  const bars = 24;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Waveform visualization */}
      <div className="flex items-center justify-center gap-0.5 h-12 w-full">
        {[...Array(bars)].map((_, i) => {
          const delay = (i / bars) * 1;
          const height = voiceListening
            ? `${20 + Math.sin(i * 0.8) * 50 + 30}%`
            : isProcessing
            ? `${30 + Math.random() * 40}%`
            : '15%';

          return (
            <div
              key={i}
              className={clsx(
                'w-1 rounded-full transition-all duration-100',
                voiceListening ? 'bg-jarvis-accent' : isProcessing ? 'bg-jarvis-glow' : 'bg-jarvis-border'
              )}
              style={{
                height,
                animation: voiceListening ? `audioWave ${0.4 + Math.random() * 0.4}s ease-in-out infinite` : undefined,
                '--delay': `${delay}s`,
                animationDelay: `${delay}s`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      {/* Mic button */}
      <div className="relative">
        {voiceListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border border-jarvis-accent/40"
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-jarvis-accent/30"
              animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </>
        )}
        <button
          onClick={handleMicToggle}
          disabled={isProcessing}
          className={clsx(
            'relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300',
            voiceListening
              ? 'border-jarvis-accent bg-jarvis-accent/20 text-jarvis-accent shadow-glow-accent'
              : 'border-jarvis-border bg-jarvis-panel text-jarvis-dim hover:border-jarvis-glow/60 hover:text-jarvis-glow',
            isProcessing && 'opacity-60 cursor-not-allowed'
          )}
        >
          {voiceListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>

      {/* Status */}
      <div className="font-mono text-[9px] tracking-widest text-center">
        {voiceListening ? (
          <span className="text-jarvis-accent animate-pulse">● RECORDING</span>
        ) : isProcessing ? (
          <span className="text-jarvis-glow animate-pulse">⟳ TRANSCRIBING</span>
        ) : (
          <span className="text-jarvis-dim">CLICK TO SPEAK</span>
        )}
      </div>

      {/* Transcript */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full px-3 py-2 border border-jarvis-glow/20 rounded bg-jarvis-glow/5"
          >
            <div className="font-mono text-[9px] text-jarvis-dim mb-1 tracking-widest">TRANSCRIPT</div>
            <p className="font-body text-xs text-jarvis-text">{transcript}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
