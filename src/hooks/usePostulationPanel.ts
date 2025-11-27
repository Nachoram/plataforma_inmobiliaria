/**
 * usePostulationPanel.ts
 *
 * Custom hook that manages the complex state of the PostulationAdminPanel
 * using useReducer for better state management and performance.
 */

import { useReducer, useCallback, useMemo } from 'react';

// Types for the panel state
export type TabType = 'info' | 'documents' | 'messages';

export interface PostulationPanelState {
  // Navigation state
  activeTab: TabType;
  navigationHistory: TabType[];

  // UI state
  isFullscreen: boolean;
  showBackToTop: boolean;

  // Loading states
  tabLoadingStates: Record<TabType, boolean>;
  globalLoading: boolean;

  // Error states
  tabErrors: Record<TabType, string | null>;
  globalError: string | null;

  // Interaction states
  lastInteraction: {
    type: 'tab_change' | 'action_click' | 'modal_open' | 'modal_close';
    timestamp: number;
    details?: any;
  } | null;

  // Performance tracking
  renderCount: number;
  lastRenderTime: number;
}

// Action types for the reducer
export type PostulationPanelAction =
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_TAB_LOADING'; payload: { tab: TabType; loading: boolean } }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_TAB_ERROR'; payload: { tab: TabType; error: string | null } }
  | { type: 'SET_GLOBAL_ERROR'; payload: string | null }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'SET_BACK_TO_TOP_VISIBLE'; payload: boolean }
  | { type: 'RECORD_INTERACTION'; payload: PostulationPanelState['lastInteraction'] }
  | { type: 'INCREMENT_RENDER_COUNT'; payload: number }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: PostulationPanelState = {
  activeTab: 'info',
  navigationHistory: ['info'],
  isFullscreen: false,
  showBackToTop: false,
  tabLoadingStates: {
    info: false,
    documents: false,
    messages: false
  },
  globalLoading: false,
  tabErrors: {
    info: null,
    documents: null,
    messages: null
  },
  globalError: null,
  lastInteraction: null,
  renderCount: 0,
  lastRenderTime: Date.now()
};

// Reducer function
function postulationPanelReducer(
  state: PostulationPanelState,
  action: PostulationPanelAction
): PostulationPanelState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
        navigationHistory: [...state.navigationHistory.slice(-4), action.payload], // Keep last 5 tabs
        lastInteraction: {
          type: 'tab_change',
          timestamp: Date.now(),
          details: { from: state.activeTab, to: action.payload }
        }
      };

    case 'SET_TAB_LOADING':
      return {
        ...state,
        tabLoadingStates: {
          ...state.tabLoadingStates,
          [action.payload.tab]: action.payload.loading
        }
      };

    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        globalLoading: action.payload
      };

    case 'SET_TAB_ERROR':
      return {
        ...state,
        tabErrors: {
          ...state.tabErrors,
          [action.payload.tab]: action.payload.error
        }
      };

    case 'SET_GLOBAL_ERROR':
      return {
        ...state,
        globalError: action.payload
      };

    case 'TOGGLE_FULLSCREEN':
      return {
        ...state,
        isFullscreen: !state.isFullscreen,
        lastInteraction: {
          type: 'action_click',
          timestamp: Date.now(),
          details: { action: 'toggle_fullscreen', newState: !state.isFullscreen }
        }
      };

    case 'SET_BACK_TO_TOP_VISIBLE':
      return {
        ...state,
        showBackToTop: action.payload
      };

    case 'RECORD_INTERACTION':
      return {
        ...state,
        lastInteraction: action.payload
      };

    case 'INCREMENT_RENDER_COUNT':
      return {
        ...state,
        renderCount: state.renderCount + 1,
        lastRenderTime: action.payload
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        tabErrors: {
          info: null,
          documents: null,
          messages: null
        },
        globalError: null
      };

    case 'RESET_STATE':
      return {
        ...initialState,
        renderCount: state.renderCount // Preserve render count for debugging
      };

    default:
      return state;
  }
}

