/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Orbitron"', 'monospace'],
        body: ['"Rajdhani"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        ui: ['"Exo 2"', 'sans-serif'],
      },
      colors: {
        jarvis: {
          bg: '#020408',
          panel: '#040d14',
          border: '#0a2540',
          glow: '#00d4ff',
          accent: '#00ffcc',
          warn: '#ff6b35',
          success: '#00ff88',
          muted: '#1a3a5c',
          text: '#a0c4d8',
          dim: '#4a7a9b',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'scan': 'scan 2s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite',
        'glitch': 'glitch 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        'float': 'float 6s ease-in-out infinite',
        'orbit': 'orbit 10s linear infinite',
        'data-flow': 'dataFlow 3s linear infinite',
        'border-spin': 'borderSpin 3s linear infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        glitch: {
          '0%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-2px) skewX(1deg)' },
          '40%': { transform: 'translateX(2px) skewX(-1deg)' },
          '60%': { transform: 'translateX(-1px)' },
          '80%': { transform: 'translateX(1px)' },
          '100%': { transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(60px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(60px) rotate(-360deg)' },
        },
        dataFlow: {
          '0%': { transform: 'translateY(0%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100%)', opacity: '0' },
        },
        borderSpin: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)
        `,
        'hex-pattern': 'url("data:image/svg+xml,%3Csvg...")',
        'radial-glow': 'radial-gradient(ellipse at center, rgba(0, 212, 255, 0.15) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(0, 212, 255, 0.3)',
        'glow': '0 0 20px rgba(0, 212, 255, 0.4)',
        'glow-lg': '0 0 40px rgba(0, 212, 255, 0.3)',
        'glow-accent': '0 0 20px rgba(0, 255, 204, 0.4)',
        'glow-warn': '0 0 20px rgba(255, 107, 53, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(0, 212, 255, 0.1)',
        'panel': '0 0 0 1px rgba(0, 212, 255, 0.15), 0 4px 40px rgba(0, 0, 0, 0.8)',
      },
      dropShadow: {
        'glow': '0 0 8px rgba(0, 212, 255, 0.8)',
        'glow-accent': '0 0 8px rgba(0, 255, 204, 0.8)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};
