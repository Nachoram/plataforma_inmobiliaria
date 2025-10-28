import React from 'react'
import '@testing-library/jest-dom'

// Mock de Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          maybeSingle: vi.fn(),
          order: vi.fn(() => ({
            limit: vi.fn(),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(),
          list: vi.fn(),
          download: vi.fn(),
          createBucket: vi.fn(),
        })),
        listBuckets: vi.fn(),
      },
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        list: vi.fn(),
        download: vi.fn(),
        createBucket: vi.fn(),
      })),
      listBuckets: vi.fn(),
    },
  },
  formatPriceCLP: vi.fn((price) => `$${price?.toLocaleString('es-CL') || '0'}`),
  isValidPrice: vi.fn(() => true),
}))

// Mock de react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useLocation: () => ({ pathname: '/' }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    Link: ({ children, ...props }: any) => React.createElement('a', props, children),
    Navigate: () => null,
  }
})

// Mock de lucide-react icons - Components React para testing
const createIconMock = (name: string) => () => React.createElement('div', { 'data-testid': `${name}Icon` }, name);

vi.mock('lucide-react', () => ({
  // Existing icons
  Search: createIconMock('Search'),
  Filter: createIconMock('Filter'),
  Building: createIconMock('Building'),
  Building2: createIconMock('Building2'),
  Heart: createIconMock('Heart'),
  TrendingUp: createIconMock('TrendingUp'),
  ChevronDown: createIconMock('ChevronDown'),
  ChevronUp: createIconMock('ChevronUp'),
  ChevronLeft: createIconMock('ChevronLeft'),
  ChevronRight: createIconMock('ChevronRight'),
  DollarSign: createIconMock('DollarSign'),
  User: createIconMock('User'),
  LogOut: createIconMock('LogOut'),
  Mail: createIconMock('Mail'),
  UserCircle: createIconMock('UserCircle'),
  FileText: createIconMock('FileText'),
  Edit3: createIconMock('Edit3'),
  Menu: createIconMock('Menu'),
  X: createIconMock('X'),
  Plus: createIconMock('Plus'),
  Check: createIconMock('Check'),
  AlertCircle: createIconMock('AlertCircle'),
  Loader2: createIconMock('Loader2'),
  Calendar: createIconMock('Calendar'),
  MapPin: createIconMock('MapPin'),
  Phone: createIconMock('Phone'),
  BarChart3: createIconMock('BarChart3'),
  ExternalLink: createIconMock('ExternalLink'),
  MessageSquarePlus: createIconMock('MessageSquarePlus'),
  CheckCircle2: createIconMock('CheckCircle2'),
  Undo2: createIconMock('Undo2'),
  Clock: createIconMock('Clock'),
  CheckCircle: createIconMock('CheckCircle'),
  XCircle: createIconMock('XCircle'),
  ArrowLeft: createIconMock('ArrowLeft'),
  Download: createIconMock('Download'),
  Printer: createIconMock('Printer'),
  Eye: createIconMock('Eye'),
  EyeOff: createIconMock('EyeOff'),
  Send: createIconMock('Send'),
  Upload: createIconMock('Upload'),
  Image: createIconMock('Image'),
  AlertTriangle: createIconMock('AlertTriangle'),
  Shield: createIconMock('Shield'),
  RefreshCw: createIconMock('RefreshCw'),
  Zap: createIconMock('Zap'),
  Home: createIconMock('Home'),
  MessageSquare: createIconMock('MessageSquare'),
  Edit: createIconMock('Edit'),
  Edit2: createIconMock('Edit2'),
  Trash2: createIconMock('Trash2'),
  Save: createIconMock('Save'),
  Code: createIconMock('Code'),
  Lock: createIconMock('Lock'),
  FileStack: createIconMock('FileStack'),
  FileUp: createIconMock('FileUp'),
  Copy: createIconMock('Copy'),
  UserCheck: createIconMock('UserCheck'),
  Briefcase: createIconMock('Briefcase'),
  CreditCard: createIconMock('CreditCard'),
  ShoppingBag: createIconMock('ShoppingBag'),
  Monitor: createIconMock('Monitor'),
  ChefHat: createIconMock('ChefHat'),
  Droplets: createIconMock('Droplets'),
  Sofa: createIconMock('Sofa'),
  Car: createIconMock('Car'),
  Bath: createIconMock('Bath'),
  Bed: createIconMock('Bed'),
  Square: createIconMock('Square'),
}))

// Mock de hooks personalizados
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    loading: false,
    error: null,
    isAuthenticated: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshSession: vi.fn(),
    clearError: vi.fn(),
    retryLastOperation: vi.fn(),
  }),
  useAuthErrorHandler: () => ({
    error: null,
    retryCount: 0,
    handleAuthError: vi.fn(),
    clearError: vi.fn(),
    setRetryCount: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}))

// Mock de componentes de formulario
vi.mock('react-quill', () => ({
  default: ({ value, onChange }: any) => React.createElement('textarea', {
    value,
    onChange: (e: any) => onChange(e.target.value),
    'data-testid': 'quill-editor'
  }),
}))

vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({})),
}))

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    addImage: vi.fn(),
    save: vi.fn(),
    setFontSize: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
  })),
}))

// Mock de route preloader
vi.mock('../hooks/useRoutePreloader', () => ({
  useRoutePreloader: vi.fn(),
  usePropertyRoutePreloader: vi.fn(),
  useContractRoutePreloader: vi.fn(),
  preloadRoute: vi.fn(),
}))

// Mock de electronic signature
vi.mock('../lib/electronicSignature', () => ({
  electronicSignatureService: {
    sendForSignature: vi.fn(() => Promise.resolve({ success: true })),
  },
}))

// Mock de webhook client
vi.mock('../lib/webhook', () => ({
  webhookClient: {
    sendApplicationEvent: vi.fn(() => Promise.resolve()),
  },
}))

// Global test utilities
global.matchMedia = global.matchMedia || function () {
  return {
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }
}

// Mock de IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
