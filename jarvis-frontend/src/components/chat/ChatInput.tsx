import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, ChevronUp, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { useJarvisStore } from '@/stores/jarvisStore';
import { useVoice } from '@/hooks/useVoice';

const SUGGESTIONS = [
  "What's the weather like in Mumbai right now?",
  'Summarize the latest AI news',
  'Write a Python async function to fetch data from an API',
  "What's the current Bitcoin price?",
  'Search for recent developments in LLMs',
];

interface ChatInputProps {
  onSend: (message: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isStreaming, mode } = useJarvisStore();
  const { startListening, stopListening, transcribe } = useVoice();

  const handleSend = useCallback(() => {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    onSend(msg);
    setInput('');
    setShowSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isStreaming, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  };

  const handleMic = async () => {
    if (isRecording) {
      stopListening();
      setIsRecording(false);
      return;
    }
    setIsRecording(true);
    const blob = await startListening();
    setIsRecording(false);
    if (blob) {
      const text = await transcribe(blob);
      if (text) {
        setInput((prev) => (prev ? `${prev} ${text}` : text));
        textareaRef.current?.focus();
      }
    }
  };

  const canSend = input.trim().length > 0 && !isStreaming;

  return (
    <div className="relative px-4 pb-4 pt-2">
      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && !input && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-4 right-4 mb-2 border border-jarvis-border bg-jarvis-panel rounded overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-jarvis-border/50 flex items-center gap-2">
              <Zap className="w-3 h-3 text-jarvis-glow" />
              <span className="font-display text-[9px] tracking-widest text-jarvis-dim uppercase">Suggested</span>
            </div>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(s);
                  setShowSuggestions(false);
                  textareaRef.current?.focus();
                }}
                className="w-full text-left px-3 py-2 font-body text-xs text-jarvis-text hover:bg-jarvis-glow/10 hover:text-jarvis-glow border-b border-jarvis-border/20 last:border-0 transition-all"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input container */}
      <div
        className={clsx(
          'relative flex items-end gap-2 border rounded transition-all duration-300',
          'bg-jarvis-panel/80 backdrop-blur-sm',
          input || showSuggestions
            ? 'border-jarvis-glow/40 shadow-glow-sm'
            : 'border-jarvis-border hover:border-jarvis-border/80'
        )}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-jarvis-glow/50 rounded-tl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-jarvis-glow/50 rounded-br" />

        {/* Suggestions toggle */}
        <button
          onClick={() => setShowSuggestions((v) => !v)}
          className="flex-shrink-0 mb-2 ml-3 text-jarvis-dim hover:text-jarvis-glow transition-colors"
        >
          <motion.div animate={{ rotate: showSuggestions ? 180 : 0 }}>
            <ChevronUp className="w-4 h-4" />
          </motion.div>
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => !input && setShowSuggestions(false)}
          placeholder="Command Jarvis..."
          rows={1}
          className="flex-1 bg-transparent py-3 font-body text-sm text-jarvis-text placeholder-jarvis-border/60 outline-none resize-none leading-relaxed"
          style={{ minHeight: '44px', maxHeight: '160px' }}
          disabled={isStreaming}
        />

        {/* Right controls */}
        <div className="flex items-center gap-1 mb-2 mr-2">
          {/* Voice */}
          <button
            onClick={handleMic}
            className={clsx(
              'w-8 h-8 rounded flex items-center justify-center border transition-all',
              isRecording
                ? 'border-jarvis-accent/60 text-jarvis-accent bg-jarvis-accent/10'
                : 'border-transparent text-jarvis-dim hover:text-jarvis-glow hover:border-jarvis-glow/30'
            )}
          >
            {isRecording ? (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
                <MicOff className="w-3.5 h-3.5" />
              </motion.div>
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={clsx(
              'w-8 h-8 rounded border flex items-center justify-center transition-all duration-200',
              canSend
                ? 'border-jarvis-glow/60 text-jarvis-glow bg-jarvis-glow/10 hover:bg-jarvis-glow/20 hover:shadow-glow-sm active:scale-95'
                : 'border-jarvis-border/30 text-jarvis-border cursor-not-allowed'
            )}
          >
            {isStreaming ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-3 h-3 border border-jarvis-glow/60 border-t-jarvis-glow rounded-full" />
              </motion.div>
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="font-mono text-[8px] text-jarvis-border tracking-widest">
          ENTER TO SEND · SHIFT+ENTER FOR NEWLINE
        </span>
        <span className="font-mono text-[8px] text-jarvis-dim tracking-widest uppercase">
          MODE: {mode}
        </span>
      </div>
    </div>
  );
}
