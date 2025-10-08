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

// Mock de lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => 'SearchIcon',
  Filter: () => 'FilterIcon',
  Building: () => 'BuildingIcon',
  Heart: () => 'HeartIcon',
  TrendingUp: () => 'TrendingUpIcon',
  ChevronDown: () => 'ChevronDownIcon',
  ChevronUp: () => 'ChevronUpIcon',
  DollarSign: () => 'DollarSignIcon',
  User: () => 'UserIcon',
  LogOut: () => 'LogOutIcon',
  Mail: () => 'MailIcon',
  UserCircle: () => 'UserCircleIcon',
  FileText: () => 'FileTextIcon',
  Edit3: () => 'Edit3Icon',
  Menu: () => 'MenuIcon',
  X: () => 'XIcon',
  Plus: () => 'PlusIcon',
  Check: () => 'CheckIcon',
  AlertCircle: () => 'AlertCircleIcon',
  Loader2: () => 'Loader2Icon',
  Calendar: () => 'CalendarIcon',
  MapPin: () => 'MapPinIcon',
  Phone: () => 'PhoneIcon',
  BarChart3: () => 'BarChart3Icon',
  ExternalLink: () => 'ExternalLinkIcon',
  MessageSquarePlus: () => 'MessageSquarePlusIcon',
  CheckCircle2: () => 'CheckCircle2Icon',
  Undo2: () => 'Undo2Icon',
  Clock: () => 'ClockIcon',
  CheckCircle: () => 'CheckCircleIcon',
  XCircle: () => 'XCircleIcon',
  ArrowLeft: () => 'ArrowLeftIcon',
  Download: () => 'DownloadIcon',
  Printer: () => 'PrinterIcon',
  Eye: () => 'EyeIcon',
  Send: () => 'SendIcon',
  Upload: () => 'UploadIcon',
  Image: () => 'ImageIcon',
  AlertTriangle: () => 'AlertTriangleIcon',
  Shield: () => 'ShieldIcon',
  RefreshCw: () => 'RefreshCwIcon',
  Zap: () => 'ZapIcon',
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
