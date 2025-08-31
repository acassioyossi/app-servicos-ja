import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders with default variant', () => {
    render(<Button>Default</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('renders with primary variant', () => {
    render(<Button variant="default">Primary</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('renders with link variant', () => {
    render(<Button variant="link">Link</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('renders with small size', () => {
    render(<Button size="sm">Small</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('renders with default size', () => {
    render(<Button size="default">Default</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('renders with large size', () => {
    render(<Button size="lg">Large</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('renders with icon size', () => {
    render(<Button size="icon">🔍</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders as different HTML elements', () => {
    render(<Button asChild><a href="#">Link Button</a></Button>)
    
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    
    render(<Button ref={ref}>Button</Button>)
    
    expect(ref).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('handles keyboard events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Keyboard</Button>)
    
    const button = screen.getByRole('button')
    button.focus()
    
    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalled()
    
    await user.keyboard(' ')
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('supports loading state', () => {
    render(<Button disabled>Loading...</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders with icons', () => {
    render(
      <Button>
        <span data-testid="icon">🔍</span>
        Search
      </Button>
    )
    
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<Button aria-label="Close dialog">×</Button>)
    
    const button = screen.getByRole('button', { name: 'Close dialog' })
    expect(button).toBeInTheDocument()
  })

  it('supports type attribute', () => {
    render(<Button type="submit">Submit</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    
    render(
      <Button onFocus={handleFocus} onBlur={handleBlur}>
        Focus Test
      </Button>
    )
    
    const button = screen.getByRole('button')
    
    fireEvent.focus(button)
    expect(handleFocus).toHaveBeenCalled()
    
    fireEvent.blur(button)
    expect(handleBlur).toHaveBeenCalled()
  })
})