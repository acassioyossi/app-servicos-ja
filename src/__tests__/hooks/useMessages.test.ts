import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessages } from '@/hooks/useMessages';
import { server } from '../mocks/server';
import { rest } from 'msw';

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN
};

(global as any).WebSocket = jest.fn(() => mockWebSocket);

describe('useMessages Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  it('initializes with empty messages', () => {
    const { result } = renderHook(() => useMessages('user1'));
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('loads messages on mount', async () => {
    const { result } = renderHook(() => useMessages('user1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('Hello from user1');
  });

  it('handles loading error', async () => {
    server.use(
      rest.get('/api/messages', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    const { result } = renderHook(() => useMessages('user1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBe('Failed to load messages');
    expect(result.current.messages).toEqual([]);
  });

  it('sends message successfully', async () => {
    const { result } = renderHook(() => useMessages('user1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.sendMessage('New message', 'user2');
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2].content).toBe('New message');
    expect(result.current.messages[2].senderId).toBe('user1');
    expect(result.current.messages[2].receiverId).toBe('user2');
  });

  it('handles send message error', async () => {
    server.use(
      rest.post('/api/messages', (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ error: 'Invalid message' }));
      })
    );

    const { result } = renderHook(() => useMessages('user1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.sendMessage('', 'user2');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Failed to send message');
  });

  it('marks message as read', async () => {
    const { result } = renderHook(() => useMessages('user1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const messageId = result.current.messages[0].id;
    
    await act(async () => {
      await result.current.markAsRead(messageId);
    });

    const updatedMessage = result.current.messages.find(m => m.id === messageId);
    expect(updatedMessage?.isRead).toBe(true);
  });

  it('deletes message', async () => {
    const { result } = renderHook(() => useMessages('user1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const messageId = result.current.messages[0].id;
    const initialCount = result.current.messages.length;
    
    await act(async () => {
      await result.current.deleteMessage(messageId);
    });

    expect(result.current.messages).toHaveLength(initialCount - 1);
    expect(result.current.messages.find(m => m.id === messageId)).toBeUndefined();
  });

  it('establishes WebSocket connection', async () => {
    const { result } = renderHook(() => useMessages('user1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('/api/ws/messages')
    );
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function)
    );
  });

  it('handles WebSocket message', async () => {
    const { result } = renderHook(() => useMessages('user1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate WebSocket message
    const messageHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1];
    
    const newMessage = {
      id: 'msg3',
      content: 'WebSocket message',
      senderId: 'user2',
      receiverId: 'user1',
      timestamp: new Date().toISOString(),
      isRead: false
    };

    act(() => {
      messageHandler({
        data: JSON.stringify({ type: 'new_message', data: newMessage })
      });
    });

    expect(result.current.messages).toContainEqual(
      expect.objectContaining({
        content: 'WebSocket message',
        senderId: 'user2'
      })
    );
  });

  it('handles WebSocket connection error', async () => {
    const { result } = renderHook(() => useMessages('user1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate WebSocket error
    const errorHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'error')[1];
    
    act(() => {
      errorHandler(new Error('WebSocket error'));
    });

    expect(result.current.error).toBe('Connection error');
  });

  it('cleans up WebSocket on unmount', () => {
    const { unmount } = renderHook(() => useMessages('user1'));
    
    unmount();
    
    expect(mockWebSocket.close).toHaveBeenCalled();
  });

  it('filters messages by conversation', async () => {
    const { result } = renderHook(() => useMessages('user1', 'user2'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only show messages between user1 and user2
    result.current.messages.forEach(message => {
      expect(
        (message.senderId === 'user1' && message.receiverId === 'user2') ||
        (message.senderId === 'user2' && message.receiverId === 'user1')
      ).toBe(true);
    });
  });

  it('handles pagination', async () => {
    const { result } = renderHook(() => useMessages('user1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.hasMore).toBeDefined();
  });

  it('debounces typing indicator', async () => {
    const { result } = renderHook(() => useMessages('user1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setTyping(true);
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'typing', userId: 'user1', isTyping: true })
    );

    // Should automatically stop typing after delay
    await waitFor(() => {
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'typing', userId: 'user1', isTyping: false })
      );
    }, { timeout: 3000 });
  });
});