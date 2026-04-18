import { useRef, useCallback, useEffect } from 'react';
import { useJarvisStore, type AgentEvent, type JarvisMode } from '@/stores/jarvisStore';
import { useVoice } from './useVoice';

const WS_URL = 'ws://localhost:8000/chat/ws';

export function useJarvisWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
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
    messages,
  } = useJarvisStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      updateStatus({ connected: true });
      console.log('[JARVIS] WebSocket connected');
    };

    ws.onclose = () => {
      updateStatus({ connected: false });
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      updateStatus({ connected: false });
    };

    ws.onmessage = (event) => {
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

          case 'tool_call':
            addAgentEvent(data);
            if (data.agent === 'system' && data.data?.tool) {
              const tool = data.data.tool as string;
              const input = data.data.input as any;
              
              if (tool === 'open_website' && input.url) {
                const newWin = window.open(input.url, '_blank');
                if (!newWin) {
                  console.warn('Popup blocked by browser.');
                  const { addMessage } = useJarvisStore.getState();
                  addMessage({
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `⚠️ **Popup Blocked:** I tried to open the tab, but your browser blocked it. Please [click here to open ${input.url}](${input.url}).`,
                    timestamp: new Date(),
                  });
                }
              } else if (tool === 'switch_panel' && input.panel) {
                const { setActivePanel } = useJarvisStore.getState();
                const p = input.panel.toLowerCase();
                if (['dashboard', 'chat', 'memory', 'agents', 'settings'].includes(p)) {
                  setActivePanel(p as any);
                }
              }
            }
            if (data.agent && data.data?.tool) {
              addActiveTool({
                tool: data.data.tool as string,
                agent: data.agent,
                input: data.data.input as string,
              });
            }
            break;

          case 'tool_result':
            addAgentEvent(data);
            break;

          case 'memory_read':
          case 'memory_write':
            addAgentEvent(data);
            break;

          case 'done':
            const { voiceFeedback } = useJarvisStore.getState();
            const responseText = data.data?.full_response as string | undefined;
            
            if (voiceFeedback && responseText) {
              // Strip markdown code blocks before speaking so it doesn't read out full code loudly
              const cleanText = responseText.replace(/```[\s\S]*?```/g, ' [I have provided the code in the interface] ').trim();
              if (cleanText) {
                speak(cleanText);
              }
            }
            finalizeStream();
            clearActiveTools();
            setCurrentAgent(null);
            updateStatus({ activeAgents: [] });
            break;

          case 'error':
            addAgentEvent(data);
            finalizeStream();
            setIsStreaming(false);
            break;
        }
      } catch (e) {
        console.error('[JARVIS] Parse error:', e);
      }
    };
  }, []);

  const sendMessage = useCallback(
    (message: string, mode: JarvisMode = 'focus') => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return false;

      const { conversationId } = useJarvisStore.getState();

      clearAgentEvents();
      setIsStreaming(true);

      const msgId = crypto.randomUUID();
      addMessage({
        id: msgId,
        role: 'user',
        content: message,
        timestamp: new Date(),
      });

      // Add placeholder streaming message
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      });

      latencyStart.current = Date.now();

      wsRef.current.send(
        JSON.stringify({
          message,
          conversation_id: conversationId,
          mode,
          user_id: 'default',
        })
      );

      return true;
    },
    [addMessage, clearAgentEvents, setIsStreaming]
  );

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  return { sendMessage, connect, disconnect };
}
