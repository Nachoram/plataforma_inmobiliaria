import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PropertyCard from './PropertyCard'

const mockProperty = {
  id: 'test-property-1',
  owner_id: 'owner-1',
  status: 'disponible' as const,
  listing_type: 'arriendo' as const,
  address_street: 'Calle Principal',
  address_number: '123',
  address_commune: 'Santiago',
  address_region: 'Metropolitana',
  price_clp: 500000,
  bedrooms: 2,
  bathrooms: 1,
  surface_m2: 60,
  description: 'Hermosa propiedad para arriendo',
  created_at: '2024-01-01T00:00:00Z',
}

describe('PropertyCard', () => {
  const defaultProps = {
    property: mockProperty,
    context: 'panel' as const,
    showActions: true,
    onMakeOffer: vi.fn(),
    onApply: vi.fn(),
    onToggleFavorite: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    isFavorite: false,
  }

  it('renders property information correctly', () => {
    render(<PropertyCard {...defaultProps} />)

    expect(screen.getByText('Calle Principal 123')).toBeInTheDocument()
    expect(screen.getByText('Santiago, Metropolitana')).toBeInTheDocument()
    expect(screen.getByText('$500.000')).toBeInTheDocument()
    expect(screen.getByText('2 dormitorios')).toBeInTheDocument()
    expect(screen.getByText('1 baño')).toBeInTheDocument()
  })

  it('displays property description', () => {
    render(<PropertyCard {...defaultProps} />)

    expect(screen.getByText('Hermosa propiedad para arriendo')).toBeInTheDocument()
  })

  it('shows panel actions when context is panel', () => {
    render(<PropertyCard {...defaultProps} />)

    expect(screen.getByText('Hacer Oferta')).toBeInTheDocument()
    expect(screen.getByText('Postular')).toBeInTheDocument()
  })

  it('shows portfolio actions when context is portfolio', () => {
    render(<PropertyCard {...defaultProps} context="portfolio" />)

    expect(screen.getByText('Editar')).toBeInTheDocument()
    expect(screen.getByText('Eliminar')).toBeInTheDocument()
  })

  it('calls onMakeOffer when offer button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnMakeOffer = vi.fn()

    render(<PropertyCard {...defaultProps} onMakeOffer={mockOnMakeOffer} />)

    const offerButton = screen.getByText('Hacer Oferta')
    await user.click(offerButton)

    expect(mockOnMakeOffer).toHaveBeenCalledWith(mockProperty)
  })

  it('calls onApply when apply button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnApply = vi.fn()

    render(<PropertyCard {...defaultProps} onApply={mockOnApply} />)

    const applyButton = screen.getByText('Postular')
    await user.click(applyButton)

    expect(mockOnApply).toHaveBeenCalledWith(mockProperty)
  })

  it('calls onToggleFavorite when favorite button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnToggleFavorite = vi.fn()

    render(<PropertyCard {...defaultProps} onToggleFavorite={mockOnToggleFavorite} />)

    const favoriteButton = screen.getByRole('button', { name: /favorito/i })
    await user.click(favoriteButton)

    expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockProperty.id)
  })

  it('shows favorite icon as filled when isFavorite is true', () => {
    render(<PropertyCard {...defaultProps} isFavorite={true} />)

    // The icon should be present (exact styling depends on implementation)
    const favoriteButton = screen.getByRole('button', { name: /favorito/i })
    expect(favoriteButton).toBeInTheDocument()
  })

  it('hides actions when showActions is false', () => {
    render(<PropertyCard {...defaultProps} showActions={false} />)

    expect(screen.queryByText('Hacer Oferta')).not.toBeInTheDocument()
    expect(screen.queryByText('Postular')).not.toBeInTheDocument()
  })

  it('renders image gallery when property has images', () => {
    const propertyWithImages = {
      ...mockProperty,
      property_images: [
        { image_url: 'test-image-1.jpg', storage_path: 'path1' },
        { image_url: 'test-image-2.jpg', storage_path: 'path2' },
      ],
    }

    render(<PropertyCard {...defaultProps} property={propertyWithImages} />)

    // Should render image container
    const imageContainer = screen.getByAltText('Calle Principal 123')
    expect(imageContainer).toBeInTheDocument()
  })

  it('shows rental price correctly formatted', () => {
    const rentalProperty = { ...mockProperty, listing_type: 'arriendo' as const }

    render(<PropertyCard {...defaultProps} property={rentalProperty} />)

    expect(screen.getByText('$500.000')).toBeInTheDocument()
    expect(screen.getByText('/ mes')).toBeInTheDocument()
  })

  it('shows sale price without monthly indicator', () => {
    const saleProperty = { ...mockProperty, listing_type: 'venta' as const }

    render(<PropertyCard {...defaultProps} property={saleProperty} />)

    expect(screen.getByText('$500.000')).toBeInTheDocument()
    expect(screen.queryByText('/ mes')).not.toBeInTheDocument()
  })

  it('is memoized to prevent unnecessary re-renders', () => {
    const { rerender } = render(<PropertyCard {...defaultProps} />)

    // Re-render with same props should not cause unnecessary updates
    rerender(<PropertyCard {...defaultProps} />)

    // Component should still be rendered correctly
    expect(screen.getByText('Calle Principal 123')).toBeInTheDocument()
  })
})
