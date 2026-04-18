import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useJarvisStore } from '@/stores/jarvisStore';

interface JarvisOrbProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function JarvisOrb({ size = 'md', className }: JarvisOrbProps) {
  const { isStreaming, currentAgent, voiceListening, status } = useJarvisStore();

  const dim = { sm: 80, md: 140, lg: 200 }[size];
  const isActive = isStreaming || voiceListening || !!currentAgent;

  return (
    <div
      className={clsx('relative flex items-center justify-center', className)}
      style={{ width: dim, height: dim }}
    >
      {/* Outer pulsing rings */}
      {isActive && (
        <>
          <motion.div
            className="absolute rounded-full border border-jarvis-glow/20"
            style={{ width: dim * 1.6, height: dim * 1.6 }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute rounded-full border border-jarvis-glow/30"
            style={{ width: dim * 1.35, height: dim * 1.35 }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
          />
        </>
      )}

      {/* Rotating outer ring */}
      <div
        className="absolute rounded-full border border-dashed border-jarvis-glow/30"
        style={{
          width: dim * 1.15,
          height: dim * 1.15,
          animation: 'ringRotate 12s linear infinite',
        }}
      />

      {/* Rotating inner ring (reverse) */}
      <div
        className="absolute rounded-full border border-jarvis-accent/20"
        style={{
          width: dim * 1.05,
          height: dim * 1.05,
          borderStyle: 'dashed',
          animation: 'ringRotateReverse 8s linear infinite',
          borderSpacing: '4px',
        }}
      />

      {/* Main orb */}
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{ width: dim, height: dim }}
        animate={isActive ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Core gradient */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 35% 35%, rgba(0, 255, 255, 0.25) 0%, transparent 50%),
              radial-gradient(circle at 65% 65%, rgba(0, 255, 204, 0.15) 0%, transparent 50%),
              radial-gradient(circle at center, rgba(0, 40, 80, 0.95) 0%, rgba(2, 4, 8, 0.98) 100%)
            `,
            boxShadow: isActive
              ? `0 0 ${dim * 0.4}px rgba(0, 212, 255, 0.6), inset 0 0 ${dim * 0.3}px rgba(0, 212, 255, 0.15)`
              : `0 0 ${dim * 0.2}px rgba(0, 212, 255, 0.3), inset 0 0 ${dim * 0.2}px rgba(0, 212, 255, 0.08)`,
          }}
        />

        {/* Scanning line */}
        <div
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{ opacity: isActive ? 0.6 : 0.2 }}
        >
          <div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-jarvis-glow to-transparent"
            style={{ animation: 'scan 2s ease-in-out infinite' }}
          />
        </div>

        {/* Inner glow ring */}
        <div
          className="absolute rounded-full border"
          style={{
            inset: '15%',
            borderColor: `rgba(0, 212, 255, ${isActive ? 0.4 : 0.15})`,
            boxShadow: `inset 0 0 10px rgba(0, 212, 255, ${isActive ? 0.2 : 0.05})`,
          }}
        />

        {/* Center core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="rounded-full"
            style={{
              width: dim * 0.25,
              height: dim * 0.25,
              background: 'radial-gradient(circle, rgba(0,255,255,0.9) 0%, rgba(0,180,255,0.6) 50%, transparent 100%)',
              boxShadow: `0 0 ${dim * 0.15}px rgba(0, 255, 255, 0.8)`,
            }}
            animate={
              isActive
                ? { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }
                : { scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }
            }
            transition={{ duration: isActive ? 0.8 : 2, repeat: Infinity }}
          />
        </div>

        {/* Voice wave rings when listening */}
        {voiceListening && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-jarvis-accent/60"
                style={{ width: dim * 0.2 * i, height: dim * 0.2 * i }}
                animate={{ scale: [0.8, 1.4], opacity: [0.8, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}

        {/* Data particles */}
        {isStreaming && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 rounded-full bg-jarvis-glow"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  x: [0, (Math.random() - 0.5) * dim * 0.3],
                  y: [0, (Math.random() - 0.5) * dim * 0.3],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 1 + Math.random(),
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Status label */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
        <span className="font-display text-[9px] tracking-[0.3em] uppercase text-jarvis-dim">
          {voiceListening ? 'LISTENING' : isStreaming ? 'PROCESSING' : status.connected ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>
    </div>
  );
}
