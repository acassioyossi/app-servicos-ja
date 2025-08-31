import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PWAManager } from '../pwa-manager'

// Mock window.navigator
Object.defineProperty(window, 'navigator', {
  value: {
    serviceWorker: {
      register: jest.fn(),
      ready: Promise.resolve({
        showNotification: jest.fn(),
      }),
    },
  },
  writable: true,
})

// Mock beforeinstallprompt event
let mockDeferredPrompt: any = null
const mockAddEventListener = jest.fn((event, handler) => {
  if (event === 'beforeinstallprompt') {
    // Simulate the event being fired
    setTimeout(() => {
      mockDeferredPrompt = {
        preventDefault: jest.fn(),
        prompt: jest.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      }
      handler(mockDeferredPrompt)
    }, 100)
  }
})

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
})

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('PWAManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockDeferredPrompt = null
  })

  it('renders without crashing', () => {
    render(<PWAManager />)
    // Component should render without visible content initially
    expect(document.body).toBeInTheDocument()
  })

  it('registers service worker on mount', () => {
    render(<PWAManager />)
    
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js')
  })

  it('shows install prompt when beforeinstallprompt event fires', async () => {
    render(<PWAManager />)
    
    await waitFor(() => {
      expect(screen.queryByText(/instalar app/i) || 
             screen.queryByText(/adicionar à tela inicial/i) ||
             screen.queryByRole('button', { name: /instalar/i })).toBeInTheDocument()
    }, { timeout: 200 })
  })

  it('handles install button click', async () => {
    const user = userEvent.setup()
    render(<PWAManager />)
    
    await waitFor(() => {
      const installButton = screen.queryByRole('button', { name: /instalar/i }) ||
                           screen.queryByText(/instalar app/i)
      expect(installButton).toBeInTheDocument()
    }, { timeout: 200 })
    
    const installButton = screen.getByRole('button', { name: /instalar/i }) ||
                         screen.getByText(/instalar app/i)
    
    await user.click(installButton)
    
    await waitFor(() => {
      expect(mockDeferredPrompt?.prompt).toHaveBeenCalled()
    })
  })

  it('hides prompt after installation', async () => {
    const user = userEvent.setup()
    render(<PWAManager />)
    
    await waitFor(() => {
      const installButton = screen.queryByRole('button', { name: /instalar/i })
      expect(installButton).toBeInTheDocument()
    }, { timeout: 200 })
    
    const installButton = screen.getByRole('button', { name: /instalar/i })
    await user.click(installButton)
    
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /instalar/i })).not.toBeInTheDocument()
    })
  })

  it('handles dismiss button click', async () => {
    const user = userEvent.setup()
    render(<PWAManager />)
    
    await waitFor(() => {
      const dismissButton = screen.queryByRole('button', { name: /dispensar/i }) ||
                           screen.queryByRole('button', { name: /fechar/i }) ||
                           screen.queryByLabelText(/fechar/i)
      expect(dismissButton).toBeInTheDocument()
    }, { timeout: 200 })
    
    const dismissButton = screen.getByRole('button', { name: /dispensar/i }) ||
                         screen.getByRole('button', { name: /fechar/i }) ||
                         screen.getByLabelText(/fechar/i)
    
    await user.click(dismissButton)
    
    expect(screen.queryByRole('button', { name: /instalar/i })).not.toBeInTheDocument()
  })

  it('does not show prompt if already dismissed', () => {
    mockLocalStorage.getItem.mockReturnValue('true')
    render(<PWAManager />)
    
    // Should not show install prompt
    expect(screen.queryByRole('button', { name: /instalar/i })).not.toBeInTheDocument()
  })

  it('saves dismiss state to localStorage', async () => {
    const user = userEvent.setup()
    render(<PWAManager />)
    
    await waitFor(() => {
      const dismissButton = screen.queryByRole('button', { name: /dispensar/i }) ||
                           screen.queryByRole('button', { name: /fechar/i })
      expect(dismissButton).toBeInTheDocument()
    }, { timeout: 200 })
    
    const dismissButton = screen.getByRole('button', { name: /dispensar/i }) ||
                         screen.getByRole('button', { name: /fechar/i })
    
    await user.click(dismissButton)
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('pwa-install-dismissed', 'true')
  })

  it('renders install prompt with correct content', async () => {
    render(<PWAManager />)
    
    await waitFor(() => {
      expect(screen.queryByText(/wayne/i) || 
             screen.queryByText(/instalar/i) ||
             screen.queryByText(/app/i)).toBeInTheDocument()
    }, { timeout: 200 })
  })

  it('handles service worker registration errors gracefully', () => {
    const mockRegister = jest.fn().mockRejectedValue(new Error('SW registration failed'))
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      writable: true,
    })
    
    // Should not throw error
    expect(() => render(<PWAManager />)).not.toThrow()
  })

  it('only shows prompt on supported browsers', () => {
    // Mock unsupported browser
    Object.defineProperty(window, 'navigator', {
      value: {},
      writable: true,
    })
    
    render(<PWAManager />)
    
    // Should not show install prompt on unsupported browsers
    expect(screen.queryByRole('button', { name: /instalar/i })).not.toBeInTheDocument()
  })

  it('handles multiple beforeinstallprompt events', async () => {
    render(<PWAManager />)
    
    // First event
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /instalar/i })).toBeInTheDocument()
    }, { timeout: 200 })
    
    // Should handle subsequent events gracefully
    const handler = mockAddEventListener.mock.calls.find(call => call[0] === 'beforeinstallprompt')?.[1]
    if (handler) {
      const newPrompt = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      }
      handler(newPrompt)
    }
    
    // Should still show install button
    expect(screen.getByRole('button', { name: /instalar/i })).toBeInTheDocument()
  })
})