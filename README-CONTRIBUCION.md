# 🤝 **Guía de Contribución**

> **Estándares de desarrollo, testing, y proceso de contribución para la plataforma inmobiliaria**

---

## 📋 **Índice**
- [🚀 Empezando a Contribuir](#-empezando-a-contribuir)
- [💻 Configuración del Entorno](#-configuración-del-entorno)
- [📝 Estándares de Código](#-estándares-de-código)
- [🧪 Testing y Calidad](#-testing-y-calidad)
- [🔄 Flujo de Trabajo (Git Flow)](#-flujo-de-trabajo-git-flow)
- [📖 Documentación](#-documentación)
- [🐛 Reportar Issues](#-reportar-issues)
- [✅ Code Review](#-code-review)
- [🎯 Tipos de Contribuciones](#-tipos-de-contribuciones)

---

## 🚀 **Empezando a Contribuir**

### **Pre-requisitos para Contribuir**

Antes de empezar, asegúrate de tener:

- ✅ Node.js 18+ instalado
- ✅ npm 9+ instalado  
- ✅ Git configurado con tu nombre y email
- ✅ Cuenta en GitHub
- ✅ Editor de código (VS Code recomendado)
- ✅ Acceso a Supabase (para testing)

### **Configuración Inicial**

```bash
# 1. Fork del repositorio en GitHub
git clone https://github.com/TU_USERNAME/plataforma_inmobiliaria.git
cd plataforma_inmobiliaria

# 2. Configurar upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/plataforma_inmobiliaria.git

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 5. Verificar que todo funciona
npm run dev
npm run test:unit
npm run lint
```

### **Estructura de Ramas**

```
main              # Producción estable
├── develop       # Desarrollo principal
│   ├── feature/* # Nuevas características
│   ├── bugfix/*  # Corrección de bugs
│   └── hotfix/*  # Fixes urgentes
└── release/*     # Preparación de releases
```

---

## 💻 **Configuración del Entorno**

### **VS Code - Configuración Recomendada**

#### **Extensiones Requeridas**
```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

#### **Configuración de Workspace**
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

#### **Snippets Útiles**
```json
// .vscode/snippets.json
{
  "React Functional Component": {
    "prefix": "rfc",
    "body": [
      "interface ${1:ComponentName}Props {",
      "  $2",
      "}",
      "",
      "export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({",
      "  $3",
      "}) => {",
      "  return (",
      "    <div>",
      "      $4",
      "    </div>",
      "  );",
      "};"
    ],
    "description": "React Functional Component with TypeScript"
  },
  "Custom Hook": {
    "prefix": "hook",
    "body": [
      "import { useState, useEffect } from 'react';",
      "",
      "export const use${1:HookName} = () => {",
      "  const [${2:state}, set${2/(.*)/${1:/capitalize}/}] = useState($3);",
      "",
      "  useEffect(() => {",
      "    $4",
      "  }, []);",
      "",
      "  return {",
      "    ${2:state},",
      "    set${2/(.*)/${1:/capitalize}/}",
      "  };",
      "};"
    ],
    "description": "Custom React Hook"
  }
}
```

### **Scripts de Desarrollo**

#### **package.json - Scripts Completos**
```json
{
  "scripts": {
    // Desarrollo
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    
    // Testing
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run src/**/*.test.{ts,tsx}",
    "test:integration": "vitest run tests/integration/**/*.test.ts",
    "test:e2e": "cypress run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    
    // Linting y Formateo
    "lint": "npm run lint:ts && npm run lint:css",
    "lint:ts": "eslint src --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "lint:css": "stylelint src/**/*.css",
    "lint:fix": "npm run lint:ts -- --fix && npm run lint:css -- --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,md}\"",
    
    // Type checking
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    
    // Database
    "db:generate-types": "supabase gen types typescript --local > src/lib/database.types.ts",
    "db:reset": "supabase db reset --local",
    "db:migrate": "supabase db push --local",
    
    // Calidad
    "quality": "npm run lint && npm run type-check && npm run test:unit && npm run format:check",
    
    // Pre-commit
    "pre-commit": "npm run quality",
    "pre-push": "npm run test"
  }
}
```

### **Git Hooks - Husky**

#### **Configuración de Husky**
```bash
# Instalar husky
npm install --save-dev husky

# Configurar husky
npx husky install

# Crear hooks
npx husky add .husky/pre-commit "npm run pre-commit"
npx husky add .husky/pre-push "npm run pre-push"
```

#### **.husky/pre-commit**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Type checking
echo "📝 Type checking..."
npm run type-check

# Linting
echo "🔍 Linting..."
npm run lint

# Unit tests
echo "🧪 Running unit tests..."
npm run test:unit

# Format check
echo "💅 Checking formatting..."
npm run format:check

echo "✅ Pre-commit checks passed!"
```

---

## 📝 **Estándares de Código**

### **TypeScript - Convenciones**

#### **Naming Conventions**
```typescript
// ✅ Correcto
// PascalCase para tipos, interfaces y componentes
interface UserProfile {
  firstName: string;
  lastName: string;
}

export const UserCard: React.FC<UserCardProps> = () => {};

// camelCase para variables, funciones y métodos
const userName = 'john_doe';
const getUserData = async (id: string) => {};

// SCREAMING_SNAKE_CASE para constantes
const API_ENDPOINTS = {
  PROPERTIES: '/properties',
  USERS: '/users'
} as const;

// kebab-case para archivos y carpetas
// user-profile.component.tsx
// property-form/
```

#### **Estructura de Interfaces**
```typescript
// ✅ Interfaz bien estructurada
interface PropertyFormData {
  // Campos requeridos primero
  listingType: ListingType;
  propertyType: PropertyType;
  address: PropertyAddress;
  price: number;
  
  // Campos opcionales después
  description?: string;
  features?: PropertyFeatures;
  
  // Metadatos al final
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ Uso de utility types
type PropertyUpdate = Partial<Pick<PropertyFormData, 'description' | 'price' | 'features'>>;
type PropertyCreate = Omit<PropertyFormData, 'createdAt' | 'updatedAt'>;
```

#### **Error Handling**
```typescript
// ✅ Error handling con Result type
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const fetchProperty = async (id: string): Promise<Result<Property>> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
};

// ✅ Uso con error handling
const handleFetchProperty = async (id: string) => {
  const result = await fetchProperty(id);
  
  if (!result.success) {
    console.error('Error fetching property:', result.error.message);
    setError(result.error.message);
    return;
  }
  
  setProperty(result.data);
};
```

### **React - Mejores Prácticas**

#### **Estructura de Componentes**
```typescript
// ✅ Estructura de componente completa
import React, { useState, useEffect, useCallback } from 'react';
import { Property } from '@/lib/types';
import { useProperties } from '@/hooks/useProperties';

interface PropertyCardProps {
  property: Property;
  onFavoriteToggle?: (propertyId: string) => void;
  className?: string;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onFavoriteToggle,
  className = ''
}) => {
  // 1. Estado local
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // 2. Hooks personalizados
  const { toggleFavorite } = useProperties();

  // 3. Efectos
  useEffect(() => {
    setIsFavorite(property.isFavorite || false);
  }, [property.isFavorite]);

  // 4. Callbacks
  const handleFavoriteClick = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await toggleFavorite(property.id);
      setIsFavorite(!isFavorite);
      onFavoriteToggle?.(property.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  }, [property.id, isFavorite, isLoading, toggleFavorite, onFavoriteToggle]);

  // 5. Render
  return (
    <div className={`property-card ${className}`}>
      {/* Contenido del componente */}
    </div>
  );
};

// 6. Display name para debugging
PropertyCard.displayName = 'PropertyCard';
```

#### **Hooks Personalizados**
```typescript
// ✅ Hook bien estructurado
export const usePropertyForm = (initialData?: Partial<PropertyFormData>) => {
  const [formData, setFormData] = useState<PropertyFormData>({
    ...DEFAULT_PROPERTY_DATA,
    ...initialData
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((field: keyof PropertyFormData, value: any) => {
    const fieldErrors = { ...errors };
    
    switch (field) {
      case 'price':
        if (!value || value <= 0) {
          fieldErrors[field] = 'El precio debe ser mayor a 0';
        } else {
          delete fieldErrors[field];
        }
        break;
      // ... más validaciones
    }
    
    setErrors(fieldErrors);
    return !fieldErrors[field];
  }, [errors]);

  const updateField = useCallback(<K extends keyof PropertyFormData>(
    field: K,
    value: PropertyFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  }, [validateField]);

  const submitForm = useCallback(async (onSubmit: (data: PropertyFormData) => Promise<void>) => {
    setIsSubmitting(true);
    try {
      const isValid = Object.keys(formData).every(key => 
        validateField(key as keyof PropertyFormData, formData[key as keyof PropertyFormData])
      );
      
      if (!isValid) {
        throw new Error('Por favor corrige los errores en el formulario');
      }
      
      await onSubmit(formData);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateField]);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    submitForm,
    hasErrors: Object.keys(errors).length > 0
  };
};
```

### **CSS/Tailwind - Convenciones**

#### **Clases Organizadas**
```typescript
// ✅ Clases organizadas por categoría
const className = clsx(
  // Layout
  'flex items-center justify-between',
  'w-full h-12',
  'p-4 mx-auto',
  
  // Apariencia
  'bg-white rounded-lg shadow-md',
  'border border-gray-200',
  
  // Tipografía
  'text-sm font-medium text-gray-900',
  
  // Estados
  'hover:bg-gray-50 focus:outline-none focus:ring-2',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Responsive
  'md:w-auto md:h-auto lg:px-6',
  
  // Condicionales
  isActive && 'bg-blue-50 border-blue-200',
  hasError && 'border-red-500 text-red-700'
);
```

#### **Componentes de Estilo Reutilizables**
```typescript
// src/lib/styles.ts
export const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary"
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
```

---

## 🧪 **Testing y Calidad**

### **Configuración de Testing**

#### **vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'src/main.tsx'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

#### **Test Setup**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
      }))
    }
  }
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### **Tipos de Tests**

#### **1. Unit Tests - Componentes**
```typescript
// src/components/PropertyCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyCard } from './PropertyCard';
import { mockProperty } from '@/test/mocks';

describe('PropertyCard', () => {
  const defaultProps = {
    property: mockProperty,
    onFavoriteToggle: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders property information correctly', () => {
    render(<PropertyCard {...defaultProps} />);
    
    expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
    expect(screen.getByText(`$${mockProperty.price.toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProperty.bedrooms} dormitorios`)).toBeInTheDocument();
  });

  it('calls onFavoriteToggle when favorite button is clicked', async () => {
    render(<PropertyCard {...defaultProps} />);
    
    const favoriteButton = screen.getByRole('button', { name: /agregar a favoritos/i });
    fireEvent.click(favoriteButton);
    
    await waitFor(() => {
      expect(defaultProps.onFavoriteToggle).toHaveBeenCalledWith(mockProperty.id);
    });
  });

  it('shows loading state when favoriting', async () => {
    render(<PropertyCard {...defaultProps} />);
    
    const favoriteButton = screen.getByRole('button', { name: /agregar a favoritos/i });
    fireEvent.click(favoriteButton);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PropertyCard {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

#### **2. Unit Tests - Hooks**
```typescript
// src/hooks/useProperties.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProperties } from './useProperties';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProperties', () => {
  it('fetches properties on mount', async () => {
    const { result } = renderHook(() => useProperties(), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.properties).toBeDefined();
  });

  it('creates property successfully', async () => {
    const { result } = renderHook(() => useProperties(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.createProperty({
        title: 'Test Property',
        price: 100000000,
        // ... más campos
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

#### **3. Integration Tests**
```typescript
// tests/integration/property-flow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropertyPublicationForm } from '@/components/forms/PropertyPublicationForm';
import { mockUser } from '@/test/mocks';

const renderWithProviders = (component: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider value={{ user: mockUser, loading: false }}>
          {component}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Property Publication Flow', () => {
  it('completes full property publication flow', async () => {
    renderWithProviders(<PropertyPublicationForm />);

    // Fill basic information
    fireEvent.change(screen.getByLabelText(/título/i), {
      target: { value: 'Casa en Las Condes' }
    });
    
    fireEvent.change(screen.getByLabelText(/precio/i), {
      target: { value: '150000000' }
    });

    // Select property type
    fireEvent.click(screen.getByLabelText(/casa/i));

    // Fill address
    fireEvent.change(screen.getByLabelText(/calle/i), {
      target: { value: 'Apoquindo' }
    });

    fireEvent.change(screen.getByLabelText(/número/i), {
      target: { value: '1234' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /publicar propiedad/i }));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/propiedad publicada exitosamente/i)).toBeInTheDocument();
    });
  });
});
```

#### **4. E2E Tests - Cypress**
```typescript
// cypress/e2e/property-management.cy.ts
describe('Property Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('owner@example.com', 'password123');
  });

  it('creates, edits and deletes a property', () => {
    // Create property
    cy.visit('/properties/create');
    
    cy.get('[data-testid="property-title"]').type('Test Property');
    cy.get('[data-testid="property-price"]').type('100000000');
    cy.get('[data-testid="property-type-casa"]').check();
    cy.get('[data-testid="address-street"]').type('Test Street');
    cy.get('[data-testid="address-number"]').type('123');
    
    cy.get('[data-testid="submit-button"]').click();
    
    cy.url().should('include', '/properties/');
    cy.contains('Property created successfully').should('be.visible');
    
    // Edit property
    cy.get('[data-testid="edit-property"]').click();
    cy.get('[data-testid="property-title"]').clear().type('Updated Property');
    cy.get('[data-testid="submit-button"]').click();
    
    cy.contains('Property updated successfully').should('be.visible');
    cy.contains('Updated Property').should('be.visible');
    
    // Delete property
    cy.get('[data-testid="delete-property"]').click();
    cy.get('[data-testid="confirm-delete"]').click();
    
    cy.contains('Property deleted successfully').should('be.visible');
  });

  it('handles property image upload', () => {
    cy.visit('/properties/create');
    
    // Fill basic info
    cy.fillPropertyForm({
      title: 'Property with Images',
      price: '120000000',
      type: 'departamento'
    });
    
    // Upload image
    cy.get('input[type="file"]').selectFile('cypress/fixtures/property.jpg');
    
    cy.get('[data-testid="upload-progress"]').should('be.visible');
    cy.get('[data-testid="upload-success"]').should('be.visible');
    
    cy.get('[data-testid="submit-button"]').click();
    
    cy.contains('Property created successfully').should('be.visible');
  });
});
```

### **Test Coverage y Quality Gates**

#### **Coverage Requirements**
```json
// package.json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      },
      "src/components/": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      },
      "src/hooks/": {
        "branches": 85,
        "functions": 85,
        "lines": 85,
        "statements": 85
      }
    }
  }
}
```

#### **Quality Gates Script**
```typescript
// scripts/quality-gates.ts
import { execSync } from 'child_process';
import chalk from 'chalk';

interface QualityCheck {
  name: string;
  command: string;
  required: boolean;
}

const checks: QualityCheck[] = [
  { name: 'TypeScript', command: 'npm run type-check', required: true },
  { name: 'ESLint', command: 'npm run lint:ts', required: true },
  { name: 'Prettier', command: 'npm run format:check', required: true },
  { name: 'Unit Tests', command: 'npm run test:unit', required: true },
  { name: 'Coverage', command: 'npm run test:coverage', required: true },
  { name: 'Build', command: 'npm run build', required: true },
  { name: 'E2E Tests', command: 'npm run test:e2e', required: false }
];

const runQualityGates = async () => {
  console.log(chalk.blue('🔍 Running Quality Gates...\n'));
  
  let passed = 0;
  let failed = 0;
  
  for (const check of checks) {
    try {
      console.log(chalk.yellow(`⏳ Running ${check.name}...`));
      execSync(check.command, { stdio: 'inherit' });
      console.log(chalk.green(`✅ ${check.name} passed\n`));
      passed++;
    } catch (error) {
      console.log(chalk.red(`❌ ${check.name} failed\n`));
      failed++;
      
      if (check.required) {
        console.log(chalk.red('💥 Required check failed. Aborting.'));
        process.exit(1);
      }
    }
  }
  
  console.log(chalk.blue('📊 Quality Gates Summary:'));
  console.log(chalk.green(`✅ Passed: ${passed}`));
  console.log(chalk.red(`❌ Failed: ${failed}`));
  
  if (failed === 0) {
    console.log(chalk.green('🎉 All quality gates passed!'));
  } else {
    console.log(chalk.yellow('⚠️  Some optional checks failed.'));
  }
};

runQualityGates().catch(console.error);
```

---

## 🔄 **Flujo de Trabajo (Git Flow)**

### **Branching Strategy**

#### **Tipos de Ramas**
```bash
# Feature branches
git checkout -b feature/property-search-filters
git checkout -b feature/user-authentication
git checkout -b feature/property-favorites

# Bug fixes
git checkout -b bugfix/property-form-validation
git checkout -b bugfix/image-upload-error

# Hot fixes (críticos en producción)
git checkout -b hotfix/security-vulnerability
git checkout -b hotfix/payment-processing-error

# Release branches
git checkout -b release/v1.2.0
```

#### **Workflow Completo**
```bash
# 1. Sincronizar con upstream
git checkout develop
git pull upstream develop
git push origin develop

# 2. Crear rama de feature
git checkout -b feature/property-notifications
git push -u origin feature/property-notifications

# 3. Desarrollar con commits frecuentes
git add .
git commit -m "feat: add notification system base structure"
git push

# 4. Mantener actualizada la rama
git checkout develop
git pull upstream develop
git checkout feature/property-notifications
git rebase develop

# 5. Crear Pull Request
# - Via GitHub interface
# - Completar template de PR
# - Asignar reviewers

# 6. Después de aprobación
git checkout develop
git pull upstream develop
git branch -d feature/property-notifications
```

### **Conventional Commits**

#### **Formato Estándar**
```bash
# Formato: <type>[optional scope]: <description>
# [optional body]
# [optional footer]

# Ejemplos:
git commit -m "feat(auth): add user registration with email verification"
git commit -m "fix(property-form): resolve validation error on price input"
git commit -m "docs: update README with deployment instructions"
git commit -m "style(header): improve responsive design for mobile"
git commit -m "refactor(hooks): extract common logic to useApiCall hook"
git commit -m "test(property-card): add unit tests for favorite functionality"
git commit -m "chore(deps): update react-router-dom to v6.8.0"

# Breaking changes:
git commit -m "feat(api)!: change property status enum values

BREAKING CHANGE: Property status 'active' renamed to 'available'.
Migration script provided in docs/migrations/v2.0.0.md"
```

#### **Tipos de Commits**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (espacios, comas, etc.)
- `refactor`: Refactoring de código
- `perf`: Mejoras de performance
- `test`: Agregar o modificar tests
- `build`: Cambios en build system
- `ci`: Cambios en CI configuration
- `chore`: Mantenimiento general
- `revert`: Revertir commit anterior

### **Pull Request Templates**

#### **.github/pull_request_template.md**
```markdown
## 📋 Descripción

Breve descripción de los cambios realizados.

## 🎯 Tipo de Cambio

- [ ] 🐛 Bug fix (cambio que corrige un issue)
- [ ] ✨ Nueva funcionalidad (cambio que añade funcionalidad)
- [ ] 💥 Breaking change (fix o feature que causa que funcionalidad existente no funcione como se esperaba)
- [ ] 📝 Documentación (cambios solo en documentación)
- [ ] 🎨 Styling (cambios que no afectan el significado del código)
- [ ] ♻️ Refactoring (cambio de código que no es bug fix ni añade funcionalidad)
- [ ] ⚡ Performance (cambio que mejora performance)
- [ ] 🧪 Tests (añadir tests faltantes o corregir tests existentes)

## 🧪 Testing

- [ ] Unit tests añadidos/actualizados
- [ ] Integration tests añadidos/actualizados
- [ ] E2E tests añadidos/actualizados
- [ ] Manual testing completado

## 📱 Screenshots (si aplica)

<!-- Agregar screenshots de cambios UI -->

## ✅ Checklist

- [ ] Mi código sigue las convenciones del proyecto
- [ ] He realizado self-review de mi código
- [ ] He comentado mi código donde necesario
- [ ] He actualizado la documentación correspondiente
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban mi fix/feature
- [ ] Tests nuevos y existentes pasan localmente
- [ ] Cambios dependientes han sido merged

## 🔗 Issues Relacionados

Closes #123
Fixes #456
Related to #789

## 📝 Notas Adicionales

<!-- Información adicional para los reviewers -->
```

---

## 📖 **Documentación**

### **Estándares de Documentación**

#### **JSDoc para Funciones**
```typescript
/**
 * Fetches property data from the database with optional filtering
 * 
 * @param filters - Object containing search filters
 * @param filters.listingType - Type of listing (venta/arriendo)
 * @param filters.priceRange - Price range [min, max]
 * @param filters.location - Location filter
 * @param pagination - Pagination options
 * @param pagination.page - Page number (1-based)
 * @param pagination.limit - Number of items per page
 * 
 * @returns Promise that resolves to property search results
 * 
 * @throws {ValidationError} When filters are invalid
 * @throws {DatabaseError} When database query fails
 * 
 * @example
 * ```typescript
 * const results = await fetchProperties(
 *   { listingType: 'venta', priceRange: [50000000, 150000000] },
 *   { page: 1, limit: 20 }
 * );
 * ```
 */
export const fetchProperties = async (
  filters: PropertyFilters,
  pagination: PaginationOptions
): Promise<PropertySearchResult> => {
  // Implementation
};
```

#### **README por Módulo**
```markdown
<!-- src/components/forms/README.md -->
# Form Components

Componentes reutilizables para formularios de la aplicación.

## Componentes Disponibles

### PropertyForm
Formulario principal para crear/editar propiedades.

**Props:**
- `initialData?: PropertyFormData` - Datos iniciales
- `onSubmit: (data: PropertyFormData) => Promise<void>` - Handler de submit
- `onCancel?: () => void` - Handler de cancelación

**Ejemplo:**
```tsx
<PropertyForm
  initialData={property}
  onSubmit={handleSubmit}
  onCancel={() => navigate(-1)}
/>
```

### UserProfileForm
Formulario para editar perfil de usuario.

**Validaciones:**
- RUT chileno válido
- Email único
- Teléfono formato chileno

## Hooks Relacionados

- `usePropertyForm()` - Lógica de formulario de propiedades
- `useFormValidation()` - Validaciones genéricas

## Estilos

Todos los formularios usan las clases CSS definidas en `@/styles/forms.css`.
```

### **Documentación de APIs**

#### **API Documentation Template**
```typescript
// src/lib/api/properties.ts

/**
 * @fileoverview Property API functions
 * @author Your Name
 * @version 1.0.0
 */

import { supabase } from '@/lib/supabase';
import type { Property, PropertyFilters, CreatePropertyData } from '@/lib/types';

/**
 * Properties API client
 * 
 * Provides methods to interact with property data in the database.
 * All methods handle authentication and row-level security automatically.
 */
export class PropertiesAPI {
  /**
   * Creates a new property listing
   * 
   * @param data - Property data to create
   * @returns Promise resolving to created property
   * 
   * @example
   * ```typescript
   * const property = await PropertiesAPI.create({
   *   title: 'Casa en Las Condes',
   *   price: 150000000,
   *   listing_type: 'venta'
   * });
   * ```
   */
  static async create(data: CreatePropertyData): Promise<Property> {
    // Implementation with proper error handling
  }

  /**
   * Retrieves properties with optional filtering
   * 
   * @param filters - Search and filter criteria
   * @returns Promise resolving to filtered properties
   */
  static async search(filters: PropertyFilters): Promise<Property[]> {
    // Implementation
  }
}
```

### **Changelog y Releases**

#### **CHANGELOG.md**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Property search filters
- User favorite properties

### Changed
- Improved property card responsive design

### Fixed
- Property form validation issues

## [1.2.0] - 2024-03-15

### Added
- Property image upload functionality
- User authentication with Supabase
- Property listing creation and editing
- Application system for rental properties

### Changed
- Updated to React 18
- Migrated to Tailwind CSS v3

### Fixed
- Fixed property creation bug with addresses
- Resolved mobile responsive issues

### Security
- Implemented row-level security policies
- Added input validation and sanitization

## [1.1.0] - 2024-02-28

### Added
- Basic property marketplace
- User profiles
- Search functionality

## [1.0.0] - 2024-02-01

### Added
- Initial project setup
- Basic routing with React Router
- Supabase integration
- Authentication system
```

---

## 🐛 **Reportar Issues**

### **Issue Templates**

#### **Bug Report Template**
```markdown
---
name: 🐛 Bug Report
about: Reportar un bug o error
title: '[BUG] '
labels: bug
assignees: ''
---

## 🐛 Descripción del Bug

Descripción clara y concisa del bug.

## 🔄 Pasos para Reproducir

1. Ve a '...'
2. Haz click en '....'
3. Scroll down hasta '....'
4. Ve el error

## ✅ Comportamiento Esperado

Descripción clara de lo que esperabas que pasara.

## ❌ Comportamiento Actual

Descripción de lo que está pasando en realidad.

## 📱 Screenshots

Si aplica, añade screenshots para ayudar a explicar el problema.

## 🖥️ Información del Entorno

- OS: [e.g. Windows 10, macOS 13.2]
- Browser: [e.g. Chrome 110, Safari 16.3]
- Versión de la App: [e.g. 1.2.0]
- Device: [e.g. iPhone 14, Desktop]

## 📝 Contexto Adicional

Cualquier otra información relevante sobre el problema.

## 🔍 Console Logs

```
Pega aquí cualquier error de consola relevante
```

## ✅ Definición de Terminado

- [ ] Bug reproducido y confirmado
- [ ] Causa raíz identificada
- [ ] Fix implementado
- [ ] Tests añadidos para prevenir regresión
- [ ] Documentación actualizada si es necesario
```

#### **Feature Request Template**
```markdown
---
name: ✨ Feature Request
about: Sugerir una nueva funcionalidad
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## 🎯 Resumen de la Funcionalidad

Descripción breve y clara de la funcionalidad solicitada.

## 💡 Motivación

Explica por qué esta funcionalidad sería útil y qué problema resuelve.

## 📋 Descripción Detallada

Describe en detalle cómo debería funcionar esta nueva funcionalidad.

## 🎨 Mockups/Wireframes

Si tienes ideas visuales, añade imágenes o describe la interfaz esperada.

## ✅ Criterios de Aceptación

- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

## 🔄 Alternativas Consideradas

Describe cualquier alternativa que hayas considerado.

## 📊 Prioridad

- [ ] Crítica (bloquea funcionalidad existente)
- [ ] Alta (mejora significativa para usuarios)
- [ ] Media (nice to have)
- [ ] Baja (cuando haya tiempo)

## 🎯 Audiencia Objetivo

¿Quiénes se beneficiarían de esta funcionalidad?

- [ ] Todos los usuarios
- [ ] Propietarios
- [ ] Inquilinos/Compradores
- [ ] Administradores

## 📝 Notas Técnicas

Cualquier consideración técnica especial.
```

### **Triaging Guidelines**

#### **Labels Sistema**
```yaml
# Priority
- name: "priority: critical"
  color: "d73a4a"
  description: "Blocks core functionality"

- name: "priority: high"
  color: "ff9500"
  description: "Important but not blocking"

- name: "priority: medium"
  color: "fbca04"
  description: "Moderate importance"

- name: "priority: low"
  color: "0e8a16"
  description: "Nice to have"

# Type
- name: "type: bug"
  color: "d73a4a"
  description: "Something isn't working"

- name: "type: feature"
  color: "a2eeef"
  description: "New feature or request"

- name: "type: docs"
  color: "0075ca"
  description: "Documentation improvements"

- name: "type: refactor"
  color: "d4c5f9"
  description: "Code refactoring"

# Status
- name: "status: needs-triage"
  color: "ededed"
  description: "Needs initial review"

- name: "status: accepted"
  color: "c2e0c6"
  description: "Ready for implementation"

- name: "status: blocked"
  color: "b60205"
  description: "Blocked by external dependency"

- name: "status: wontfix"
  color: "ffffff"
  description: "Won't be implemented"
```

---

## ✅ **Code Review**

### **Review Guidelines**

#### **Como Revisor**
```markdown
## 📋 Code Review Checklist

### 🎯 Funcionalidad
- [ ] El código hace lo que dice hacer
- [ ] Los cambios cumplen con los requisitos
- [ ] Los edge cases están manejados
- [ ] No hay regresiones evidentes

### 🏗️ Arquitectura y Diseño
- [ ] El código sigue los patrones establecidos
- [ ] La separación de responsabilidades es clara
- [ ] No hay duplicación innecesaria
- [ ] Las abstracciones son apropiadas

### 🔒 Seguridad
- [ ] No hay vulnerabilidades evidentes
- [ ] Los inputs son validados apropiadamente
- [ ] Los datos sensibles no están expuestos
- [ ] La autenticación/autorización es correcta

### ⚡ Performance
- [ ] No hay problemas de performance obvios
- [ ] Las queries de BD son eficientes
- [ ] Los re-renders innecesarios están evitados
- [ ] La carga de assets está optimizada

### 🧪 Testing
- [ ] Los tests cubren los casos importantes
- [ ] Los tests son claros y mantenibles
- [ ] No hay tests frágiles o redundantes
- [ ] La cobertura es apropiada

### 📖 Legibilidad
- [ ] El código es claro y auto-documentado
- [ ] Los nombres de variables/funciones son descriptivos
- [ ] Los comentarios añaden valor
- [ ] La complejidad es apropiada

### 🎨 Estilo
- [ ] Sigue las convenciones del proyecto
- [ ] El formato es consistente
- [ ] No hay warnings de linting
- [ ] Los imports están organizados
```

#### **Feedback Constructivo**
```markdown
## ✅ Ejemplos de Buen Feedback

### Sugerir mejoras específicas:
```
❌ "Este código está mal"
✅ "Considera extraer esta lógica a un hook personalizado para reutilización:

```typescript
const usePropertyValidation = (property: Property) => {
  // lógica extraída aquí
}
```

### Explicar el "por qué":
```
❌ "Cambia esto"
✅ "Considera usar useMemo aquí porque este cálculo se ejecuta en cada render y puede ser costoso cuando hay muchas propiedades"
```

### Hacer preguntas para entender:
```
❌ "Esto está incorrecto"
✅ "¿Puedes explicar por qué elegiste este enfoque? Me pregunto si podríamos usar X para simplificar la lógica"
```

### Reconocer lo bueno:
```
✅ "Excelente manejo de errores aquí. Me gusta cómo proporcionas feedback específico al usuario"
✅ "Buena abstracción, esto hará que sea fácil añadir más tipos de validación en el futuro"
```
```

### **Automated Review Tools**

#### **GitHub Actions - PR Checks**
```yaml
# .github/workflows/pr-checks.yml
name: PR Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
        
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Lint check
      run: npm run lint
      
    - name: Type check
      run: npm run type-check
      
    - name: Format check
      run: npm run format:check
      
    - name: Unit tests
      run: npm run test:unit
      
    - name: Build check
      run: npm run build
      
    - name: Size check
      uses: andresz1/size-limit-action@v1
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        
  security-check:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Security audit
      run: npm audit --audit-level high
      
    - name: Dependency check
      uses: actions/dependency-review-action@v3
```

---

## 🎯 **Tipos de Contribuciones**

### **Niveles de Contribución**

#### **🟢 Beginner Friendly**
- Correcciones de typos en documentación
- Añadir tests unitarios simples
- Mejoras de estilo CSS/Tailwind
- Traducciones y textos
- Reportar bugs con reproducción clara

**Issues sugeridos:**
- `good-first-issue`
- `documentation`
- `help-wanted`

#### **🟡 Intermediate**
- Implementar componentes UI nuevos
- Optimizaciones de performance
- Refactoring de código existente
- Integración con APIs externas
- Mejoras de UX/UI

**Skills necesarios:**
- React/TypeScript intermedio
- Conocimiento de Tailwind CSS
- Experiencia con testing

#### **🔴 Advanced**
- Arquitectura de nuevas features
- Optimizaciones de base de datos
- Configuración de CI/CD
- Seguridad y RLS policies
- Performance a gran escala

**Skills necesarios:**
- React/TypeScript avanzado
- PostgreSQL/Supabase
- DevOps y deployment
- Security best practices

### **Roadmap de Contribuciones**

#### **Q1 2024 - Core Features**
- [ ] Sistema de notificaciones push
- [ ] Chat en tiempo real entre usuarios
- [ ] Sistema de calificaciones y reviews
- [ ] Integración con mapas (Google Maps)
- [ ] Panel de analytics para propietarios

#### **Q2 2024 - Advanced Features**
- [ ] Sistema de tours virtuales
- [ ] Integración con plataformas de pago
- [ ] App móvil con React Native
- [ ] Sistema de recomendaciones ML
- [ ] API pública para integraciones

#### **Q3 2024 - Scale & Performance**
- [ ] Optimización de rendimiento
- [ ] CDN para imágenes
- [ ] Search engine optimization
- [ ] Multi-language support
- [ ] Advanced filtering and search

### **Recognition System**

#### **Contribuidor Levels**
```markdown
🥉 **Bronze Contributor**
- 1-5 PRs merged
- Badge en perfil de GitHub
- Mención en README

🥈 **Silver Contributor**  
- 6-15 PRs merged
- Acceso a beta features
- Invitación a planning meetings

🥇 **Gold Contributor**
- 16+ PRs merged
- Co-maintainer privileges
- Credit en releases

💎 **Core Contributor**
- Contributor constante
- Design decision influence
- Mentorship de nuevos contributors
```

---

## 📚 **Documentación Relacionada**

### **🏗️ Arquitectura y Desarrollo**
- 🏗️ **[README-ARQUITECTURA.md](README-ARQUITECTURA.md)** - Arquitectura del sistema y base de datos
- 💻 **[README-DESARROLLO.md](README-DESARROLLO.md)** - Ejemplos prácticos y mejores prácticas
- 📖 **[README-API.md](README-API.md)** - APIs, webhooks y Edge Functions

### **🛠️ Configuración y Seguridad**
- 🚀 **[README-INSTALACION.md](README-INSTALACION.md)** - Instalación y configuración inicial
- 🔐 **[README-SEGURIDAD.md](README-SEGURIDAD.md)** - Seguridad, RLS y autenticación
- 🗄️ **[README-MIGRACIONES.md](README-MIGRACIONES.md)** - Migraciones y fixes de base de datos

### **🚀 Producción y Debugging**
- 🚀 **[README-DESPLIEGUE.md](README-DESPLIEGUE.md)** - Despliegue y producción
- 🐛 **[README-DEBUGGING.md](README-DEBUGGING.md)** - Debugging y troubleshooting

---

**🎉 ¡Gracias por contribuir a la plataforma inmobiliaria!**

**📧 Para preguntas específicas:** [crear issue](https://github.com/tu-repo/issues/new)

**💬 Para discusiones:** [GitHub Discussions](https://github.com/tu-repo/discussions)

**✅ Con estas guías de contribución, puedes participar activamente en el desarrollo de la plataforma.**
