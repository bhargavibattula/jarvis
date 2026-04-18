/**
 * useVoiceAssistant.ts
 * ────────────────────
 * The full wake-word → STT → Orchestrator → TTS loop.
 */
import { useRef, useCallback, useEffect, useState } from 'react';
import { useJarvisStore } from '@/stores/jarvisStore';
import { useVoice } from './useVoice';

const WAKE_WORDS = ['hey jarvis', 'jarvis', 'hey jarvis!', 'ok jarvis', 'okay jarvis'];
const MAX_COMMAND_DURATION_MS = 10000;

type VoiceState = 'idle' | 'waking' | 'listening' | 'processing' | 'speaking';

export function useVoiceAssistant(
  sendMessage: (text: string, mode: any) => boolean
) {
  const { voiceActive, voiceFeedback, mode, setVoiceListening, setVoiceActive, setVoiceError } = useJarvisStore();
  const { startListening, stopListening, transcribe, speak } = useVoice();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [lastTranscript, setLastTranscript] = useState('');
  const [wakeDetected, setWakeDetected] = useState(false);

  const wakeRecRef = useRef<any>(null);
  const commandRecRef = useRef<any>(null);
  const commandTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isActiveRef = useRef(false);

  // ── 1. Basic Helpers (No dependencies on other hooks) ────────────────────

  const stopAllRecognition = useCallback(() => {
    if (wakeRecRef.current) {
      wakeRecRef.current.onend = null;
      try { wakeRecRef.current.abort(); } catch (_) {}
      wakeRecRef.current = null;
    }
    if (commandRecRef.current) {
      commandRecRef.current.onend = null;
      commandRecRef.current.onspeechend = null;
      try { commandRecRef.current.abort(); } catch (_) {}
      commandRecRef.current = null;
    }
  }, []);

  const playChirp = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  }, []);

  // ── 2. The "Stop" action (referenced by many) ─────────────────────────────

  const deactivateVoiceAssistant = useCallback(() => {
    console.log('[JARVIS] Deactivating voice assistant');
    isActiveRef.current = false;
    setVoiceActive(false);
    setVoiceState('idle');
    setWakeDetected(false);
    setVoiceListening(false);
    stopAllRecognition();
    clearTimeout(commandTimerRef.current);
    stopListening();
  }, [setVoiceActive, setVoiceListening, stopListening, stopAllRecognition]);

  // ── 3. The "Record Command" logic ─────────────────────────────────────────

  const startCommandRecording = useCallback(async () => {
    console.log('[JARVIS] Starting command recording');
    setVoiceState('listening');
    setWakeDetected(true);
    playChirp();

    const blobPromise = startListening();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const vrec = new SpeechRecognition();
      vrec.lang = 'en-US';
      commandRecRef.current = vrec;
      vrec.onspeechend = () => stopListening();
      vrec.onerror = () => stopListening();
      vrec.onend = () => stopListening();
      try { vrec.start(); } catch (_) {}
    }

    commandTimerRef.current = setTimeout(() => stopListening(), MAX_COMMAND_DURATION_MS);

    const blob = await blobPromise;
    clearTimeout(commandTimerRef.current);
    if (commandRecRef.current) {
      commandRecRef.current.onend = null;
      try { commandRecRef.current.abort(); } catch (_) {}
      commandRecRef.current = null;
    }

    if (!blob || !isActiveRef.current) {
      if (isActiveRef.current) startWakeWordDetection();
      return;
    }

    setVoiceState('processing');
    const transcript = await transcribe(blob);
    
    if (!transcript.trim() || transcript.length < 2) {
      if (isActiveRef.current) startWakeWordDetection();
      return;
    }

    setLastTranscript(transcript);
    const lower = transcript.toLowerCase();
    
    // Quick-open handling
    const websiteMap: Record<string, string> = {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com',
      google: 'https://google.com',
      github: 'https://github.com',
    };
    const site = Object.keys(websiteMap).find(k => lower.includes(k) && lower.includes('open'));
    if (site) window.open(websiteMap[site], '_blank');

    sendMessage(transcript, mode);
  }, [startListening, stopListening, transcribe, sendMessage, mode, playChirp]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 4. The "Wake Word" listener ───────────────────────────────────────────

  const startWakeWordDetection = useCallback(() => {
    if (!isActiveRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    stopAllRecognition();

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    wakeRecRef.current = rec;

    rec.onresult = (event: any) => {
      const spoken = event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (WAKE_WORDS.some(ww => spoken.includes(ww))) {
        rec.onend = null;
        rec.stop();
        startCommandRecording();
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setVoiceError('Microphone blocked. Please allow access.');
        deactivateVoiceAssistant();
      }
    };

    rec.onend = () => {
      if (isActiveRef.current) setTimeout(() => startWakeWordDetection(), 200);
    };

    try {
      rec.start();
      setVoiceState('waking');
      setWakeDetected(false);
    } catch (_) {}
  }, [startCommandRecording, setVoiceError, deactivateVoiceAssistant, stopAllRecognition]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 5. The "TTS Loop" handler ─────────────────────────────────────────────

  const speakAndResume = useCallback(
    async (text: string) => {
      setVoiceState('speaking');
      await speak(text, () => {
        if (isActiveRef.current) {
          setWakeDetected(false);
          startWakeWordDetection();
        } else {
          setVoiceState('idle');
        }
      });
    },
    [speak, startWakeWordDetection]
  );

  const onResponseReady = useCallback(
    (fullResponse: string) => {
      if (!voiceFeedback) return;
      speakAndResume(fullResponse);
    },
    [voiceFeedback, speakAndResume]
  );

  // ── 6. UI Exposed Actions ──────────────────────────────────────────────────

  const activateVoiceAssistant = useCallback(async () => {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      isActiveRef.current = true;
      setVoiceActive(true);
      startWakeWordDetection();
    } catch (err: any) {
      setVoiceError('Mic access denied.');
    }
  }, [startWakeWordDetection, setVoiceActive, setVoiceError]);

  const manualListen = useCallback(async () => {
    if (voiceState !== 'idle' && voiceState !== 'waking') return;
    stopAllRecognition();
    startCommandRecording();
  }, [voiceState, startCommandRecording, stopAllRecognition]);

  // Initial cleanup
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      stopAllRecognition();
    };
  }, [stopAllRecognition]);

  return {
    voiceState,
    lastTranscript,
    wakeDetected,
    activateVoiceAssistant,
    deactivateVoiceAssistant,
    manualListen,
    stopListening,
    onResponseReady,
  };
}
