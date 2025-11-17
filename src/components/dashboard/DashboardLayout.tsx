import React from 'react';
import { AdminLayout } from '../layout/AdminLayout';

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{
    label: string;
    path?: string;
  }>;
  title?: string;
  subtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  breadcrumbs,
  title,
  subtitle
}) => {
  return (
    <AdminLayout
      breadcrumbs={breadcrumbs}
      title={title}
      subtitle={subtitle}
    >
      {children}
    </AdminLayout>
  );
};

export default DashboardLayout;
