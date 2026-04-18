import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface PanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  glow?: boolean;
  corner?: boolean;
  animate?: boolean;
}

export function Panel({ children, className, title, subtitle, glow, corner = true, animate }: PanelProps) {
  const Comp = animate ? motion.div : 'div';
  const animProps = animate
    ? { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }
    : {};

  return (
    <Comp
      {...(animProps as Record<string, unknown>)}
      className={clsx(
        'relative bg-jarvis-panel border border-jarvis-border',
        glow && 'shadow-panel',
        corner && 'panel-corner',
        className
      )}
    >
      {(title || subtitle) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-jarvis-border/50">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-jarvis-glow animate-pulse-slow shadow-glow-sm" />
            {title && (
              <span className="font-display text-xs tracking-[0.2em] uppercase text-jarvis-glow font-medium">
                {title}
              </span>
            )}
          </div>
          {subtitle && (
            <span className="font-mono text-[10px] text-jarvis-dim tracking-widest">{subtitle}</span>
          )}
        </div>
      )}
      {children}
    </Comp>
  );
}

interface StatusDotProps {
  active?: boolean;
  warn?: boolean;
  size?: 'sm' | 'md';
}

export function StatusDot({ active, warn, size = 'md' }: StatusDotProps) {
  return (
    <span
      className={clsx(
        'inline-block rounded-full',
        size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
        active
          ? 'bg-jarvis-success shadow-[0_0_6px_rgba(0,255,136,0.8)]'
          : warn
          ? 'bg-jarvis-warn shadow-[0_0_6px_rgba(255,107,53,0.8)]'
          : 'bg-jarvis-dim'
      )}
      style={{ animation: active ? 'statusPulse 2s ease-in-out infinite' : undefined }}
    />
  );
}

interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export function GlowButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  type = 'button',
}: GlowButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'relative font-display tracking-widest uppercase transition-all duration-200 select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        size === 'sm' && 'text-[10px] px-3 py-1.5',
        size === 'md' && 'text-xs px-5 py-2.5',
        size === 'lg' && 'text-sm px-8 py-3',
        variant === 'primary' && [
          'bg-transparent text-jarvis-glow border border-jarvis-glow/60',
          'hover:bg-jarvis-glow/10 hover:border-jarvis-glow hover:shadow-glow',
          'active:scale-95',
        ],
        variant === 'secondary' && [
          'bg-transparent text-jarvis-accent border border-jarvis-accent/40',
          'hover:bg-jarvis-accent/10 hover:border-jarvis-accent hover:shadow-glow-accent',
        ],
        variant === 'ghost' && [
          'bg-transparent text-jarvis-dim border border-jarvis-border',
          'hover:text-jarvis-text hover:border-jarvis-muted',
        ],
        variant === 'danger' && [
          'bg-transparent text-jarvis-warn border border-jarvis-warn/40',
          'hover:bg-jarvis-warn/10 hover:border-jarvis-warn hover:shadow-glow-warn',
        ],
        className
      )}
    >
      {children}
    </button>
  );
}

interface HexBadgeProps {
  label: string;
  value: string | number;
  color?: 'glow' | 'accent' | 'warn';
}

export function HexBadge({ label, value, color = 'glow' }: HexBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={clsx(
          'font-display font-bold',
          color === 'glow' && 'text-jarvis-glow text-glow',
          color === 'accent' && 'text-jarvis-accent text-glow-accent',
          color === 'warn' && 'text-jarvis-warn text-glow-warn',
          'text-lg leading-none'
        )}
      >
        {value}
      </div>
      <div className="font-mono text-[9px] text-jarvis-dim tracking-widest uppercase">{label}</div>
    </div>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-jarvis-border" />
      {label && (
        <span className="font-mono text-[9px] text-jarvis-dim tracking-[0.3em] uppercase">{label}</span>
      )}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-jarvis-border" />
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = 'glow' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="relative h-1 bg-jarvis-border rounded-full overflow-hidden">
      <motion.div
        className={clsx(
          'absolute inset-y-0 left-0 rounded-full',
          color === 'glow' && 'bg-jarvis-glow shadow-glow-sm',
          color === 'accent' && 'bg-jarvis-accent shadow-glow-accent',
          color === 'warn' && 'bg-jarvis-warn shadow-glow-warn',
        )}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
}
