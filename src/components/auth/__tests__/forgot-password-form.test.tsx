import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPasswordForm } from '../forgot-password-form'

// Mock useToast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders forgot password form correctly', () => {
    render(<ForgotPasswordForm />)
    
    expect(screen.getByText('Recuperar Senha')).toBeInTheDocument()
    expect(screen.getByText(/digite seu e-mail ou telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail ou telefone/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar código/i })).toBeInTheDocument()
  })

  it('shows validation error for empty field', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)
    
    const submitButton = screen.getByRole('button', { name: /enviar código/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Este campo é obrigatório.')).toBeInTheDocument()
    })
  })

  it('handles successful form submission with email', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)
    
    const input = screen.getByLabelText(/e-mail ou telefone/i)
    await user.type(input, 'user@example.com')
    
    const submitButton = screen.getByRole('button', { name: /enviar código/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Código enviado!',
        description: 'Verifique seu e-mail para o código de recuperação.',
      })
    })
  })

  it('handles successful form submission with phone', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)
    
    const input = screen.getByLabelText(/e-mail ou telefone/i)
    await user.type(input, '11999999999')
    
    const submitButton = screen.getByRole('button', { name: /enviar código/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Código enviado!',
        description: 'Verifique seu SMS para o código de recuperação.',
      })
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)
    
    const input = screen.getByLabelText(/e-mail ou telefone/i)
    await user.type(input, 'user@example.com')
    
    const submitButton = screen.getByRole('button', { name: /enviar código/i })
    await user.click(submitButton)
    
    // Check for loading state
    expect(screen.getByText(/enviando/i)).toBeInTheDocument()
  })

  it('renders back to login link', () => {
    render(<ForgotPasswordForm />)
    
    const backLink = screen.getByRole('link', { name: /voltar para login/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/login')
  })

  it('displays correct icons', () => {
    render(<ForgotPasswordForm />)
    
    // Check for KeyRound icon in title
    const keyIcon = screen.getByTestId('key-icon') || document.querySelector('[data-lucide="key-round"]')
    expect(keyIcon || screen.getByText('Recuperar Senha')).toBeInTheDocument()
  })

  it('handles form submission with different input formats', async () => {
    const user = userEvent.setup()
    
    const testCases = [
      'user@domain.com',
      '(11) 99999-9999',
      '11999999999',
      'user.name@example.org'
    ]
    
    for (const testInput of testCases) {
      render(<ForgotPasswordForm />)
      
      const input = screen.getByLabelText(/e-mail ou telefone/i)
      await user.clear(input)
      await user.type(input, testInput)
      
      const submitButton = screen.getByRole('button', { name: /enviar código/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled()
      })
      
      // Clean up for next iteration
      mockToast.mockClear()
    }
  })
})