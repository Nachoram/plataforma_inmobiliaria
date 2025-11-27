/**
 * useTabNavigation.ts
 *
 * Hook for managing tab navigation with keyboard support, accessibility,
 * and performance optimizations.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  count?: number;
  disabled?: boolean;
  badge?: string;
}

export interface UseTabNavigationOptions {
  initialTab?: string;
  tabs: TabItem[];
  onTabChange?: (tabId: string, previousTab?: string) => void;
  enableKeyboardNavigation?: boolean;
  enableHistory?: boolean;
  persistState?: boolean;
  storageKey?: string;
}

export interface UseTabNavigationReturn {
  activeTab: string;
  previousTab: string | null;
  tabs: TabItem[];
  tabRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;

  // Actions
  setActiveTab: (tabId: string) => void;
  goToNextTab: () => void;
  goToPreviousTab: () => void;
  goToFirstTab: () => void;
  goToLastTab: () => void;

  // Computed values
  activeTabIndex: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  enabledTabs: TabItem[];
  visibleTabs: TabItem[];

  // Keyboard handlers
  handleKeyDown: (event: React.KeyboardEvent) => void;

  // Utility functions
  getTabById: (id: string) => TabItem | undefined;
  isTabActive: (id: string) => boolean;
  isTabDisabled: (id: string) => boolean;
  focusTab: (index: number) => void;
}

const TAB_NAVIGATION_KEYS = {
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  ENTER: 'Enter',
  SPACE: ' '
} as const;

export const useTabNavigation = ({
  initialTab,
  tabs,
  onTabChange,
  enableKeyboardNavigation = true,
  enableHistory = true,
  persistState = false,
  storageKey = 'tab-navigation-state'
}: UseTabNavigationOptions): UseTabNavigationReturn => {
  // Initialize active tab
  const getInitialActiveTab = useCallback(() => {
    if (persistState && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (tabs.some(tab => tab.id === parsed.activeTab)) {
            return parsed.activeTab;
          }
        }
      } catch (error) {
        console.warn('Failed to load tab state from localStorage:', error);
      }
    }

    return initialTab || tabs[0]?.id || '';
  }, [initialTab, tabs, persistState, storageKey]);

  const [activeTab, setActiveTabState] = useState<string>(getInitialActiveTab);
  const [previousTab, setPreviousTab] = useState<string | null>(null);
  const [tabHistory, setTabHistory] = useState<string[]>([getInitialActiveTab()]);

  // Refs for keyboard navigation
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Persist state when it changes
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          activeTab,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to save tab state to localStorage:', error);
      }
    }
  }, [activeTab, persistState, storageKey]);

  // Update tab refs array when tabs change
  useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, tabs.length);
  }, [tabs.length]);

  // Computed values
  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const enabledTabs = tabs.filter(tab => !tab.disabled);
  const visibleTabs = enabledTabs; // Could be extended for filtering logic

  const canGoNext = activeTabIndex < enabledTabs.length - 1;
  const canGoPrevious = activeTabIndex > 0;

  // Actions
  const setActiveTab = useCallback((tabId: string) => {
    const targetTab = tabs.find(tab => tab.id === tabId);
    if (!targetTab || targetTab.disabled) return;

    if (tabId !== activeTab) {
      setPreviousTab(activeTab);

      if (enableHistory) {
        setTabHistory(prev => [...prev.slice(-9), tabId]); // Keep last 10
      }

      setActiveTabState(tabId);
      onTabChange?.(tabId, activeTab);
    }
  }, [activeTab, tabs, onTabChange, enableHistory]);

  const goToNextTab = useCallback(() => {
    if (canGoNext) {
      const nextTab = enabledTabs[activeTabIndex + 1];
      setActiveTab(nextTab.id);
    }
  }, [canGoNext, enabledTabs, activeTabIndex, setActiveTab]);

  const goToPreviousTab = useCallback(() => {
    if (canGoPrevious) {
      const prevTab = enabledTabs[activeTabIndex - 1];
      setActiveTab(prevTab.id);
    }
  }, [canGoPrevious, enabledTabs, activeTabIndex, setActiveTab]);

  const goToFirstTab = useCallback(() => {
    if (enabledTabs.length > 0) {
      setActiveTab(enabledTabs[0].id);
    }
  }, [enabledTabs, setActiveTab]);

  const goToLastTab = useCallback(() => {
    if (enabledTabs.length > 0) {
      setActiveTab(enabledTabs[enabledTabs.length - 1].id);
    }
  }, [enabledTabs, setActiveTab]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;

    switch (event.key) {
      case TAB_NAVIGATION_KEYS.ARROW_LEFT:
        event.preventDefault();
        goToPreviousTab();
        break;

      case TAB_NAVIGATION_KEYS.ARROW_RIGHT:
        event.preventDefault();
        goToNextTab();
        break;

      case TAB_NAVIGATION_KEYS.HOME:
        event.preventDefault();
        goToFirstTab();
        break;

      case TAB_NAVIGATION_KEYS.END:
        event.preventDefault();
        goToLastTab();
        break;

      case TAB_NAVIGATION_KEYS.ENTER:
      case TAB_NAVIGATION_KEYS.SPACE:
        // Focus is already on the tab, Enter/Space would activate it
        // This is handled by the button's onClick
        break;
    }
  }, [enableKeyboardNavigation, goToPreviousTab, goToNextTab, goToFirstTab, goToLastTab]);

  // Utility functions
  const getTabById = useCallback((id: string) => {
    return tabs.find(tab => tab.id === id);
  }, [tabs]);

  const isTabActive = useCallback((id: string) => {
    return activeTab === id;
  }, [activeTab]);

  const isTabDisabled = useCallback((id: string) => {
    const tab = getTabById(id);
    return tab?.disabled || false;
  }, [getTabById]);

  const focusTab = useCallback((index: number) => {
    if (tabRefs.current[index]) {
      tabRefs.current[index]?.focus();
    }
  }, []);

  // Handle tab changes when tabs array changes
  useEffect(() => {
    if (!tabs.some(tab => tab.id === activeTab)) {
      const firstEnabledTab = enabledTabs[0];
      if (firstEnabledTab) {
        setActiveTab(firstEnabledTab.id);
      }
    }
  }, [tabs, activeTab, enabledTabs, setActiveTab]);

  return {
    activeTab,
    previousTab,
    tabs,
    tabRefs,

    // Actions
    setActiveTab,
    goToNextTab,
    goToPreviousTab,
    goToFirstTab,
    goToLastTab,

    // Computed values
    activeTabIndex,
    canGoNext,
    canGoPrevious,
    enabledTabs,
    visibleTabs,

    // Keyboard handlers
    handleKeyDown,

    // Utility functions
    getTabById,
    isTabActive,
    isTabDisabled,
    focusTab
  };
};
