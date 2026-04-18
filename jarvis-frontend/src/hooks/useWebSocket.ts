import { useRef, useCallback, useEffect } from 'react';
import { useJarvisStore, type AgentEvent, type JarvisMode } from '@/stores/jarvisStore';
import { useVoice } from './useVoice';

const WS_URL = 'ws://localhost:8000/chat/ws';

// ── Singleton connection management ──────────────────────────────────────────
let globalWs: WebSocket | null = null;
let _onResponseReady: ((text: string) => void) | null = null;

export function setVoiceResponseCallback(cb: ((text: string) => void) | null) {
  _onResponseReady = cb;
}

export function useJarvisWebSocket() {
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const latencyStart = useRef<number>(0);
  const { speak } = useVoice();

  const {
    addMessage,
    updateStreamContent,
    finalizeStream,
    setConversationId,
    addAgentEvent,
    clearAgentEvents,
    setCurrentAgent,
    addActiveTool,
    clearActiveTools,
    updateStatus,
    setIsStreaming,
  } = useJarvisStore();

  const handleMessage = useCallback((event: MessageEvent) => {
    const latency = Date.now() - latencyStart.current;
    updateStatus({ latency });

    try {
      const data: AgentEvent = JSON.parse(event.data);

      switch (data.event_type) {
        case 'conversation_id':
          setConversationId(data.data?.conversation_id as string);
          break;

        case 'agent_start':
          addAgentEvent(data);
          if (data.agent) setCurrentAgent(data.agent);
          updateStatus({ activeAgents: [data.agent!] });
          break;

        case 'agent_end':
          addAgentEvent(data);
          setCurrentAgent(null);
          break;

        case 'token':
          if (data.token) updateStreamContent(data.token);
          break;

        case 'tool_call': {
          addAgentEvent(data);

          if (data.agent === 'system' && data.data?.tool) {
            const tool = data.data.tool as string;
            const input = data.data.input as Record<string, string>;

            if (tool === 'open_website' && input?.url) {
              const newWin = window.open(input.url, '_blank');
              if (!newWin) {
                const { addMessage: am } = useJarvisStore.getState();
                am({
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: `⚠️ **Popup Blocked.** [Click here to open ${input.url}](${input.url})`,
                  timestamp: new Date(),
                });
              }
            } else if (tool === 'switch_panel' && input?.panel) {
              const { setActivePanel } = useJarvisStore.getState();
              const p = input.panel.toLowerCase();
              const validPanels = ['dashboard', 'chat', 'memory', 'agents', 'settings'];
              if (validPanels.includes(p)) {
                setActivePanel(p as any);
              }
            }
          }

          if (data.agent && data.data?.tool) {
            addActiveTool({
              tool: data.data.tool as string,
              agent: data.agent,
              input: typeof data.data.input === 'string'
                ? data.data.input
                : JSON.stringify(data.data.input),
            });
          }
          break;
        }

        case 'tool_result':
          addAgentEvent(data);
          break;

        case 'memory_read':
        case 'memory_write':
          addAgentEvent(data);
          break;

        case 'done': {
          const { voiceFeedback } = useJarvisStore.getState();
          const fullResponse = data.data?.full_response as string | undefined;

          finalizeStream();
          clearActiveTools();
          setCurrentAgent(null);
          updateStatus({ activeAgents: [] });

          if (fullResponse) {
            if (_onResponseReady) {
              _onResponseReady(fullResponse);
            } else if (voiceFeedback) {
              speak(fullResponse);
            }
          }
          break;
        }

        case 'error':
          addAgentEvent(data);
          finalizeStream();
          setIsStreaming(false);
          break;
      }
    } catch (e) {
      console.error('[JARVIS] Parse error:', e);
    }
  }, [addAgentEvent, addActiveTool, clearActiveTools, finalizeStream, setConversationId, setCurrentAgent, setIsStreaming, updateStatus, updateStreamContent, speak]);

  const connect = useCallback(() => {
    if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) return;

    const ws = new WebSocket(WS_URL);
    globalWs = ws;

    ws.onopen = () => {
      updateStatus({ connected: true });
      console.log('[JARVIS] WebSocket connected');
    };

    ws.onclose = () => {
      updateStatus({ connected: false });
      if (!reconnectTimer.current) {
        reconnectTimer.current = setTimeout(() => {
          reconnectTimer.current = undefined;
          connect();
        }, 3000);
      }
    };

    ws.onerror = () => {
      updateStatus({ connected: false });
    };

    ws.onmessage = handleMessage;
  }, [handleMessage, updateStatus]);

  const sendMessage = useCallback(
    (message: string, mode: JarvisMode = 'focus') => {
      if (!globalWs || globalWs.readyState !== WebSocket.OPEN) {
        connect();
        return false;
      }

      const { conversationId } = useJarvisStore.getState();

      clearAgentEvents();
      setIsStreaming(true);

      addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      });

      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      });

      latencyStart.current = Date.now();

      globalWs.send(
        JSON.stringify({
          message,
          conversation_id: conversationId,
          mode,
          user_id: 'default',
        })
      );

      return true;
    },
    [addMessage, clearAgentEvents, setIsStreaming, connect]
  );

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    reconnectTimer.current = undefined;
    if (globalWs) {
      globalWs.close();
      globalWs = null;
    }
  }, []);

  useEffect(() => {
    // Only connect if not already connected
    connect();
    // Update message handler to the latest reference
    if (globalWs) {
      globalWs.onmessage = handleMessage;
    }
  }, [connect, handleMessage]);

  return { sendMessage, connect, disconnect };
}
