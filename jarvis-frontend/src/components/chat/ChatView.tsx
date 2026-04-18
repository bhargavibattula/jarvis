import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '@/stores/jarvisStore';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { useJarvisWebSocket } from '@/hooks/useWebSocket';
import { Terminal } from 'lucide-react';

export function ChatView() {
  const { messages, mode } = useJarvisStore();
  const { sendMessage } = useJarvisWebSocket();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messages[messages.length - 1]?.content]);

  const handleSend = (msg: string) => {
    sendMessage(msg, mode);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center py-16"
            >
              <div className="mb-6 relative">
                <div className="w-16 h-16 rounded-full border-2 border-jarvis-glow/30 flex items-center justify-center">
                  <Terminal className="w-7 h-7 text-jarvis-glow/60" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border border-jarvis-glow/20"
                  animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <h2 className="font-display text-xl font-bold text-jarvis-glow/80 tracking-widest mb-2">
                JARVIS ONLINE
              </h2>
              <p className="font-body text-sm text-jarvis-dim max-w-xs leading-relaxed">
                Your personal AI assistant is ready. Ask me anything — search the web, write code, manage email, check finances, and more.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-sm">
                {[
                  'Latest AI news',
                  'Write Python code',
                  "Today's weather",
                  'Bitcoin price',
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="px-3 py-2 border border-jarvis-border/60 rounded text-xs font-body text-jarvis-dim hover:border-jarvis-glow/40 hover:text-jarvis-glow hover:bg-jarvis-glow/5 transition-all text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-jarvis-border/40">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
