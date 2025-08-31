import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '../card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders card component', () => {
      render(
        <Card data-testid="card">
          <div>Card content</div>
        </Card>
      )
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(
        <Card className="custom-card" data-testid="card">
          Content
        </Card>
      )
      
      expect(screen.getByTestId('card')).toHaveClass('custom-card')
    })

    it('forwards ref correctly', () => {
      const ref = jest.fn()
      
      render(
        <Card ref={ref} data-testid="card">
          Content
        </Card>
      )
      
      expect(ref).toHaveBeenCalled()
    })
  })

  describe('CardHeader', () => {
    it('renders card header', () => {
      render(
        <Card>
          <CardHeader data-testid="card-header">
            <div>Header content</div>
          </CardHeader>
        </Card>
      )
      
      expect(screen.getByTestId('card-header')).toBeInTheDocument()
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('applies custom className to header', () => {
      render(
        <CardHeader className="custom-header" data-testid="header">
          Header
        </CardHeader>
      )
      
      expect(screen.getByTestId('header')).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('renders card title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      expect(screen.getByText('Card Title')).toBeInTheDocument()
    })

    it('renders as h3 by default', () => {
      render(<CardTitle>Title</CardTitle>)
      
      const title = screen.getByText('Title')
      expect(title.tagName).toBe('H3')
    })

    it('applies custom className to title', () => {
      render(
        <CardTitle className="custom-title">
          Title
        </CardTitle>
      )
      
      expect(screen.getByText('Title')).toHaveClass('custom-title')
    })
  })

  describe('CardDescription', () => {
    it('renders card description', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>This is a description</CardDescription>
          </CardHeader>
        </Card>
      )
      
      expect(screen.getByText('This is a description')).toBeInTheDocument()
    })

    it('renders as p element', () => {
      render(<CardDescription>Description</CardDescription>)
      
      const description = screen.getByText('Description')
      expect(description.tagName).toBe('P')
    })

    it('applies custom className to description', () => {
      render(
        <CardDescription className="custom-description">
          Description
        </CardDescription>
      )
      
      expect(screen.getByText('Description')).toHaveClass('custom-description')
    })
  })

  describe('CardContent', () => {
    it('renders card content', () => {
      render(
        <Card>
          <CardContent data-testid="card-content">
            <p>Main content goes here</p>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByTestId('card-content')).toBeInTheDocument()
      expect(screen.getByText('Main content goes here')).toBeInTheDocument()
    })

    it('applies custom className to content', () => {
      render(
        <CardContent className="custom-content" data-testid="content">
          Content
        </CardContent>
      )
      
      expect(screen.getByTestId('content')).toHaveClass('custom-content')
    })
  })

  describe('CardFooter', () => {
    it('renders card footer', () => {
      render(
        <Card>
          <CardFooter data-testid="card-footer">
            <button>Action</button>
          </CardFooter>
        </Card>
      )
      
      expect(screen.getByTestId('card-footer')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })

    it('applies custom className to footer', () => {
      render(
        <CardFooter className="custom-footer" data-testid="footer">
          Footer
        </CardFooter>
      )
      
      expect(screen.getByTestId('footer')).toHaveClass('custom-footer')
    })
  })

  describe('Complete Card Structure', () => {
    it('renders complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
            <CardDescription>This card has all components</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter>
            <button>Primary Action</button>
            <button>Secondary Action</button>
          </CardFooter>
        </Card>
      )
      
      expect(screen.getByTestId('complete-card')).toBeInTheDocument()
      expect(screen.getByText('Complete Card')).toBeInTheDocument()
      expect(screen.getByText('This card has all components')).toBeInTheDocument()
      expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Primary Action' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Secondary Action' })).toBeInTheDocument()
    })

    it('renders card with only content', () => {
      render(
        <Card>
          <CardContent>
            <p>Simple card with just content</p>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByText('Simple card with just content')).toBeInTheDocument()
    })

    it('renders card with header and content only', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Header Only Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Content without footer</p>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByText('Header Only Card')).toBeInTheDocument()
      expect(screen.getByText('Content without footer')).toBeInTheDocument()
    })

    it('handles nested content correctly', () => {
      render(
        <Card>
          <CardContent>
            <div>
              <h4>Nested Title</h4>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
                <li>Item 3</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByText('Nested Title')).toBeInTheDocument()
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Item 3')).toBeInTheDocument()
    })

    it('supports multiple cards', () => {
      render(
        <div>
          <Card data-testid="card-1">
            <CardTitle>First Card</CardTitle>
          </Card>
          <Card data-testid="card-2">
            <CardTitle>Second Card</CardTitle>
          </Card>
        </div>
      )
      
      expect(screen.getByTestId('card-1')).toBeInTheDocument()
      expect(screen.getByTestId('card-2')).toBeInTheDocument()
      expect(screen.getByText('First Card')).toBeInTheDocument()
      expect(screen.getByText('Second Card')).toBeInTheDocument()
    })

    it('handles empty card gracefully', () => {
      render(<Card data-testid="empty-card" />)
      
      expect(screen.getByTestId('empty-card')).toBeInTheDocument()
    })

    it('supports custom HTML attributes', () => {
      render(
        <Card
          data-testid="custom-card"
          role="article"
          aria-label="Custom card"
        >
          <CardContent>Custom attributes</CardContent>
        </Card>
      )
      
      const card = screen.getByTestId('custom-card')
      expect(card).toHaveAttribute('role', 'article')
      expect(card).toHaveAttribute('aria-label', 'Custom card')
    })
  })
})