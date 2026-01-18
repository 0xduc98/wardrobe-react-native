/**
 * Chat Service
 * Handles communication with the Wardrobe Chat Agent API.
 *
 * Features:
 * - SSE streaming support (react-native-sse)
 * - Non-streaming message mode
 * - Session management (list, delete)
 * - Authenticated requests using existing auth flow
 */

import EventSource from 'react-native-sse';

import { authClient, getFreshAccessToken, handleApiError } from '@/services/httpClient';

const API_PREFIX = 'api/v1/chat';
const API_URL = process.env.API_URL ?? 'http://localhost:5001';

export interface ChatResponse {
  session_id: string;
  response: string;
  tool_calls?: Array<{ tool: string; args: Record<string, any> }>;
  cost_usd: number;
}

export interface SSECallbacks {
  onMessage: (content: string) => void;
  onToolCall: (tool: string, args: Record<string, any>) => void;
  onDone: (sessionId: string, cost: number) => void;
  onError: (error: string) => void;
}

export interface ChatSession {
  id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  summary: string;
}

export interface SessionsResponse {
  count: number;
  sessions: ChatSession[];
}

export interface ChatAttachment {
  type: 'image';
  url: string;
  content_type: string;
}

class ChatService {
  /**
   * Send a non-streaming message to the chat agent.
   */
  async sendMessage(
    message: string,
    sessionId?: string | null,
    attachments?: ChatAttachment[],
  ): Promise<ChatResponse> {
    try {
      const response = await authClient
        .post(`${API_PREFIX}/message`, {
          json: {
            message,
            session_id: sessionId,
            stream: false,
            attachments,
          },
        })
        .json<ChatResponse>();

      return response;
    } catch (error) {
      const errorMessage = await handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Send a streaming message using SSE.
   * Returns a cleanup function to close the connection.
   */
  async sendStreamingMessage(
    message: string,
    sessionId: string | null,
    callbacks: SSECallbacks,
    attachments?: ChatAttachment[],
  ): Promise<() => void> {
    const accessToken = await getFreshAccessToken();

    if (!accessToken) {
      callbacks.onError('Not authenticated');
      return () => {};
    }

    const url = `${API_URL}/${API_PREFIX}/message`;
    const body = JSON.stringify({
      message,
      session_id: sessionId,
      stream: true,
      attachments,
    });

    const es = new EventSource(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    es.addEventListener('message', (event: any) => {
      try {
        const data = JSON.parse(event.data || '{}');
        callbacks.onMessage(data.content || '');
      } catch (e) {
        console.warn('[ChatService] Failed to parse message event:', e);
      }
    });

    es.addEventListener('tool_call', (event: any) => {
      try {
        const data = JSON.parse(event.data || '{}');
        callbacks.onToolCall(data.tool || '', data.args || {});
      } catch (e) {
        console.warn('[ChatService] Failed to parse tool_call event:', e);
      }
    });

    es.addEventListener('done', (event: any) => {
      try {
        const data = JSON.parse(event.data || '{}');
        callbacks.onDone(data.session_id || '', data.cost_usd || 0);
      } catch (e) {
        console.warn('[ChatService] Failed to parse done event:', e);
      } finally {
        es.close();
      }
    });

    es.addEventListener('error', (event: any) => {
      try {
        const data = JSON.parse(event.data || '{}');
        callbacks.onError(data.message || 'Connection error');
      } catch (e) {
        callbacks.onError('Connection error');
      } finally {
        es.close();
      }
    });

    return () => {
      es.close();
    };
  }

  /**
   * List all chat sessions for the authenticated user.
   */
  async listSessions(): Promise<SessionsResponse> {
    try {
      const response = await authClient
        .get(`${API_PREFIX}/sessions`)
        .json<SessionsResponse>();
      return response;
    } catch (error) {
      const errorMessage = await handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a chat session.
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await authClient.delete(`${API_PREFIX}/sessions/${sessionId}`);
    } catch (error) {
      const errorMessage = await handleApiError(error);
      throw new Error(errorMessage);
    }
  }
}

export const chatService = new ChatService();
