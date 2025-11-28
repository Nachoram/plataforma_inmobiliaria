/**
 * LazyTab.tsx
 *
 * Component that handles lazy loading of tab content with proper error boundaries
 * and loading states.
 */

import React, { Suspense, ComponentType, ReactNode } from 'react';
import { PostulationErrorBoundary } from '../../common/misc/PostulationErrorBoundary';

interface LazyTabProps {
  children: ReactNode;
  fallback: ReactNode;
  errorBoundaryKey?: string;
  postulationId?: string;
}

/**
 * LazyTab wrapper component that provides:
 * - Suspense boundary for lazy loading
 * - Error boundary for tab-specific errors
 * - Loading fallback UI
 */
export const LazyTab: React.FC<LazyTabProps> = ({
  children,
  fallback,
  errorBoundaryKey,
  postulationId
}) => {
  return (
    <PostulationErrorBoundary
      postulationId={postulationId}
      errorBoundaryKey={errorBoundaryKey}
      fallback={
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">
              Error al cargar la pestaña
            </div>
            <div className="text-red-500 text-sm">
              Ha ocurrido un error al cargar el contenido de esta pestaña.
              Intenta recargar la página.
            </div>
          </div>
        </div>
      }
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </PostulationErrorBoundary>
  );
};

interface LazyTabFactoryProps {
  tabComponent: ComponentType<any>;
  skeletonComponent: ComponentType<any>;
  props?: Record<string, any>;
  postulationId?: string;
  tabKey: string;
}

/**
 * Factory function to create lazy-loaded tab components
 */
export const createLazyTab = ({
  tabComponent: TabComponent,
  skeletonComponent: SkeletonComponent,
  props = {},
  postulationId,
  tabKey
}: LazyTabFactoryProps) => {
  return (
    <LazyTab
      fallback={<SkeletonComponent />}
      errorBoundaryKey={tabKey}
      postulationId={postulationId}
    >
      <TabComponent {...props} />
    </LazyTab>
  );
};


