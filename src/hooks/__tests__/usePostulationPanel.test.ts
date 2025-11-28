/**
 * usePostulationPanel.test.ts
 *
 * Tests para el hook usePostulationPanel (Fase 2)
 */

import { renderHook, act } from '@testing-library/react';
import { usePostulationPanel } from '../usePostulationPanel';

describe('usePostulationPanel', () => {
  describe('Initial State', () => {
    it('should initialize with default tab', () => {
      const { result } = renderHook(() => usePostulationPanel());

      expect(result.current.state.activeTab).toBe('info');
      expect(result.current.state.renderCount).toBe(0);
      expect(result.current.state.globalLoading).toBe(false);
      expect(result.current.state.isAnyModalOpen).toBe(false);
    });

    it('should initialize with provided initial tab', () => {
      const { result } = renderHook(() => usePostulationPanel('documents'));

      expect(result.current.state.activeTab).toBe('documents');
      expect(result.current.navigationHistory).toContain('documents');
    });
  });

  describe('Tab Management', () => {
    it('should change active tab', () => {
      const { result } = renderHook(() => usePostulationPanel());

      act(() => {
        result.current.setActiveTab('documents');
      });

      expect(result.current.state.activeTab).toBe('documents');
      expect(result.current.previousTab).toBe('info');
    });

    it('should maintain navigation history', () => {
      const { result } = renderHook(() => usePostulationPanel());

      act(() => {
        result.current.setActiveTab('documents');
      });

      act(() => {
        result.current.setActiveTab('messages');
      });

      expect(result.current.state.navigationHistory).toEqual(['info', 'documents', 'messages']);
    });

    it('should handle tab loading states', () => {
      const { result } = renderHook(() => usePostulationPanel());

      act(() => {
        result.current.setTabLoading('documents', true);
      });

      expect(result.current.state.tabLoadingStates.documents).toBe(true);
      expect(result.current.loading.isTabLoading('documents')).toBe(true);
      expect(result.current.computedValues.hasAnyTabLoading).toBe(true);
    });
  });

  describe('Modal Management', () => {
    it('should open and close modals', () => {
      const { result } = renderHook(() => usePostulationPanel());

      act(() => {
        result.current.openModal('contract-modal', { size: 'lg' });
      });

      expect(result.current.state.modals['contract-modal'].isOpen).toBe(true);
      expect(result.current.isAnyModalOpen).toBe(true);

      act(() => {
        result.current.closeModal('contract-modal');
      });

      expect(result.current.state.modals['contract-modal'].isOpen).toBe(false);
      expect(result.current.isAnyModalOpen).toBe(false);
    });

    it('should manage modal stack', () => {
      const { result } = renderHook(() => usePostulationPanel());

      act(() => {
        result.current.openModal('modal-1');
        result.current.openModal('modal-2');
      });

      expect(result.current.activeModal).toBe('modal-2');
      expect(result.current.modalStack).toEqual(['modal-1', 'modal-2']);

      act(() => {
        result.current.closeActiveModal();
      });

      expect(result.current.activeModal).toBe('modal-1');
      expect(result.current.modalStack).toEqual(['modal-1']);
    });
  });

  describe('Error Management', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => usePostulationPanel());

      act(() => {
        result.current.setTabError('documents', 'Network error');
      });

      expect(result.current.state.tabErrors.documents).toBe('Network error');
      expect(result.current.errors.hasTabError('documents')).toBe(true);

      act(() => {
        result.current.errors.clearTabError('documents');
      });

      expect(result.current.state.tabErrors.documents).toBe(null);
    });
  });

  describe('Performance Tracking', () => {
    it('should track render count', () => {
      const { result } = renderHook(() => usePostulationPanel());

      act(() => {
        result.current.incrementRenderCount();
      });

      expect(result.current.state.renderCount).toBe(1);

      act(() => {
        result.current.incrementRenderCount();
      });

      expect(result.current.state.renderCount).toBe(2);
    });

    it('should reset metrics', () => {
      const { result } = renderHook(() => usePostulationPanel());

      act(() => {
        result.current.incrementRenderCount();
        result.current.setGlobalError('Test error');
      });

      expect(result.current.state.renderCount).toBe(1);
      expect(result.current.state.globalError).toBe('Test error');

      act(() => {
        result.current.resetState();
      });

      expect(result.current.state.renderCount).toBe(0);
      expect(result.current.state.globalError).toBe(null);
    });
  });

  describe('Computed Values', () => {
    it('should compute derived state correctly', () => {
      const { result } = renderHook(() => usePostulationPanel());

      act(() => {
        result.current.openModal('test-modal');
        result.current.setTabLoading('info', true);
      });

      expect(result.current.isAnyModalOpen).toBe(true);
      expect(result.current.computedValues.hasAnyTabLoading).toBe(true);
      expect(result.current.computedValues.canGoNext).toBe(true);
      expect(result.current.computedValues.canGoPrevious).toBe(false);
    });
  });

  describe('Actions', () => {
    it('should provide tab navigation actions', () => {
      const { result } = renderHook(() => usePostulationPanel());

      act(() => {
        result.current.tabs.goToDocuments();
      });

      expect(result.current.state.activeTab).toBe('documents');

      act(() => {
        result.current.tabs.goToMessages();
      });

      expect(result.current.state.activeTab).toBe('messages');

      act(() => {
        result.current.tabs.goToPrevious();
      });

      expect(result.current.state.activeTab).toBe('documents');
    });
  });
});


