# JARVIS — Frontend

> Advanced Intelligence System · React + Tailwind + Framer Motion

A stunning sci-fi HUD interface for the Jarvis AI backend. Built to feel like a real Iron Man-style assistant — holographic panels, live agent traces, real-time streaming, and a fully reactive layout.

---

## ✦ Design Philosophy

**Aesthetic**: Retro-futuristic holographic HUD — dark deep-space background, electric cyan glows, military-grade typography, scanlines, and data-stream animations.

**Fonts**:
- `Orbitron` — display headings, labels, mode names
- `Rajdhani` — body text, chat messages
- `Exo 2` — UI elements
- `JetBrains Mono` — code, metadata, timestamps

**Color palette**:
```
Background:  #020408   (deep space black)
Panel:       #040d14
Border:      #0a2540
Glow:        #00d4ff   (electric cyan)
Accent:      #00ffcc   (neon teal)
Warning:     #ff6b35   (orange alert)
Success:     #00ff88   (matrix green)
```

---

## ✦ Folder Structure

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatView.tsx        ← Main chat panel with message list
│   │   ├── ChatInput.tsx       ← Smart input with voice + suggestions
│   │   └── MessageBubble.tsx   ← Animated message with Markdown support
│   ├── agents/
│   │   └── AgentTrace.tsx      ← Live agent event log + active tools
│   ├── memory/
│   │   └── MemoryPanel.tsx     ← Memory items with relevance scores
│   ├── voice/
│   │   └── VoicePanel.tsx      ← Waveform visualizer + mic control
│   ├── layout/
│   │   ├── TopBar.tsx          ← HUD header with mode + status
│   │   ├── Sidebar.tsx         ← Collapsible left nav with orb
│   │   ├── RightPanel.tsx      ← Tabbed right panel (agents/memory/voice)
│   │   ├── JarvisOrb.tsx       ← Animated core avatar orb
│   │   ├── SystemPanel.tsx     ← System health + API config
│   │   └── BackgroundEffects.tsx ← Grid, particles, ambient glows
│   └── ui/
│       └── Panel.tsx           ← Reusable Panel, GlowButton, StatusDot, etc.
├── hooks/
│   ├── useWebSocket.ts         ← WS connection + AgentEvent routing
│   └── useVoice.ts             ← MediaRecorder + transcription
├── stores/
│   └── jarvisStore.ts          ← Zustand global state
├── styles/
│   └── globals.css             ← CSS variables, animations, utilities
├── App.tsx                     ← Root layout assembly
└── main.tsx                    ← Entry point
```

---

## ✦ Features

| Feature | Status |
|---|---|
| Real-time WebSocket chat streaming | ✅ |
| AgentEvent protocol (all 11 event types) | ✅ |
| Live agent activity trace | ✅ |
| Animated Jarvis orb (state-reactive) | ✅ |
| Mode selector (focus/research/creative) | ✅ |
| Markdown + code block rendering | ✅ |
| Voice input (mic → transcribe) | ✅ |
| Memory panel with relevance scores | ✅ |
| Collapsible sidebar | ✅ |
| System health monitor | ✅ |
| Typing suggestions | ✅ |
| Scanline + vignette + noise overlays | ✅ |
| Data stream particle effects | ✅ |
| Full responsive layout | ✅ |

---

## ✦ Quick Start

```bash
# 1. Install dependencies
cd jarvis-frontend
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start the backend first
cd ../backend
uvicorn app.main:app --reload --port 8000

# 4. Start the frontend
cd ../jarvis-frontend
npm run dev
```

Open `http://localhost:5173`

---

## ✦ Backend Integration

The frontend connects to `ws://localhost:8000/chat/ws` and handles all `AgentEvent` types:

| Event Type | UI Action |
|---|---|
| `conversation_id` | Store conversation ID |
| `agent_start` | Show agent in trace, update orb |
| `agent_end` | Clear active agent |
| `token` | Stream text into assistant bubble |
| `tool_call` | Show tool call in trace panel |
| `tool_result` | Show result in trace panel |
| `memory_read` | Highlight memory in Memory panel |
| `memory_write` | Show write in memory log |
| `done` | Finalize message, reset streaming state |
| `error` | Show error in trace, stop streaming |

---

## ✦ Customization

**Change accent color**: Edit `--jarvis-glow` in `src/styles/globals.css`

**Add an agent icon**: Edit `agentIcons` map in `AgentTrace.tsx`

**Add chat suggestions**: Edit `SUGGESTIONS` array in `ChatInput.tsx`

**Disable scanlines/vignette**: Remove `.scanlines` and `.vignette` classes from `App.tsx`

---

## ✦ Tech Stack

- **React 18** + TypeScript
- **Tailwind CSS v3** — utility styling
- **Framer Motion** — all animations
- **Zustand** — global state
- **React Markdown** + remark-gfm — message rendering
- **Lucide React** — icons
- **date-fns** — timestamp formatting

---

*Built for the Jarvis AI System · Module 2 Frontend*
