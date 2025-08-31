import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

describe('Input', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />)
    
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('handles text input', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Type here" />)
    
    const input = screen.getByPlaceholderText('Type here')
    await user.type(input, 'Hello World')
    
    expect(input).toHaveValue('Hello World')
  })

  it('handles onChange events', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()
    
    render(<Input onChange={handleChange} placeholder="Change test" />)
    
    const input = screen.getByPlaceholderText('Change test')
    await user.type(input, 'test')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled input" />)
    
    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
  })

  it('does not accept input when disabled', async () => {
    const user = userEvent.setup()
    render(<Input disabled placeholder="Disabled" />)
    
    const input = screen.getByPlaceholderText('Disabled')
    await user.type(input, 'test')
    
    expect(input).toHaveValue('')
  })

  it('renders with different input types', () => {
    const { rerender } = render(<Input type="text" placeholder="Text" />)
    expect(screen.getByPlaceholderText('Text')).toHaveAttribute('type', 'text')
    
    rerender(<Input type="email" placeholder="Email" />)
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')
    
    rerender(<Input type="password" placeholder="Password" />)
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
    
    rerender(<Input type="number" placeholder="Number" />)
    expect(screen.getByPlaceholderText('Number')).toHaveAttribute('type', 'number')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    
    render(<Input ref={ref} placeholder="Ref test" />)
    
    expect(ref).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" placeholder="Custom" />)
    
    const input = screen.getByPlaceholderText('Custom')
    expect(input).toHaveClass('custom-input')
  })

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    
    render(
      <Input
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Focus test"
      />
    )
    
    const input = screen.getByPlaceholderText('Focus test')
    
    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalled()
    
    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalled()
  })

  it('supports controlled input', async () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('')
      
      return (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Controlled"
        />
      )
    }
    
    const user = userEvent.setup()
    render(<TestComponent />)
    
    const input = screen.getByPlaceholderText('Controlled')
    await user.type(input, 'controlled value')
    
    expect(input).toHaveValue('controlled value')
  })

  it('supports uncontrolled input with defaultValue', () => {
    render(<Input defaultValue="default text" placeholder="Default" />)
    
    const input = screen.getByPlaceholderText('Default')
    expect(input).toHaveValue('default text')
  })

  it('handles keyboard events', async () => {
    const handleKeyDown = jest.fn()
    const handleKeyUp = jest.fn()
    const user = userEvent.setup()
    
    render(
      <Input
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        placeholder="Keyboard test"
      />
    )
    
    const input = screen.getByPlaceholderText('Keyboard test')
    await user.type(input, 'a')
    
    expect(handleKeyDown).toHaveBeenCalled()
    expect(handleKeyUp).toHaveBeenCalled()
  })

  it('supports required attribute', () => {
    render(<Input required placeholder="Required" />)
    
    const input = screen.getByPlaceholderText('Required')
    expect(input).toBeRequired()
  })

  it('supports readonly attribute', () => {
    render(<Input readOnly value="readonly" placeholder="Readonly" />)
    
    const input = screen.getByPlaceholderText('Readonly')
    expect(input).toHaveAttribute('readonly')
  })

  it('handles maxLength attribute', async () => {
    const user = userEvent.setup()
    render(<Input maxLength={5} placeholder="Max length" />)
    
    const input = screen.getByPlaceholderText('Max length')
    await user.type(input, '123456789')
    
    expect(input).toHaveValue('12345')
  })

  it('supports autoComplete attribute', () => {
    render(<Input autoComplete="email" placeholder="Autocomplete" />)
    
    const input = screen.getByPlaceholderText('Autocomplete')
    expect(input).toHaveAttribute('autocomplete', 'email')
  })

  it('supports autoFocus attribute', () => {
    render(<Input autoFocus placeholder="Autofocus" />)
    
    const input = screen.getByPlaceholderText('Autofocus')
    expect(input).toHaveFocus()
  })

  it('handles number input with min and max', async () => {
    const user = userEvent.setup()
    render(
      <Input
        type="number"
        min={0}
        max={100}
        placeholder="Number range"
      />
    )
    
    const input = screen.getByPlaceholderText('Number range')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
  })

  it('supports step attribute for number inputs', () => {
    render(
      <Input
        type="number"
        step={0.1}
        placeholder="Step input"
      />
    )
    
    const input = screen.getByPlaceholderText('Step input')
    expect(input).toHaveAttribute('step', '0.1')
  })

  it('handles pattern attribute for validation', () => {
    render(
      <Input
        pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
        placeholder="Phone pattern"
      />
    )
    
    const input = screen.getByPlaceholderText('Phone pattern')
    expect(input).toHaveAttribute('pattern', '[0-9]{3}-[0-9]{3}-[0-9]{4}')
  })

  it('supports aria attributes for accessibility', () => {
    render(
      <Input
        aria-label="Search input"
        aria-describedby="search-help"
        placeholder="Accessible input"
      />
    )
    
    const input = screen.getByLabelText('Search input')
    expect(input).toHaveAttribute('aria-describedby', 'search-help')
  })
})