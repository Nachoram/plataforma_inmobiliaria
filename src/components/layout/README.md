# Layout System

This directory contains the layout components for the PROPAI real estate platform. The layout system provides contextual layouts for different areas of the application.

## Components

### Layout Components

- **AuthLayout**: Centered layout for authentication pages (login, register)
- **MarketplaceLayout**: Layout for public marketplace with search and filters
- **AdminLayout**: Admin panel layout with sidebar navigation and breadcrumbs
- **ApplicantLayout**: Applicant area layout with simplified sidebar
- **MainLayout**: Generic, configurable layout component

### Shared Components

- **Header**: Navigation header with user menu, search, and filters
- **Footer**: Site footer with links and company information
- **Sidebar**: Collapsible sidebar navigation for admin and applicant areas

## Usage

### AuthLayout

```tsx
import { AuthLayout } from '@/components/layout';

function LoginPage() {
  return (
    <AuthLayout title="Iniciar Sesión" subtitle="Accede a tu cuenta">
      <LoginForm />
    </AuthLayout>
  );
}
```

### MarketplaceLayout

```tsx
import { MarketplaceLayout } from '@/components/layout';

function PropertiesPage() {
  return (
    <MarketplaceLayout
      onSearchChange={handleSearch}
      filtersContent={<FiltersPanel />}
    >
      <PropertyGrid />
    </MarketplaceLayout>
  );
}
```

### AdminLayout

```tsx
import { AdminLayout } from '@/components/layout';

function AdminDashboard() {
  return (
    <AdminLayout
      title="Dashboard Administrativo"
      breadcrumbs={[
        { label: 'Inicio', path: '/admin' },
        { label: 'Dashboard' }
      ]}
    >
      <DashboardContent />
    </AdminLayout>
  );
}
```

### MainLayout (Generic)

```tsx
import { MainLayout } from '@/components/layout';

function CustomPage() {
  return (
    <MainLayout
      headerVariant="marketplace"
      showSearch={true}
      showSidebar={true}
      sidebarVariant="admin"
      maxWidth="max-w-6xl"
    >
      <CustomContent />
    </MainLayout>
  );
}
```

## Features

- **Responsive Design**: All layouts work on desktop and mobile
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Dark Mode Ready**: Prepared for future dark mode implementation
- **Toast Notifications**: Built-in notification areas
- **TypeScript**: Fully typed components and props

## Testing

Run the layout tests:

```bash
npm test src/components/layout/tests/
```

## File Structure

```
src/components/layout/
├── AuthLayout.tsx           # Authentication layout
├── MarketplaceLayout.tsx    # Public marketplace layout
├── AdminLayout.tsx          # Admin panel layout
├── ApplicantLayout.tsx      # Applicant area layout
├── MainLayout.tsx           # Generic configurable layout
├── Header.tsx               # Navigation header component
├── Footer.tsx               # Site footer component
├── Sidebar.tsx              # Sidebar navigation component
├── index.ts                 # Exports all components
├── README.md                # This documentation
└── tests/                   # Test files
    ├── Header.test.tsx
    ├── Sidebar.test.tsx
    ├── AuthLayout.test.tsx
    ├── MarketplaceLayout.test.tsx
    ├── AdminLayout.test.tsx
    ├── ApplicantLayout.test.tsx
    └── MainLayout.test.tsx
```




