/**
 * LazyTab.test.tsx
 *
 * Tests para el componente LazyTab (Fase 2)
 */

import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { LazyTab, createLazyTab } from '../LazyTab';

// Mock de PostulationErrorBoundary
jest.mock('../../../common/misc/PostulationErrorBoundary', () => ({
  PostulationErrorBoundary: ({ children }: any) => <div>{children}</div>
}));

describe('LazyTab', () => {
  const MockComponent = ({ text }: { text: string }) => <div>{text}</div>;
  const MockSkeleton = () => <div>Loading...</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LazyTab Component', () => {
    it('should render children with Suspense and ErrorBoundary', () => {
      render(
        <LazyTab
          fallback={<MockSkeleton />}
          errorBoundaryKey="test"
          postulationId="test-postulation"
        >
          <MockComponent text="Content" />
        </LazyTab>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should show fallback during lazy loading', async () => {
      const LazyComponent = React.lazy(() =>
        new Promise(resolve => setTimeout(() => resolve({ default: MockComponent }), 100))
      );

      render(
        <LazyTab fallback={<MockSkeleton />}>
          <LazyComponent text="Lazy Content" />
        </LazyTab>
      );

      // Should show skeleton initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Should show content after loading
      await waitFor(() => {
        expect(screen.getByText('Lazy Content')).toBeInTheDocument();
      });
    });
  });

  describe('createLazyTab Factory', () => {
    it('should create lazy tab with correct props', () => {
      const LazyComponent = React.lazy(() => Promise.resolve({ default: MockComponent }));

      const lazyTab = createLazyTab({
        tabComponent: LazyComponent,
        skeletonComponent: MockSkeleton,
        props: { text: 'Test Content' },
        postulationId: 'test-postulation',
        tabKey: 'test-tab'
      });

      render(lazyTab);

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should handle lazy loading with createLazyTab', async () => {
      const LazyComponent = React.lazy(() =>
        new Promise(resolve => setTimeout(() => resolve({ default: MockComponent }), 100))
      );

      const lazyTab = createLazyTab({
        tabComponent: LazyComponent,
        skeletonComponent: MockSkeleton,
        props: { text: 'Lazy Test Content' },
        tabKey: 'lazy-tab'
      });

      render(lazyTab);

      // Should show skeleton initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Should show content after loading
      await waitFor(() => {
        expect(screen.getByText('Lazy Test Content')).toBeInTheDocument();
      });
    });

    it('should pass props correctly to lazy component', () => {
      const LazyComponent = React.lazy(() => Promise.resolve({ default: MockComponent }));

      const testProps = {
        text: 'Props Test',
        numberProp: 42,
        booleanProp: true
      };

      const lazyTab = createLazyTab({
        tabComponent: LazyComponent,
        skeletonComponent: MockSkeleton,
        props: testProps,
        tabKey: 'props-tab'
      });

      render(lazyTab);

      expect(screen.getByText('Props Test')).toBeInTheDocument();
    });

    it('should handle empty props', () => {
      const LazyComponent = React.lazy(() => Promise.resolve({
        default: () => <div>Empty Props Component</div>
      }));

      const lazyTab = createLazyTab({
        tabComponent: LazyComponent,
        skeletonComponent: MockSkeleton,
        props: {},
        tabKey: 'empty-props-tab'
      });

      render(lazyTab);

      expect(screen.getByText('Empty Props Component')).toBeInTheDocument();
    });

    it('should handle missing props', () => {
      const LazyComponent = React.lazy(() => Promise.resolve({
        default: () => <div>No Props Component</div>
      }));

      const lazyTab = createLazyTab({
        tabComponent: LazyComponent,
        skeletonComponent: MockSkeleton,
        tabKey: 'no-props-tab'
      });

      render(lazyTab);

      expect(screen.getByText('No Props Component')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should render error boundary with correct props', () => {
      const mockErrorBoundary = jest.fn(({ children }) => <div>{children}</div>);
      jest.doMock('../../../common/misc/PostulationErrorBoundary', () => ({
        PostulationErrorBoundary: mockErrorBoundary
      }));

      render(
        <LazyTab
          fallback={<MockSkeleton />}
          errorBoundaryKey="error-test"
          postulationId="error-postulation"
        >
          <MockComponent text="Error Test" />
        </LazyTab>
      );

      expect(mockErrorBoundary).toHaveBeenCalledWith(
        expect.objectContaining({
          postulationId: 'error-postulation',
          errorBoundaryKey: 'error-test'
        }),
        expect.any(Object)
      );
    });
  });

  describe('Suspense Integration', () => {
    it('should integrate properly with React Suspense', () => {
      render(
        <Suspense fallback={<div>Global Loading...</div>}>
          <LazyTab fallback={<MockSkeleton />}>
            <Suspense fallback={<div>Inner Loading...</div>}>
              <MockComponent text="Nested Suspense" />
            </Suspense>
          </LazyTab>
        </Suspense>
      );

      expect(screen.getByText('Nested Suspense')).toBeInTheDocument();
    });
  });
});


