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
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          stream.getTracks().forEach((t) => t.stop());
          setVoiceListening(false);
          resolve(blob);
        };
        recorder.start();
        setVoiceListening(true);
      });
    } catch (err) {
      console.error('Mic access error:', err);
      setVoiceListening(false);
      return null;
    }
  }, [setVoiceListening]);

  const stopListening = useCallback(() => {
    mediaRef.current?.stop();
  }, []);

  const transcribe = useCallback(async (blob: Blob): Promise<string> => {
    const ext = blob.type.split('/')[1]?.split(';')[0] || 'webm';
    const formData = new FormData();
    formData.append('audio', blob, `recording.${ext}`);
    try {
      const res = await fetch('/api/voice/transcribe', { method: 'POST', body: formData });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Transcription API error:', res.status, errText);
        return '';
      }
      const data = await res.json();
      return data.transcript || '';
    } catch (err) {
      console.error('Transcription network error:', err);
      return '';
    }
  }, []);


  const speak = useCallback(async (text: string) => {
    try {
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
    } catch (err) {
      console.error('Speech synthesis failed:', err);
    }
  }, []);

  return { startListening, stopListening, transcribe, speak };
}
