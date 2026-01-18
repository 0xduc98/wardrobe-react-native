/**
 * useChat Hook
 * Manages chat state and session persistence.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { storage } from '@/App';
import { chatService, type ChatAttachment, type SSECallbacks } from '@/services/chatService';
import { uploadService, type FileAttachment } from '@/services/uploadService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: Array<{ tool: string; args: Record<string, any> }>;
  attachments?: FileAttachment[];
}

interface UseChatReturn {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  currentTool: string | null;
  pendingAttachments: FileAttachment[];
  addAttachment: (attachment: Omit<FileAttachment, 'id'>) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  sendMessage: (message: string, useStreaming?: boolean) => Promise<void>;
  clearSession: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
}

const SESSION_ID_KEY = 'chat_session_id';

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<FileAttachment[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);
  const lastMessageRef = useRef<{ message: string; attachments: FileAttachment[] } | null>(null);

  useEffect(() => {
    try {
      const savedSessionId = storage.getString(SESSION_ID_KEY);
      if (savedSessionId) {
        setSessionId(savedSessionId);
      }
    } catch (e) {
      console.warn('[useChat] Failed to load saved session:', e);
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    try {
      if (sessionId) {
        storage.set(SESSION_ID_KEY, sessionId);
      } else {
        storage.delete(SESSION_ID_KEY);
      }
    } catch (e) {
      console.warn('[useChat] Failed to persist session ID:', e);
    }
  }, [sessionId]);

  // Attachment management
  const addAttachment = useCallback((attachment: Omit<FileAttachment, 'id'>) => {
    const newAttachment: FileAttachment = {
      ...attachment,
      id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
    setPendingAttachments((prev) => [...prev, newAttachment]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setPendingAttachments([]);
  }, []);

  const sendMessage = useCallback(
    async (message: string, useStreaming = true) => {
      if ((!message.trim() && pendingAttachments.length === 0) || isLoading) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setCurrentTool(null);

      // Store for retry
      const currentAttachments = [...pendingAttachments];
      lastMessageRef.current = { message, attachments: currentAttachments };

      // Clear pending attachments immediately for optimistic UI
      setPendingAttachments([]);

      // Upload attachments first
      let uploadedAttachments: ChatAttachment[] = [];
      if (currentAttachments.length > 0) {
        try {
          console.log('[useChat] Uploading attachments:', currentAttachments.map((a) => ({
            uri: a.uri.substring(0, 50) + '...',
            type: a.type,
            name: a.name,
          })));

          const uploadResults = await uploadService.uploadFiles(
            currentAttachments.map((a) => ({
              uri: a.uri,
              type: a.type,
              name: a.name,
            })),
          );

          console.log('[useChat] Upload results:', uploadResults);

          uploadedAttachments = uploadResults
            .map((result, index) => {
              if (result.url) {
                return {
                  type: 'image' as const,
                  url: result.url,
                  content_type: currentAttachments[index].type,
                };
              }
              return null;
            })
            .filter((a): a is ChatAttachment => a !== null);

          // Check if any uploads failed
          const failedUploads = uploadResults.filter((r) => r.error);
          if (failedUploads.length > 0) {
            console.warn('[useChat] Some uploads failed:', failedUploads);
            if (uploadedAttachments.length === 0) {
              const errorMsg = failedUploads[0].error || 'Failed to upload images';
              setError(errorMsg);
              setIsLoading(false);
              return;
            }
          }
        } catch (uploadError) {
          console.error('[useChat] Upload error:', uploadError);
          const errorMsg = uploadError instanceof Error ? uploadError.message : 'Failed to upload images. Please try again.';
          setError(errorMsg);
          setIsLoading(false);
          return;
        }
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }

        if (useStreaming) {
          const assistantId = `assistant-${Date.now()}`;
          let assistantContent = '';
          const toolCalls: Array<{ tool: string; args: Record<string, any> }> = [];

          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              isStreaming: true,
            },
          ]);

          const callbacks: SSECallbacks = {
            onMessage: (content) => {
              assistantContent = content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: assistantContent } : msg,
                ),
              );
            },
            onToolCall: (tool, args) => {
              setCurrentTool(tool);
              toolCalls.push({ tool, args });
            },
            onDone: (newSessionId) => {
              setSessionId(newSessionId);
              setCurrentTool(null);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, isStreaming: false, toolCalls }
                    : msg,
                ),
              );
              setIsLoading(false);
              cleanupRef.current = null;
            },
            onError: (errorMsg) => {
              setError(errorMsg);
              setIsLoading(false);
              setCurrentTool(null);
              cleanupRef.current = null;
            },
          };

          cleanupRef.current = await chatService.sendStreamingMessage(
            message,
            sessionId,
            callbacks,
            uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
          );
        } else {
          const response = await chatService.sendMessage(
            message,
            sessionId,
            uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
          );
          setSessionId(response.session_id);

          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: response.response,
              timestamp: new Date(),
              toolCalls: response.tool_calls,
            },
          ]);
          setIsLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to send message');
        setIsLoading(false);
        setCurrentTool(null);
      }
    },
    [sessionId, isLoading, pendingAttachments],
  );

  const retryLastMessage = useCallback(async () => {
    if (!lastMessageRef.current || isLoading) {
      return;
    }

    const { message, attachments } = lastMessageRef.current;

    // Remove the failed user message (last one)
    setMessages((prev) => prev.slice(0, -1));

    // Restore attachments and retry
    setPendingAttachments(attachments);
    setError(null);

    // Wait a tick for state to update, then send
    setTimeout(() => {
      void sendMessage(message, true);
    }, 0);
  }, [isLoading, sendMessage]);

  const clearSession = useCallback(async () => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setSessionId(null);
    setMessages([]);
    setError(null);
    setCurrentTool(null);
    try {
      storage.delete(SESSION_ID_KEY);
    } catch (e) {
      console.warn('[useChat] Failed to delete session ID:', e);
    }
  }, []);

  const loadSession = useCallback(async (newSessionId: string) => {
    setSessionId(newSessionId);
    setMessages([]);
  }, []);

  return {
    messages,
    sessionId,
    isLoading,
    error,
    currentTool,
    pendingAttachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
    sendMessage,
    clearSession,
    loadSession,
    retryLastMessage,
  };
}
