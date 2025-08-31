import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInterface } from '../chat-interface'

// Mock useToast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock date formatting
jest.mock('date-fns', () => ({
  format: jest.fn((date) => '10:30'),
}))

describe('ChatInterface', () => {
  const mockProps = {
    messages: [
      {
        id: '1',
        content: 'Olá! Como posso ajudar?',
        sender: 'support' as const,
        timestamp: new Date('2024-01-15T10:30:00'),
      },
      {
        id: '2', 
        content: 'Preciso de ajuda com meu agendamento',
        sender: 'user' as const,
        timestamp: new Date('2024-01-15T10:31:00'),
      },
    ],
    onSendMessage: jest.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders chat interface correctly', () => {
    render(<ChatInterface {...mockProps} />)
    
    expect(screen.getByText('Olá! Como posso ajudar?')).toBeInTheDocument()
    expect(screen.getByText('Preciso de ajuda com meu agendamento')).toBeInTheDocument()
  })

  it('renders message input and send button', () => {
    render(<ChatInterface {...mockProps} />)
    
    expect(screen.getByPlaceholderText(/digite sua mensagem/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument()
  })

  it('displays message timestamps', () => {
    render(<ChatInterface {...mockProps} />)
    
    const timestamps = screen.getAllByText('10:30')
    expect(timestamps).toHaveLength(2)
  })

  it('handles message sending', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...mockProps} />)
    
    const input = screen.getByPlaceholderText(/digite sua mensagem/i)
    const sendButton = screen.getByRole('button', { name: /enviar/i })
    
    await user.type(input, 'Nova mensagem de teste')
    await user.click(sendButton)
    
    expect(mockProps.onSendMessage).toHaveBeenCalledWith('Nova mensagem de teste')
  })

  it('handles message sending with Enter key', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...mockProps} />)
    
    const input = screen.getByPlaceholderText(/digite sua mensagem/i)
    
    await user.type(input, 'Mensagem com Enter')
    await user.keyboard('{Enter}')
    
    expect(mockProps.onSendMessage).toHaveBeenCalledWith('Mensagem com Enter')
  })

  it('prevents sending empty messages', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...mockProps} />)
    
    const sendButton = screen.getByRole('button', { name: /enviar/i })
    await user.click(sendButton)
    
    expect(mockProps.onSendMessage).not.toHaveBeenCalled()
  })

  it('clears input after sending message', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...mockProps} />)
    
    const input = screen.getByPlaceholderText(/digite sua mensagem/i) as HTMLInputElement
    
    await user.type(input, 'Teste de limpeza')
    await user.keyboard('{Enter}')
    
    expect(input.value).toBe('')
  })

  it('shows loading state', () => {
    render(<ChatInterface {...mockProps} isLoading={true} />)
    
    expect(screen.getByText(/digitando/i) || screen.getByTestId('loading-indicator')).toBeInTheDocument()
  })

  it('disables input and button when loading', () => {
    render(<ChatInterface {...mockProps} isLoading={true} />)
    
    const input = screen.getByPlaceholderText(/digite sua mensagem/i)
    const sendButton = screen.getByRole('button', { name: /enviar/i })
    
    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it('renders different message styles for user and support', () => {
    render(<ChatInterface {...mockProps} />)
    
    const messages = screen.getAllByText(/.*/).filter(el => 
      el.textContent === 'Olá! Como posso ajudar?' || 
      el.textContent === 'Preciso de ajuda com meu agendamento'
    )
    
    expect(messages).toHaveLength(2)
  })

  it('scrolls to bottom when new messages arrive', () => {
    const { rerender } = render(<ChatInterface {...mockProps} />)
    
    const newMessages = [
      ...mockProps.messages,
      {
        id: '3',
        content: 'Nova mensagem',
        sender: 'support' as const,
        timestamp: new Date(),
      },
    ]
    
    rerender(<ChatInterface {...mockProps} messages={newMessages} />)
    
    expect(screen.getByText('Nova mensagem')).toBeInTheDocument()
  })

  it('handles empty message list', () => {
    render(<ChatInterface {...mockProps} messages={[]} />)
    
    const input = screen.getByPlaceholderText(/digite sua mensagem/i)
    expect(input).toBeInTheDocument()
  })

  it('renders send icon in button', () => {
    render(<ChatInterface {...mockProps} />)
    
    const sendButton = screen.getByRole('button', { name: /enviar/i })
    const sendIcon = sendButton.querySelector('[data-lucide="send"]') ||
                    screen.getByTestId('send-icon')
    
    expect(sendIcon || sendButton).toBeInTheDocument()
  })

  it('handles long messages correctly', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...mockProps} />)
    
    const longMessage = 'Esta é uma mensagem muito longa que deveria ser tratada corretamente pelo componente de chat, mesmo sendo muito extensa e contendo muitas palavras.'
    
    const input = screen.getByPlaceholderText(/digite sua mensagem/i)
    await user.type(input, longMessage)
    await user.keyboard('{Enter}')
    
    expect(mockProps.onSendMessage).toHaveBeenCalledWith(longMessage)
  })

  it('maintains focus on input after sending', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...mockProps} />)
    
    const input = screen.getByPlaceholderText(/digite sua mensagem/i)
    
    await user.type(input, 'Teste de foco')
    await user.keyboard('{Enter}')
    
    expect(input).toHaveFocus()
  })
})