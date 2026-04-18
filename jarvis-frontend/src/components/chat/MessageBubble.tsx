import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx } from 'clsx';
import { User, Cpu } from 'lucide-react';
import type { ChatMessage } from '@/stores/jarvisStore';
import { useJarvisStore } from '@/stores/jarvisStore';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2 px-1">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-jarvis-glow"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { currentStreamContent } = useJarvisStore();
  const isUser = message.role === 'user';
  const content = message.isStreaming ? currentStreamContent : message.content;
  const isEmpty = !content && message.isStreaming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={clsx('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'flex-shrink-0 w-8 h-8 rounded flex items-center justify-center border',
          isUser
            ? 'bg-jarvis-muted/30 border-jarvis-border text-jarvis-dim'
            : 'bg-jarvis-glow/10 border-jarvis-glow/30 text-jarvis-glow'
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" />
        ) : (
          <Cpu className="w-3.5 h-3.5 drop-shadow-glow" />
        )}
      </div>

      {/* Content */}
      <div className={clsx('flex flex-col gap-1 max-w-[78%]', isUser ? 'items-end' : 'items-start')}>
        {/* Header */}
        <div className="flex items-center gap-2 px-1">
          <span className="font-display text-[9px] tracking-widest uppercase text-jarvis-dim">
            {isUser ? 'YOU' : 'JARVIS'}
          </span>
          <span className="font-mono text-[9px] text-jarvis-border">
            {format(message.timestamp, 'HH:mm:ss')}
          </span>
          {message.isStreaming && (
            <span className="font-mono text-[9px] text-jarvis-glow animate-pulse">STREAMING</span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={clsx(
            'relative px-4 py-3 border text-sm leading-relaxed',
            isUser
              ? [
                  'bg-jarvis-muted/20 border-jarvis-muted/40 text-jarvis-text',
                  'rounded rounded-tr-none',
                ]
              : [
                  'bg-jarvis-panel/80 border-jarvis-glow/20 text-jarvis-text',
                  'rounded rounded-tl-none',
                  'shadow-[0_0_20px_rgba(0,212,255,0.06)]',
                ]
          )}
        >
          {/* Corner accent for assistant */}
          {!isUser && (
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-jarvis-glow/60" />
          )}
          {isUser && (
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-jarvis-dim/60" />
          )}

          {isEmpty ? (
            <TypingIndicator />
          ) : (
            <div className={clsx('prose prose-invert prose-sm max-w-none', 'font-body')}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match) {
                      return (
                        <div className="mt-2 mb-2 rounded overflow-hidden border border-jarvis-border">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-jarvis-muted/20 border-b border-jarvis-border">
                            <span className="font-mono text-[9px] text-jarvis-dim tracking-widest uppercase">
                              {match[1]}
                            </span>
                          </div>
                          <pre className="p-3 overflow-x-auto text-[12px] font-mono leading-relaxed text-jarvis-glow/90 bg-jarvis-bg/60">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-jarvis-glow/10 text-jarvis-glow border border-jarvis-glow/20"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto mt-2 mb-2 border border-jarvis-border rounded">
                        <table className="w-full text-sm">{children}</table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="px-3 py-2 text-left font-display text-[10px] tracking-widest uppercase text-jarvis-glow bg-jarvis-muted/20 border-b border-jarvis-border">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="px-3 py-2 border-b border-jarvis-border/40 text-jarvis-text font-body text-xs">
                        {children}
                      </td>
                    );
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-2 border-jarvis-glow/60 pl-3 italic text-jarvis-dim">
                        {children}
                      </blockquote>
                    );
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-jarvis-glow hover:text-jarvis-accent underline decoration-jarvis-glow/40 transition-colors"
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
              {message.isStreaming && content && (
                <span className="inline-block w-0.5 h-4 bg-jarvis-glow ml-0.5 align-text-bottom animate-pulse" />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
