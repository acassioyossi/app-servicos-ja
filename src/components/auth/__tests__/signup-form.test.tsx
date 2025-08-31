import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupForm } from '../signup-form'
import { useSearchParams } from 'next/navigation'

// Mock next/navigation
const mockPush = jest.fn()
const mockGet = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}))

// Mock useToast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock professions list
jest.mock('@/lib/professions', () => ({
  fullProfessionList: [
    { name: 'Eletricista', category: 'Técnicos' },
    { name: 'Encanador', category: 'Técnicos' },
    { name: 'Diarista', category: 'Limpeza' },
  ],
}))

describe('SignupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockReturnValue(null)
  })

  it('renders signup form correctly', () => {
    render(<SignupForm />)
    
    expect(screen.getByText('Criar sua conta')).toBeInTheDocument()
    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('E-mail inválido.')).toBeInTheDocument()
      expect(screen.getByText('Telefone é obrigatório.')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    const emailInput = screen.getByLabelText(/e-mail/i)
    await user.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('E-mail inválido.')).toBeInTheDocument()
    })
  })

  it('shows validation error for weak password', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    const passwordInput = screen.getByLabelText(/senha/i)
    await user.type(passwordInput, '123')
    
    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeInTheDocument()
    })
  })

  it('renders professional-specific fields when type is Professional', () => {
    mockGet.mockReturnValue('Profissional')
    render(<SignupForm />)
    
    expect(screen.getByText(/selecione sua profissão/i)).toBeInTheDocument()
    expect(screen.getByText(/experiência/i)).toBeInTheDocument()
  })

  it('renders client-specific fields when type is Cliente', () => {
    mockGet.mockReturnValue('Cliente')
    render(<SignupForm />)
    
    expect(screen.getByText(/endereço/i)).toBeInTheDocument()
  })

  it('handles successful form submission for client', async () => {
    const user = userEvent.setup()
    mockGet.mockReturnValue('Cliente')
    render(<SignupForm />)
    
    // Fill required fields
    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/e-mail/i), 'joao@example.com')
    await user.type(screen.getByLabelText(/telefone/i), '11999999999')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.type(screen.getByLabelText(/confirmar senha/i), 'password123')
    
    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox', { name: /aceito os termos/i })
    await user.click(termsCheckbox)
    
    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Conta criada com sucesso!',
        description: 'Bem-vindo ao Wayne! Você já pode começar a usar nossa plataforma.',
      })
    })
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.type(screen.getByLabelText(/confirmar senha/i), 'different123')
    
    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument()
    })
  })

  it('requires terms acceptance before submission', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    // Fill all required fields but don't accept terms
    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/e-mail/i), 'joao@example.com')
    await user.type(screen.getByLabelText(/telefone/i), '11999999999')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.type(screen.getByLabelText(/confirmar senha/i), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Você deve aceitar os termos de uso.')).toBeInTheDocument()
    })
  })

  it('renders Google signup button', () => {
    render(<SignupForm />)
    
    const googleButton = screen.getByRole('button', { name: /continuar com google/i })
    expect(googleButton).toBeInTheDocument()
  })

  it('renders login link', () => {
    render(<SignupForm />)
    
    const loginLink = screen.getByRole('link', { name: /já tem uma conta/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
  })
})