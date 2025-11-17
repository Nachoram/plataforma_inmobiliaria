import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CustomButton from './CustomButton'

describe('CustomButton', () => {
  it('renders with default props', () => {
    render(<CustomButton>Click me</CustomButton>)

    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-blue-600') // default variant
  })

  it('renders with primary variant', () => {
    render(<CustomButton variant="primary">Primary Button</CustomButton>)

    const button = screen.getByRole('button', { name: /primary button/i })
    expect(button).toHaveClass('bg-blue-600')
    expect(button).toHaveClass('text-white')
  })

  it('renders with secondary variant', () => {
    render(<CustomButton variant="secondary">Secondary Button</CustomButton>)

    const button = screen.getByRole('button', { name: /secondary button/i })
    expect(button).toHaveClass('bg-gray-600')
  })

  it('renders with success variant', () => {
    render(<CustomButton variant="success">Success Button</CustomButton>)

    const button = screen.getByRole('button', { name: /success button/i })
    expect(button).toHaveClass('bg-green-600')
  })

  it('renders with danger variant', () => {
    render(<CustomButton variant="danger">Danger Button</CustomButton>)

    const button = screen.getByRole('button', { name: /danger button/i })
    expect(button).toHaveClass('bg-red-600')
  })

  it('renders with outline variant', () => {
    render(<CustomButton variant="outline">Outline Button</CustomButton>)

    const button = screen.getByRole('button', { name: /outline button/i })
    expect(button).toHaveClass('border-gray-300')
    expect(button).toHaveClass('text-gray-700')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<CustomButton size="sm">Small</CustomButton>)
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm')

    rerender(<CustomButton size="md">Medium</CustomButton>)
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-base')

    rerender(<CustomButton size="lg">Large</CustomButton>)
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg')
  })

  it('shows loading state correctly', () => {
    render(<CustomButton loading loadingText="Cargando...">Click me</CustomButton>)

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
    expect(screen.queryByText('Click me')).not.toBeInTheDocument()

    // Should be disabled when loading
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const mockOnClick = vi.fn()

    render(<CustomButton onClick={mockOnClick}>Click me</CustomButton>)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const mockOnClick = vi.fn()

    render(<CustomButton onClick={mockOnClick} disabled>Click me</CustomButton>)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<CustomButton className="custom-class">Click me</CustomButton>)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('passes through other props to button element', () => {
    render(<CustomButton type="submit" data-testid="custom-button">Click me</CustomButton>)

    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('renders as anchor when href is provided', () => {
    render(<CustomButton href="/test">Link Button</CustomButton>)

    const link = screen.getByRole('link', { name: /link button/i })
    expect(link).toHaveAttribute('href', '/test')
    expect(link.tagName).toBe('A')
  })

  it('renders children correctly', () => {
    render(
      <CustomButton>
        <span data-testid="child">Child content</span>
      </CustomButton>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('handles complex children', () => {
    render(
      <CustomButton>
        <div>
          <span>Complex</span>
          <strong>Children</strong>
        </div>
      </CustomButton>
    )

    expect(screen.getByText('Complex')).toBeInTheDocument()
    expect(screen.getByText('Children')).toBeInTheDocument()
  })
})