// Custom hook
export const usePostulationPanel = (initialTab: TabType = 'info') => {
  const [state, dispatch] = useReducer(postulationPanelReducer, {
    ...initialState,
    activeTab: initialTab,
    navigationHistory: [initialTab]
  });

  // Memoized computed values
  const computedValues = useMemo(() => ({
    hasAnyTabError: Object.values(state.tabErrors).some(error => error !== null),
    hasAnyTabLoading: Object.values(state.tabLoadingStates).some(loading => loading),
    isAnyLoading: state.globalLoading || Object.values(state.tabLoadingStates).some(loading => loading),
    currentTabError: state.tabErrors[state.activeTab],
    currentTabLoading: state.tabLoadingStates[state.activeTab],
    canGoBack: state.navigationHistory.length > 1,
    previousTab: state.navigationHistory[state.navigationHistory.length - 2] || null
  }), [state]);

  // Action creators
  const actions = useMemo(() => ({
    setActiveTab: (tab: TabType) => {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    },

    goToPreviousTab: () => {
      if (computedValues.canGoBack) {
        const previousTab = computedValues.previousTab;
        if (previousTab) {
          dispatch({ type: 'SET_ACTIVE_TAB', payload: previousTab });
        }
      }
    },

    setTabLoading: (tab: TabType, loading: boolean) => {
      dispatch({ type: 'SET_TAB_LOADING', payload: { tab, loading } });
    },

    setGlobalLoading: (loading: boolean) => {
      dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading });
    },

    setTabError: (tab: TabType, error: string | null) => {
      dispatch({ type: 'SET_TAB_ERROR', payload: { tab, error } });
    },

    setGlobalError: (error: string | null) => {
      dispatch({ type: 'SET_GLOBAL_ERROR', payload: error });
    },

    toggleFullscreen: () => {
      dispatch({ type: 'TOGGLE_FULLSCREEN' });
    },

    setBackToTopVisible: (visible: boolean) => {
      dispatch({ type: 'SET_BACK_TO_TOP_VISIBLE', payload: visible });
    },

    recordInteraction: (interaction: PostulationPanelState['lastInteraction']) => {
      dispatch({ type: 'RECORD_INTERACTION', payload: interaction });
    },

    incrementRenderCount: () => {
      dispatch({ type: 'INCREMENT_RENDER_COUNT', payload: Date.now() });
    },

    clearErrors: () => {
      dispatch({ type: 'CLEAR_ERRORS' });
    },

    resetState: () => {
      dispatch({ type: 'RESET_STATE' });
    }
  }), [computedValues.canGoBack, computedValues.previousTab]);

  // Performance tracking
  const trackRender = useCallback(() => {
    actions.incrementRenderCount();
  }, [actions]);

  // Tab navigation helpers
  const tabNavigation = useMemo(() => ({
    goToInfo: () => actions.setActiveTab('info'),
    goToDocuments: () => actions.setActiveTab('documents'),
    goToMessages: () => actions.setActiveTab('messages'),
    goToPrevious: actions.goToPreviousTab
  }), [actions]);

  // Error handling helpers
  const errorHandling = useMemo(() => ({
    clearTabError: (tab: TabType) => actions.setTabError(tab, null),
    clearAllErrors: actions.clearErrors,
    hasTabError: (tab: TabType) => state.tabErrors[tab] !== null,
    getTabError: (tab: TabType) => state.tabErrors[tab]
  }), [actions, state.tabErrors]);

  // Loading helpers
  const loadingHelpers = useMemo(() => ({
    setTabLoadingState: (tab: TabType, loading: boolean) => actions.setTabLoading(tab, loading),
    isTabLoading: (tab: TabType) => state.tabLoadingStates[tab],
    startTabLoading: (tab: TabType) => actions.setTabLoading(tab, true),
    stopTabLoading: (tab: TabType) => actions.setTabLoading(tab, false)
  }), [actions, state.tabLoadingStates]);

  return {
    // State
    state,

    // Computed values
    ...computedValues,

    // Actions
    ...actions,

    // Organized helpers
    tabs: tabNavigation,
    errors: errorHandling,
    loading: loadingHelpers,

    // Performance tracking
    trackRender,

    // Raw dispatch for advanced use cases
    dispatch
  };
};
