import { useRef, useCallback } from 'react';
import { useJarvisStore } from '@/stores/jarvisStore';

export function useVoice() {
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { setVoiceListening } = useJarvisStore();

  const startListening = useCallback(async (): Promise<Blob | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRef.current = recorder;

      return new Promise((resolve) => {
        recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach((t) => t.stop());
          setVoiceListening(false);
          resolve(blob);
        };
        recorder.start();
        setVoiceListening(true);
      });
    } catch {
      setVoiceListening(false);
      return null;
    }
  }, [setVoiceListening]);

  const stopListening = useCallback(() => {
    mediaRef.current?.stop();
  }, []);

  const transcribe = useCallback(async (blob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    try {
      const res = await fetch('/api/voice/transcribe', { method: 'POST', body: formData });
      const data = await res.json();
      return data.text || '';
    } catch {
      return '';
    }
  }, []);

  return { startListening, stopListening, transcribe };
}
