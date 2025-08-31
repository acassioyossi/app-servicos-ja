import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../login-form'

// Mock the auth store
const mockLogin = jest.fn()
jest.mock('@/hooks/use-auth-store', () => ({
  useAuthStore: () => ({
    login: mockLogin,
  }),
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(<LoginForm />)
    
    expect(screen.getByText('Entrar na sua conta')).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('E-mail inválido.')).toBeInTheDocument()
      expect(screen.getByText('A senha é obrigatória.')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/e-mail/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('E-mail inválido.')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/e-mail/i)
    const passwordInput = screen.getByLabelText(/senha/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('client')
      expect(mockPush).toHaveBeenCalledWith('/dashboard/client')
    })
  })

  it('handles professional login type', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    // Select professional type
    const professionalRadio = screen.getByLabelText(/profissional/i)
    await user.click(professionalRadio)
    
    const emailInput = screen.getByLabelText(/e-mail/i)
    const passwordInput = screen.getByLabelText(/senha/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    await user.type(emailInput, 'professional@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('professional')
      expect(mockPush).toHaveBeenCalledWith('/dashboard/professional')
    })
  })

  it('handles partner login type', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    // Select partner type
    const partnerRadio = screen.getByLabelText(/empresa parceira/i)
    await user.click(partnerRadio)
    
    const emailInput = screen.getByLabelText(/e-mail/i)
    const passwordInput = screen.getByLabelText(/senha/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    await user.type(emailInput, 'partner@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('partner')
      expect(mockPush).toHaveBeenCalledWith('/dashboard/partner-company')
    })
  })

  it('renders Google login button', () => {
    render(<LoginForm />)
    
    const googleButton = screen.getByRole('button', { name: /continuar com google/i })
    expect(googleButton).toBeInTheDocument()
  })

  it('renders forgot password link', () => {
    render(<LoginForm />)
    
    const forgotPasswordLink = screen.getByRole('link', { name: /esqueceu sua senha/i })
    expect(forgotPasswordLink).toBeInTheDocument()
    expect(forgotPasswordLink).toHaveAttribute('href', '/login/forgot-password')
  })

  it('renders signup link', () => {
    render(<LoginForm />)
    
    const signupLink = screen.getByRole('link', { name: /criar conta/i })
    expect(signupLink).toBeInTheDocument()
    expect(signupLink).toHaveAttribute('href', '/signup')
  })
})