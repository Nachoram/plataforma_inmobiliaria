import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Card from '../Card';

describe('Card', () => {
  test('renders children', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('applies base styles', () => {
    render(<Card>Test</Card>);
    const card = screen.getByText('Test').parentElement;
    expect(card).toHaveClass('bg-white', 'rounded-xl', 'shadow-lg', 'p-6');
  });

  test('handles clickable prop', () => {
    const handleClick = vi.fn();
    render(<Card clickable onClick={handleClick}>Clickable</Card>);
    const card = screen.getByText('Clickable').parentElement;
    expect(card).toHaveClass('cursor-pointer', 'hover:border-blue-300');
    fireEvent.click(card!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('handles hover prop', () => {
    render(<Card hover>Hoverable</Card>);
    const card = screen.getByText('Hoverable').parentElement;
    expect(card).toHaveClass('transition-all', 'hover:shadow-xl');
  });

  test('applies custom className', () => {
    render(<Card className="custom-class">Test</Card>);
    const card = screen.getByText('Test').parentElement;
    expect(card).toHaveClass('custom-class');
  });
});
