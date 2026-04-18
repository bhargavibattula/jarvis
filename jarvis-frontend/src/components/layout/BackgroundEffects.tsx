import { motion } from 'framer-motion';
import { useJarvisStore } from '@/stores/jarvisStore';

export function BackgroundEffects() {
  const { isStreaming, status } = useJarvisStore();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radial glow at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 opacity-40"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(0, 212, 255, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Corner glows */}
      <div
        className="absolute top-0 left-0 w-64 h-64 opacity-20"
        style={{
          background: 'radial-gradient(circle at top-left, rgba(0, 212, 255, 0.2) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-64 h-64 opacity-20"
        style={{
          background: 'radial-gradient(circle at bottom-right, rgba(0, 255, 204, 0.15) 0%, transparent 60%)',
        }}
      />

      {/* Active streaming pulse */}
      {isStreaming && (
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0, 0.03, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0, 212, 255, 0.1) 0%, transparent 60%)',
          }}
        />
      )}

      {/* Floating data particles */}
      {status.connected && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px h-8 bg-gradient-to-b from-transparent via-jarvis-glow/30 to-transparent"
              style={{
                left: `${10 + i * 12}%`,
                top: '-10%',
              }}
              animate={{ y: ['0vh', '110vh'] }}
              transition={{
                duration: 8 + i * 1.5,
                repeat: Infinity,
                delay: i * 1.2,
                ease: 'linear',
              }}
            />
          ))}
        </>
      )}

      {/* Diagonal accent lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="diag" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="60" stroke="#00d4ff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diag)" />
      </svg>
    </div>
  );
}
