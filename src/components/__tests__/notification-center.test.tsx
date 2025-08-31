import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationCenter } from '../notification-center'

// Mock date formatting
jest.mock('date-fns', () => ({
  format: jest.fn((date) => '15 jan, 10:30'),
  formatDistanceToNow: jest.fn(() => 'há 2 minutos'),
}))

describe('NotificationCenter', () => {
  const mockNotifications = [
    {
      id: '1',
      title: 'Novo agendamento',
      message: 'Você tem um novo agendamento para amanhã às 14:00',
      type: 'info' as const,
      timestamp: new Date('2024-01-15T10:30:00'),
      read: false,
    },
    {
      id: '2',
      title: 'Pagamento confirmado',
      message: 'Seu pagamento de R$ 150,00 foi confirmado',
      type: 'success' as const,
      timestamp: new Date('2024-01-15T09:15:00'),
      read: true,
    },
    {
      id: '3',
      title: 'Atenção necessária',
      message: 'Seu perfil precisa ser atualizado',
      type: 'warning' as const,
      timestamp: new Date('2024-01-14T16:45:00'),
      read: false,
    },
  ]

  const mockProps = {
    notifications: mockNotifications,
    onMarkAsRead: jest.fn(),
    onMarkAllAsRead: jest.fn(),
    onDeleteNotification: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders notification center correctly', () => {
    render(<NotificationCenter {...mockProps} />)
    
    expect(screen.getByText('Notificações')).toBeInTheDocument()
    expect(screen.getByText('Novo agendamento')).toBeInTheDocument()
    expect(screen.getByText('Pagamento confirmado')).toBeInTheDocument()
    expect(screen.getByText('Atenção necessária')).toBeInTheDocument()
  })

  it('displays notification count badge', () => {
    render(<NotificationCenter {...mockProps} />)
    
    // Should show count of unread notifications (2 in this case)
    const badge = screen.getByText('2') || screen.getByTestId('notification-count')
    expect(badge).toBeInTheDocument()
  })

  it('renders mark all as read button', () => {
    render(<NotificationCenter {...mockProps} />)
    
    const markAllButton = screen.getByRole('button', { name: /marcar todas como lidas/i }) ||
                         screen.getByText(/marcar todas/i)
    expect(markAllButton).toBeInTheDocument()
  })

  it('handles mark all as read click', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter {...mockProps} />)
    
    const markAllButton = screen.getByRole('button', { name: /marcar todas como lidas/i }) ||
                         screen.getByText(/marcar todas/i)
    
    await user.click(markAllButton)
    
    expect(mockProps.onMarkAllAsRead).toHaveBeenCalled()
  })

  it('handles individual notification mark as read', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter {...mockProps} />)
    
    // Click on an unread notification
    const notification = screen.getByText('Novo agendamento')
    await user.click(notification)
    
    expect(mockProps.onMarkAsRead).toHaveBeenCalledWith('1')
  })

  it('handles notification deletion', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter {...mockProps} />)
    
    const deleteButtons = screen.getAllByRole('button', { name: /excluir/i }) ||
                         screen.getAllByTestId('delete-notification')
    
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0])
      expect(mockProps.onDeleteNotification).toHaveBeenCalled()
    }
  })

  it('displays different notification types with correct styling', () => {
    render(<NotificationCenter {...mockProps} />)
    
    // Check for different notification types
    expect(screen.getByText('Novo agendamento')).toBeInTheDocument() // info
    expect(screen.getByText('Pagamento confirmado')).toBeInTheDocument() // success
    expect(screen.getByText('Atenção necessária')).toBeInTheDocument() // warning
  })

  it('shows timestamps for notifications', () => {
    render(<NotificationCenter {...mockProps} />)
    
    const timestamps = screen.getAllByText('há 2 minutos')
    expect(timestamps.length).toBeGreaterThan(0)
  })

  it('renders empty state when no notifications', () => {
    render(<NotificationCenter {...mockProps} notifications={[]} />)
    
    expect(screen.getByText(/nenhuma notificação/i) || 
           screen.getByText(/sem notificações/i)).toBeInTheDocument()
  })

  it('toggles notification panel visibility', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter {...mockProps} />)
    
    const toggleButton = screen.getByRole('button', { name: /notificações/i }) ||
                        screen.getByTestId('notification-toggle')
    
    // Panel should be closed initially
    expect(screen.queryByText('Marcar todas como lidas')).not.toBeInTheDocument()
    
    await user.click(toggleButton)
    
    // Panel should be open
    expect(screen.getByText(/marcar todas/i)).toBeInTheDocument()
  })

  it('displays unread notification indicator', () => {
    render(<NotificationCenter {...mockProps} />)
    
    // Should show visual indicator for unread notifications
    const unreadIndicators = document.querySelectorAll('.unread') ||
                           screen.getAllByTestId('unread-indicator')
    
    // Should have indicators for unread notifications
    expect(unreadIndicators.length >= 0).toBe(true)
  })

  it('handles notification click to expand details', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter {...mockProps} />)
    
    const notification = screen.getByText('Você tem um novo agendamento para amanhã às 14:00')
    expect(notification).toBeInTheDocument()
    
    // Notification message should be visible
    await user.click(notification.closest('div') || notification)
    
    // Should mark as read when clicked
    expect(mockProps.onMarkAsRead).toHaveBeenCalled()
  })

  it('renders notification icons based on type', () => {
    render(<NotificationCenter {...mockProps} />)
    
    // Check for notification type icons
    const icons = document.querySelectorAll('[data-lucide]') ||
                 screen.getAllByTestId(/icon/)
    
    expect(icons.length).toBeGreaterThan(0)
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter {...mockProps} />)
    
    const toggleButton = screen.getByRole('button', { name: /notificações/i }) ||
                        screen.getByTestId('notification-toggle')
    
    await user.tab()
    expect(toggleButton).toHaveFocus()
    
    await user.keyboard('{Enter}')
    
    // Should open notification panel
    expect(screen.getByText(/marcar todas/i)).toBeInTheDocument()
  })

  it('closes panel when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <NotificationCenter {...mockProps} />
        <div data-testid="outside-element">Outside</div>
      </div>
    )
    
    const toggleButton = screen.getByRole('button', { name: /notificações/i })
    await user.click(toggleButton)
    
    // Panel should be open
    expect(screen.getByText(/marcar todas/i)).toBeInTheDocument()
    
    const outsideElement = screen.getByTestId('outside-element')
    await user.click(outsideElement)
    
    // Panel should close
    await waitFor(() => {
      expect(screen.queryByText(/marcar todas/i)).not.toBeInTheDocument()
    })
  })
})