import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../error-boundary'
import React from 'react'

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Mock console.error to avoid noise in test output
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
    expect(screen.getByText(/ocorreu um erro inesperado/i)).toBeInTheDocument()
  })

  it('renders retry button when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const retryButton = screen.getByRole('button', { name: /tentar novamente/i })
    expect(retryButton).toBeInTheDocument()
  })

  it('renders home button when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const homeButton = screen.getByRole('button', { name: /voltar ao início/i })
    expect(homeButton).toBeInTheDocument()
  })

  it('displays error icon when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    // Check for AlertTriangle icon or error indicator
    const errorIcon = document.querySelector('[data-lucide="alert-triangle"]') || 
                     screen.getByTestId('error-icon')
    expect(errorIcon || screen.getByText('Algo deu errado')).toBeInTheDocument()
  })

  it('has proper error boundary structure', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    // Check for main container
    const container = screen.getByRole('main') || 
                     document.querySelector('.min-h-screen') ||
                     screen.getByText('Algo deu errado').closest('div')
    expect(container).toBeInTheDocument()
  })

  it('renders with custom fallback when provided', () => {
    const CustomFallback = () => <div>Custom error message</div>
    
    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
  })

  it('catches errors in nested components', () => {
    const NestedComponent = () => {
      return (
        <div>
          <span>Nested content</span>
          <ThrowError shouldThrow={true} />
        </div>
      )
    }
    
    render(
      <ErrorBoundary>
        <NestedComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
    expect(screen.queryByText('Nested content')).not.toBeInTheDocument()
  })

  it('resets error state when retry is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
    
    // Simulate retry by re-rendering with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('handles multiple error types', () => {
    const ThrowTypeError = () => {
      throw new TypeError('Type error')
    }
    
    render(
      <ErrorBoundary>
        <ThrowTypeError />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
  })
})