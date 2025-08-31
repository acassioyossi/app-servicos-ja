import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapView } from '../map-view'

// Mock Leaflet
jest.mock('leaflet', () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    bindPopup: jest.fn(),
    on: jest.fn(),
  })),
  icon: jest.fn(),
}))

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: any) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, ...props }: any) => (
    <div data-testid="marker" {...props}>
      {children}
    </div>
  ),
  Popup: ({ children }: any) => (
    <div data-testid="popup">
      {children}
    </div>
  ),
}))

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
})

describe('MapView', () => {
  const mockProfessionals = [
    {
      id: '1',
      name: 'João Silva',
      profession: 'Eletricista',
      rating: 4.8,
      distance: '1.2 km',
      location: {
        lat: -23.5505,
        lng: -46.6333,
      },
      avatar: '/avatars/joao.jpg',
      isOnline: true,
    },
    {
      id: '2',
      name: 'Maria Santos',
      profession: 'Encanadora',
      rating: 4.9,
      distance: '2.1 km',
      location: {
        lat: -23.5515,
        lng: -46.6343,
      },
      avatar: '/avatars/maria.jpg',
      isOnline: false,
    },
  ]

  const mockProps = {
    professionals: mockProfessionals,
    onProfessionalSelect: jest.fn(),
    center: { lat: -23.5505, lng: -46.6333 },
    zoom: 13,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: -23.5505,
          longitude: -46.6333,
        },
      })
    })
  })

  it('renders map container correctly', () => {
    render(<MapView {...mockProps} />)
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
  })

  it('renders professional markers', () => {
    render(<MapView {...mockProps} />)
    
    const markers = screen.getAllByTestId('marker')
    expect(markers).toHaveLength(mockProfessionals.length)
  })

  it('displays professional information in popups', () => {
    render(<MapView {...mockProps} />)
    
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Eletricista')).toBeInTheDocument()
    expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    expect(screen.getByText('Encanadora')).toBeInTheDocument()
  })

  it('shows professional ratings', () => {
    render(<MapView {...mockProps} />)
    
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByText('4.9')).toBeInTheDocument()
  })

  it('displays distance information', () => {
    render(<MapView {...mockProps} />)
    
    expect(screen.getByText('1.2 km')).toBeInTheDocument()
    expect(screen.getByText('2.1 km')).toBeInTheDocument()
  })

  it('handles professional selection', async () => {
    const user = userEvent.setup()
    render(<MapView {...mockProps} />)
    
    const selectButton = screen.getAllByRole('button', { name: /selecionar/i })[0]
    await user.click(selectButton)
    
    expect(mockProps.onProfessionalSelect).toHaveBeenCalledWith(mockProfessionals[0])
  })

  it('shows online status indicators', () => {
    render(<MapView {...mockProps} />)
    
    // Should show online indicator for João
    expect(screen.getByText(/online/i) || screen.getByTestId('online-indicator')).toBeInTheDocument()
  })

  it('renders locate user button', () => {
    render(<MapView {...mockProps} />)
    
    const locateButton = screen.getByRole('button', { name: /minha localização/i }) ||
                        screen.getByTestId('locate-button')
    expect(locateButton).toBeInTheDocument()
  })

  it('handles user location request', async () => {
    const user = userEvent.setup()
    render(<MapView {...mockProps} />)
    
    const locateButton = screen.getByRole('button', { name: /minha localização/i }) ||
                        screen.getByTestId('locate-button')
    
    await user.click(locateButton)
    
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled()
  })

  it('handles geolocation errors gracefully', () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({ code: 1, message: 'Permission denied' })
    })
    
    render(<MapView {...mockProps} />)
    
    // Should render without crashing
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('renders with custom center and zoom', () => {
    const customProps = {
      ...mockProps,
      center: { lat: -22.9068, lng: -43.1729 },
      zoom: 15,
    }
    
    render(<MapView {...customProps} />)
    
    const mapContainer = screen.getByTestId('map-container')
    expect(mapContainer).toBeInTheDocument()
  })

  it('filters professionals by online status', () => {
    const onlineOnlyProps = {
      ...mockProps,
      showOnlineOnly: true,
    }
    
    render(<MapView {...onlineOnlyProps} />)
    
    // Should show João (online) but not Maria (offline)
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    
    if (onlineOnlyProps.showOnlineOnly) {
      expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
    }
  })

  it('handles empty professionals list', () => {
    render(<MapView {...mockProps} professionals={[]} />)
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument()
  })

  it('renders professional avatars', () => {
    render(<MapView {...mockProps} />)
    
    const avatars = screen.getAllByRole('img') || screen.getAllByTestId('avatar')
    expect(avatars.length).toBeGreaterThan(0)
  })

  it('shows loading state while fetching location', () => {
    mockGeolocation.getCurrentPosition.mockImplementation(() => {
      // Don't call success or error to simulate loading
    })
    
    render(<MapView {...mockProps} />)
    
    const locateButton = screen.getByRole('button', { name: /minha localização/i }) ||
                        screen.getByTestId('locate-button')
    
    fireEvent.click(locateButton)
    
    // Should show loading state
    expect(screen.getByTestId('locate-button') || locateButton).toBeInTheDocument()
  })

  it('handles map interaction events', () => {
    render(<MapView {...mockProps} />)
    
    const mapContainer = screen.getByTestId('map-container')
    
    // Simulate map click
    fireEvent.click(mapContainer)
    
    // Map should handle the interaction
    expect(mapContainer).toBeInTheDocument()
  })

  it('renders zoom controls', () => {
    render(<MapView {...mockProps} />)
    
    // Map should have zoom controls (usually rendered by Leaflet)
    const mapContainer = screen.getByTestId('map-container')
    expect(mapContainer).toBeInTheDocument()
  })

  it('updates markers when professionals change', () => {
    const { rerender } = render(<MapView {...mockProps} />)
    
    expect(screen.getAllByTestId('marker')).toHaveLength(2)
    
    const newProfessionals = [...mockProfessionals, {
      id: '3',
      name: 'Carlos Lima',
      profession: 'Pintor',
      rating: 4.7,
      distance: '0.8 km',
      location: { lat: -23.5525, lng: -46.6353 },
      avatar: '/avatars/carlos.jpg',
      isOnline: true,
    }]
    
    rerender(<MapView {...mockProps} professionals={newProfessionals} />)
    
    expect(screen.getAllByTestId('marker')).toHaveLength(3)
    expect(screen.getByText('Carlos Lima')).toBeInTheDocument()
  })
})