/**
 * useTabNavigation.test.ts
 *
 * Tests para el hook useTabNavigation (Fase 2)
 */

import { renderHook, act } from '@testing-library/react';
import { useTabNavigation } from '../useTabNavigation';

describe('useTabNavigation', () => {
  const mockTabs = [
    { id: 'info', label: 'Información', icon: () => <span>📄</span> },
    { id: 'documents', label: 'Documentos', icon: () => <span>📎</span>, count: 3 },
    { id: 'messages', label: 'Mensajes', icon: () => <span>💬</span>, disabled: true }
  ];

  describe('Initialization', () => {
    it('should initialize with first tab as active', () => {
      const { result } = renderHook(() => useTabNavigation({ tabs: mockTabs }));

      expect(result.current.activeTab).toBe('info');
      expect(result.current.activeTabIndex).toBe(0);
      expect(result.current.previousTab).toBe(null);
    });

    it('should initialize with specified initial tab', () => {
      const { result } = renderHook(() =>
        useTabNavigation({ tabs: mockTabs, initialTab: 'documents' })
      );

      expect(result.current.activeTab).toBe('documents');
      expect(result.current.activeTabIndex).toBe(1);
    });
  });

  describe('Tab Navigation', () => {
    it('should change active tab', () => {
      const { result } = renderHook(() => useTabNavigation({ tabs: mockTabs }));

      act(() => {
        result.current.setActiveTab('documents');
      });

      expect(result.current.activeTab).toBe('documents');
      expect(result.current.previousTab).toBe('info');
      expect(result.current.activeTabIndex).toBe(1);
    });

    it('should not change to disabled tab', () => {
      const { result } = renderHook(() => useTabNavigation({ tabs: mockTabs }));

      act(() => {
        result.current.setActiveTab('messages');
      });

      expect(result.current.activeTab).toBe('info'); // Should remain unchanged
      expect(result.current.isTabDisabled('messages')).toBe(true);
    });

    it('should navigate to next and previous tabs', () => {
      const { result } = renderHook(() => useTabNavigation({ tabs: mockTabs }));

      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrevious).toBe(false);

      act(() => {
        result.current.goToNextTab();
      });

      expect(result.current.activeTab).toBe('documents');
      expect(result.current.canGoNext).toBe(false); // messages is disabled
      expect(result.current.canGoPrevious).toBe(true);

      act(() => {
        result.current.goToPreviousTab();
      });

      expect(result.current.activeTab).toBe('info');
    });

    it('should navigate to first and last enabled tabs', () => {
      const { result } = renderHook(() => useTabNavigation({
        tabs: mockTabs,
        initialTab: 'documents'
      }));

      act(() => {
        result.current.goToLastTab();
      });

      expect(result.current.activeTab).toBe('documents'); // messages is disabled

      act(() => {
        result.current.goToFirstTab();
      });

      expect(result.current.activeTab).toBe('info');
    });
  });

  describe('Tab Queries', () => {
    it('should provide tab information', () => {
      const { result } = renderHook(() => useTabNavigation({ tabs: mockTabs }));

      expect(result.current.getTabById('documents')).toEqual(mockTabs[1]);
      expect(result.current.isTabActive('info')).toBe(true);
      expect(result.current.isTabActive('documents')).toBe(false);
      expect(result.current.isTabDisabled('messages')).toBe(true);
      expect(result.current.enabledTabs).toHaveLength(2);
      expect(result.current.visibleTabs).toEqual(result.current.enabledTabs);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle arrow key navigation', () => {
      const mockOnTabChange = jest.fn();
      const { result } = renderHook(() =>
        useTabNavigation({ tabs: mockTabs, onTabChange: mockOnTabChange })
      );

      // ArrowRight
      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: jest.fn()
        } as any);
      });

      expect(result.current.activeTab).toBe('documents');
      expect(mockOnTabChange).toHaveBeenCalledWith('documents', 'info');

      // ArrowLeft
      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowLeft',
          preventDefault: jest.fn()
        } as any);
      });

      expect(result.current.activeTab).toBe('info');
    });

    it('should handle Home and End keys', () => {
      const { result } = renderHook(() => useTabNavigation({
        tabs: mockTabs,
        initialTab: 'documents'
      }));

      act(() => {
        result.current.handleKeyDown({
          key: 'Home',
          preventDefault: jest.fn()
        } as any);
      });

      expect(result.current.activeTab).toBe('info');

      act(() => {
        result.current.handleKeyDown({
          key: 'End',
          preventDefault: jest.fn()
        } as any);
      });

      expect(result.current.activeTab).toBe('documents');
    });

    it('should ignore keyboard navigation when disabled', () => {
      const { result } = renderHook(() =>
        useTabNavigation({ tabs: mockTabs, enableKeyboardNavigation: false })
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: jest.fn()
        } as any);
      });

      expect(result.current.activeTab).toBe('info'); // Should not change
    });
  });

  describe('History Management', () => {
    it('should maintain navigation history', () => {
      const { result } = renderHook(() =>
        useTabNavigation({ tabs: mockTabs, enableHistory: true })
      );

      act(() => {
        result.current.setActiveTab('documents');
      });

      expect(result.current.previousTab).toBe('info');
    });

    it('should not maintain history when disabled', () => {
      const { result } = renderHook(() =>
        useTabNavigation({ tabs: mockTabs, enableHistory: false })
      );

      act(() => {
        result.current.setActiveTab('documents');
      });

      // History should still work for previousTab
      expect(result.current.previousTab).toBe('info');
    });
  });

  describe('Tab Updates', () => {
    it('should handle tab array changes', () => {
      const { result, rerender } = renderHook(
        ({ tabs }) => useTabNavigation({ tabs }),
        { initialProps: { tabs: mockTabs } }
      );

      const newTabs = [
        ...mockTabs,
        { id: 'settings', label: 'Configuración', icon: () => <span>⚙️</span> }
      ];

      rerender({ tabs: newTabs });

      expect(result.current.tabs).toHaveLength(4);
      expect(result.current.getTabById('settings')).toBeDefined();
    });

    it('should reset to first enabled tab when active tab becomes invalid', () => {
      const { result, rerender } = renderHook(
        ({ tabs }) => useTabNavigation({ tabs }),
        { initialProps: { tabs: mockTabs } }
      );

      // Change to documents tab
      act(() => {
        result.current.setActiveTab('documents');
      });

      expect(result.current.activeTab).toBe('documents');

      // Remove documents tab
      const newTabs = mockTabs.filter(tab => tab.id !== 'documents');
      rerender({ tabs: newTabs });

      expect(result.current.activeTab).toBe('info'); // Should reset to first tab
    });
  });

  describe('Callbacks', () => {
    it('should call onTabChange callback', () => {
      const mockOnTabChange = jest.fn();
      const { result } = renderHook(() =>
        useTabNavigation({ tabs: mockTabs, onTabChange: mockOnTabChange })
      );

      act(() => {
        result.current.setActiveTab('documents');
      });

      expect(mockOnTabChange).toHaveBeenCalledWith('documents', 'info');
    });
  });
});
