import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<Modal {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when modal content is clicked', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape key press', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on Escape when closeOnEscape is false', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close on overlay click when closeOnOverlay is false', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} closeOnOverlay={false} />);
    
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies custom size classes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-md');

    rerender(<Modal {...defaultProps} size="md" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-lg');

    rerender(<Modal {...defaultProps} size="lg" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-2xl');

    rerender(<Modal {...defaultProps} size="xl" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-4xl');
  });

  it('renders without title when not provided', () => {
    render(<Modal {...defaultProps} title={undefined} />);
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    const footer = <button>Footer Button</button>;
    render(<Modal {...defaultProps} footer={footer} />);
    
    expect(screen.getByText('Footer Button')).toBeInTheDocument();
  });

  it('traps focus within modal', async () => {
    render(
      <div>
        <button>Outside Button</button>
        <Modal {...defaultProps}>
          <button>Inside Button 1</button>
          <button>Inside Button 2</button>
        </Modal>
      </div>
    );

    const insideButton1 = screen.getByText('Inside Button 1');
    const insideButton2 = screen.getByText('Inside Button 2');
    const closeButton = screen.getByRole('button', { name: /close/i });

    // Focus should be trapped within modal
    fireEvent.keyDown(closeButton, { key: 'Tab' });
    await waitFor(() => {
      expect(insideButton1).toHaveFocus();
    });

    fireEvent.keyDown(insideButton2, { key: 'Tab' });
    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });
  });

  it('restores focus to trigger element when closed', async () => {
    const triggerButton = document.createElement('button');
    triggerButton.textContent = 'Open Modal';
    document.body.appendChild(triggerButton);
    triggerButton.focus();

    const { rerender } = render(<Modal {...defaultProps} />);
    
    rerender(<Modal {...defaultProps} isOpen={false} />);
    
    await waitFor(() => {
      expect(triggerButton).toHaveFocus();
    });

    document.body.removeChild(triggerButton);
  });

  it('prevents body scroll when open', () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(<Modal {...defaultProps} isOpen={false} />);
    
    expect(document.body.style.overflow).toBe('');
  });

  it('has proper ARIA attributes', () => {
    render(<Modal {...defaultProps} />);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby');
  });

  it('supports custom className', () => {
    render(<Modal {...defaultProps} className="custom-modal" />);
    
    expect(screen.getByRole('dialog')).toHaveClass('custom-modal');
  });

  it('animates in and out', async () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    
    expect(screen.getByTestId('modal-overlay')).toHaveClass('animate-fade-in');
    expect(screen.getByRole('dialog')).toHaveClass('animate-scale-in');
    
    rerender(<Modal {...defaultProps} isOpen={false} />);
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});