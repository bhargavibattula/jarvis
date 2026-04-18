import { useRef, useCallback } from 'react';
import { useJarvisStore } from '@/stores/jarvisStore';

export function useVoice() {
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { setVoiceListening, setIsSpeaking } = useJarvisStore();

  const startListening = useCallback(async (): Promise<Blob | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      // Prefer high-quality opus container
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ].find((m) => MediaRecorder.isTypeSupported(m));

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      mediaRef.current = recorder;

      return new Promise((resolve) => {
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const type = recorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type });
          stream.getTracks().forEach((t) => t.stop());
          setVoiceListening(false);
          resolve(blob);
        };
        recorder.start();
        setVoiceListening(true);
      });
    } catch (err) {
      console.error('[JARVIS] Mic access error:', err);
      setVoiceListening(false);
      return null;
    }
  }, [setVoiceListening]);

  const stopListening = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop();
    }
  }, []);

  const transcribe = useCallback(async (blob: Blob): Promise<string> => {
    const extMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
    };
    const mime = blob.type.split(';')[0];
    const ext = extMap[mime] || 'webm';

    const formData = new FormData();
    formData.append('audio', blob, `recording.${ext}`);

    try {
      const res = await fetch('/api/voice/transcribe', { method: 'POST', body: formData });
      if (!res.ok) return '';
      const data = await res.json();
      return data.transcript || '';
    } catch (err) {
      console.error('[JARVIS] Transcription error:', err);
      return '';
    }
  }, []);

  const speak = useCallback(
    async (text: string, onEnd?: () => void) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Clean text for natural speech
      const clean = text
        .replace(/```[\s\S]*?```/g, ' [I have provided the information in the window] ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*#]/g, '')
        .trim();

      if (!clean) {
        onEnd?.();
        return;
      }

      try {
        setIsSpeaking(true);
        const res = await fetch('/api/voice/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean }),
        });
        
        if (!res.ok) {
          setIsSpeaking(false);
          onEnd?.();
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
          audioRef.current = null;
          onEnd?.();
        };

        await audio.play();
      } catch (err) {
        console.error('[JARVIS] TTS error:', err);
        setIsSpeaking(false);
        onEnd?.();
      }
    },
    [setIsSpeaking]
  );

  return { startListening, stopListening, transcribe, speak };
}
