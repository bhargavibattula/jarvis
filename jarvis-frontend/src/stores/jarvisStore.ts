import { create } from 'zustand';

export type JarvisMode = 'focus' | 'research' | 'creative';
export type AgentName = 'orchestrator' | 'search' | 'email' | 'calendar' | 'coder' | 'drive' | 'finance' | 'weather' | 'news';
export type EventType = 'agent_start' | 'agent_step' | 'agent_end' | 'token' | 'tool_call' | 'tool_result' | 'memory_write' | 'memory_read' | 'conversation_id' | 'error' | 'done';

export interface AgentEvent {
  id: string;
  conversation_id: string;
  event_type: EventType;
  agent?: AgentName;
  step?: Record<string, unknown>;
  data?: Record<string, unknown>;
  token?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentTrace?: AgentEvent[];
  isStreaming?: boolean;
}

export interface MemoryItem {
  id: string;
  content: string;
  category: string;
  timestamp: Date;
  relevance?: number;
}

export interface SystemStatus {
  connected: boolean;
  latency: number;
  activeAgents: AgentName[];
  memoryCount: number;
  uptime: number;
}

interface JarvisStore {
  // Chat
  messages: ChatMessage[];
  currentStreamContent: string;
  isStreaming: boolean;
  mode: JarvisMode;
  conversationId: string | null;

  // Agent trace
  activeAgentEvents: AgentEvent[];
  currentAgent: AgentName | null;
  activeTools: { tool: string; agent: AgentName; input: string }[];

  // Memory
  memories: MemoryItem[];
  recentMemoryAccess: string[];

  // System
  status: SystemStatus;
  sidebarOpen: boolean;
  activePanel: 'dashboard' | 'chat' | 'memory' | 'agents' | 'settings';
  voiceActive: boolean;
  voiceListening: boolean;

  // Actions
  addMessage: (msg: ChatMessage) => void;
  updateStreamContent: (token: string) => void;
  finalizeStream: () => void;
  setMode: (mode: JarvisMode) => void;
  setConversationId: (id: string) => void;
  addAgentEvent: (event: AgentEvent) => void;
  clearAgentEvents: () => void;
  setCurrentAgent: (agent: AgentName | null) => void;
  addActiveTool: (tool: { tool: string; agent: AgentName; input: string }) => void;
  clearActiveTools: () => void;
  setMemories: (items: MemoryItem[]) => void;
  addMemoryAccess: (id: string) => void;
  updateStatus: (status: Partial<SystemStatus>) => void;
  setSidebarOpen: (open: boolean) => void;
  setActivePanel: (panel: 'chat' | 'memory' | 'agents' | 'settings') => void;
  setVoiceActive: (active: boolean) => void;
  setVoiceListening: (listening: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

export const useJarvisStore = create<JarvisStore>((set, get) => ({
  messages: [],
  currentStreamContent: '',
  isStreaming: false,
  mode: 'focus',
  conversationId: null,
  activeAgentEvents: [],
  currentAgent: null,
  activeTools: [],
  memories: [],
  recentMemoryAccess: [],
  status: {
    connected: false,
    latency: 0,
    activeAgents: [],
    memoryCount: 0,
    uptime: 0,
  },
  sidebarOpen: true,
  activePanel: 'dashboard',
  voiceActive: false,
  voiceListening: false,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateStreamContent: (token) =>
    set((s) => ({ currentStreamContent: s.currentStreamContent + token })),
  finalizeStream: () => {
    const { messages, currentStreamContent } = get();
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.isStreaming) {
      set({
        messages: messages.map((m) =>
          m.id === lastMsg.id
            ? { ...m, content: currentStreamContent, isStreaming: false }
            : m
        ),
        currentStreamContent: '',
        isStreaming: false,
      });
    }
  },
  setMode: (mode) => set({ mode }),
  setConversationId: (id) => set({ conversationId: id }),
  addAgentEvent: (event) =>
    set((s) => ({ activeAgentEvents: [...s.activeAgentEvents, event] })),
  clearAgentEvents: () => set({ activeAgentEvents: [] }),
  setCurrentAgent: (agent) => set({ currentAgent: agent }),
  addActiveTool: (tool) =>
    set((s) => ({ activeTools: [...s.activeTools.slice(-4), tool] })),
  clearActiveTools: () => set({ activeTools: [] }),
  setMemories: (items) => set({ memories: items }),
  addMemoryAccess: (id) =>
    set((s) => ({ recentMemoryAccess: [id, ...s.recentMemoryAccess.slice(0, 9)] })),
  updateStatus: (partial) =>
    set((s) => ({ status: { ...s.status, ...partial } })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setVoiceActive: (active) => set({ voiceActive: active }),
  setVoiceListening: (listening) => set({ voiceListening: listening }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  clearMessages: () => set({ messages: [], conversationId: null, currentStreamContent: '' }),
}));
