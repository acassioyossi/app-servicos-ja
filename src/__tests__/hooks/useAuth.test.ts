import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/contexts/AuthContext';
import { server } from '../mocks/server';
import { rest } from 'msw';
import React from 'react';

// Wrapper component for AuthProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(AuthProvider, null, children)
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('initializes with no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('loads user from token on mount', async () => {
    localStorage.setItem('accessToken', 'valid-token');
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.user).toEqual(
      expect.objectContaining({
        id: 'user1',
        email: 'user1@example.com'
      })
    );
  });

  it('handles invalid token on mount', async () => {
    localStorage.setItem('accessToken', 'invalid-token');
    
    server.use(
      rest.get('/api/auth/me', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Invalid token' }));
      })
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('logs in successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('user1@example.com', 'password123');
    });

    expect(result.current.user).toEqual(
      expect.objectContaining({
        id: 'user1',
        email: 'user1@example.com'
      })
    );
    expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
  });

  it('handles login error', async () => {
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Invalid credentials' }));
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.login('wrong@example.com', 'wrongpassword');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('registers successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.register({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      });
    });

    expect(result.current.user).toEqual(
      expect.objectContaining({
        email: 'newuser@example.com',
        name: 'New User'
      })
    );
  });

  it('handles registration error', async () => {
    server.use(
      rest.post('/api/auth/register', (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ error: 'Email already exists' }));
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'User'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Email already exists');
  });

  it('logs out successfully', async () => {
    localStorage.setItem('accessToken', 'valid-token');
    localStorage.setItem('refreshToken', 'valid-refresh-token');
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('refreshes token automatically', async () => {
    localStorage.setItem('accessToken', 'expired-token');
    localStorage.setItem('refreshToken', 'valid-refresh-token');
    
    server.use(
      rest.get('/api/auth/me', (req, res, ctx) => {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (token === 'expired-token') {
          return res(ctx.status(401), ctx.json({ error: 'Token expired' }));
        }
        return res(ctx.json({ id: 'user1', email: 'user1@example.com' }));
      })
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(
      expect.objectContaining({
        id: 'user1',
        email: 'user1@example.com'
      })
    );
    expect(localStorage.getItem('accessToken')).toBe('new-access-token');
  });

  it('handles refresh token failure', async () => {
    localStorage.setItem('accessToken', 'expired-token');
    localStorage.setItem('refreshToken', 'invalid-refresh-token');
    
    server.use(
      rest.get('/api/auth/me', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Token expired' }));
      }),
      rest.post('/api/auth/refresh', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Invalid refresh token' }));
      })
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('updates user profile', async () => {
    localStorage.setItem('accessToken', 'valid-token');
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
    });

    await act(async () => {
      await result.current.updateProfile({
        name: 'Updated Name',
        bio: 'Updated bio'
      });
    });

    expect(result.current.user).toEqual(
      expect.objectContaining({
        name: 'Updated Name',
        bio: 'Updated bio'
      })
    );
  });

  it('changes password successfully', async () => {
    localStorage.setItem('accessToken', 'valid-token');
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
    });

    await act(async () => {
      await result.current.changePassword('oldpassword', 'newpassword');
    });

    expect(result.current.error).toBeNull();
  });

  it('handles password change error', async () => {
    localStorage.setItem('accessToken', 'valid-token');
    
    server.use(
      rest.put('/api/auth/change-password', (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ error: 'Current password is incorrect' }));
      })
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
    });

    await act(async () => {
      try {
        await result.current.changePassword('wrongpassword', 'newpassword');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Current password is incorrect');
  });

  it('clears error when calling clearError', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Set an error first
    await act(async () => {
      try {
        await result.current.login('wrong@example.com', 'wrongpassword');
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('checks if user is authenticated', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.isAuthenticated).toBe(false);

    localStorage.setItem('accessToken', 'valid-token');
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('handles network errors gracefully', async () => {
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res.networkError('Network error');
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.login('user@example.com', 'password');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Network error. Please check your connection.');
  });
});