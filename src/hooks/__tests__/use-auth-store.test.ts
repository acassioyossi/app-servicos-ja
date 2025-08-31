import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../use-auth-store'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock fetch
global.fetch = jest.fn()

// Mock tokenUtils
jest.mock('@/lib/token-storage', () => ({
  tokenUtils: {
    storeAuthTokens: jest.fn(),
    clearAuthTokens: jest.fn(),
    hasValidTokens: jest.fn().mockResolvedValue(false),
    getAccessToken: jest.fn().mockResolvedValue(null),
  },
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the store state
    useAuthStore.setState({ user: null, isLoading: false, error: null })
  })

  it('initializes with null user', () => {
    const { result } = renderHook(() => useAuthStore())
    
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('logs in a client user successfully', async () => {
    const mockUser = { id: '1', email: 'client@test.com', type: 'client' }
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
      })
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)
    
    const { result } = renderHook(() => useAuthStore())
    
    await act(async () => {
      await result.current.login('client@test.com', 'password123')
    })
    
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles login error', async () => {
    const mockResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({
        error: 'Invalid credentials'
      })
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)
    
    const { result } = renderHook(() => useAuthStore())
    
    await act(async () => {
      try {
        await result.current.login('invalid@test.com', 'wrongpassword')
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Invalid credentials')
  })

  it('logs out user successfully', async () => {
    // First set a user
    useAuthStore.setState({ user: { id: '1', email: 'test@test.com', type: 'client' } })
    
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ redirectTo: '/login' })
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)
    
    const { result } = renderHook(() => useAuthStore())
    
    await act(async () => {
      await result.current.logout()
    })
    
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('checks authentication status', async () => {
    const mockUser = { id: '1', email: 'test@test.com', type: 'client' }
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ user: mockUser })
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)
    
    // Mock tokenUtils to return valid tokens
    const { tokenUtils } = require('@/lib/token-storage')
    tokenUtils.hasValidTokens.mockResolvedValue(true)
    tokenUtils.getAccessToken.mockResolvedValue('valid-token')
    
    const { result } = renderHook(() => useAuthStore())
    
    await act(async () => {
      await result.current.checkAuth()
    })
    
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('clears error', () => {
    const { result } = renderHook(() => useAuthStore())
    
    // Set an error first using the store's setState
    act(() => {
      useAuthStore.setState({ error: 'Some error' })
    })
    
    expect(result.current.error).toBe('Some error')
    
    act(() => {
      result.current.clearError()
    })
    
    expect(result.current.error).toBeNull()
  })
})