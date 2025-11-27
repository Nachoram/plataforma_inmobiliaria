/**
 * useModalManager.ts
 *
 * Hook for managing multiple modals, overlays, and dialog states
 * with proper z-index management, focus trapping, and accessibility.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface ModalConfig {
  id: string;
  isOpen: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  closable?: boolean;
  backdrop?: 'none' | 'blur' | 'dark';
  animation?: 'fade' | 'slide' | 'scale' | 'bounce';
  preventScroll?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onEscape?: () => void;
}

export interface ModalState {
  modals: Record<string, ModalConfig>;
  activeModal: string | null;
  modalStack: string[];
  isAnyModalOpen: boolean;
}

export interface UseModalManagerReturn {
  // State
  modals: Record<string, ModalConfig>;
  activeModal: string | null;
  modalStack: string[];
  isAnyModalOpen: boolean;

  // Modal actions
  openModal: (id: string, config?: Partial<ModalConfig>) => void;
  closeModal: (id: string) => void;
  closeActiveModal: () => void;
  closeAllModals: () => void;
  toggleModal: (id: string, config?: Partial<ModalConfig>) => void;

  // Modal queries
  isModalOpen: (id: string) => boolean;
  getModalConfig: (id: string) => ModalConfig | undefined;
  getActiveModalConfig: () => ModalConfig | undefined;

  // Stack management
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  // Keyboard handling
  handleKeyDown: (event: KeyboardEvent) => void;

  // Focus management
  focusModal: (id: string) => void;
  returnFocus: () => void;
}

// Default modal configuration
const defaultModalConfig: Omit<ModalConfig, 'id'> = {
  isOpen: false,
  size: 'md',
  position: 'center',
  closable: true,
  backdrop: 'dark',
  animation: 'fade',
  preventScroll: true,
  trapFocus: true,
  restoreFocus: true
};

// Z-index management
let globalZIndex = 1000;
const getNextZIndex = () => ++globalZIndex;

export const useModalManager = (): UseModalManagerReturn => {
  const [modalState, setModalState] = useState<ModalState>({
    modals: {},
    activeModal: null,
    modalStack: [],
    isAnyModalOpen: false
  });

  // Refs for focus management
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const modalRefs = useRef<Record<string, HTMLElement | null>>({});

  // Update derived state
  const derivedState = {
    isAnyModalOpen: Object.values(modalState.modals).some(modal => modal.isOpen),
    activeModal: modalState.modalStack[modalState.modalStack.length - 1] || null
  };

  // Modal actions
  const openModal = useCallback((id: string, config: Partial<ModalConfig> = {}) => {
    setModalState(prevState => {
      const existingModal = prevState.modals[id];
      const newConfig: ModalConfig = {
        ...defaultModalConfig,
        ...existingModal,
        ...config,
        id,
        isOpen: true
      };

      // Add to stack if not already there
      const newStack = prevState.modalStack.includes(id)
        ? prevState.modalStack
        : [...prevState.modalStack, id];

      return {
        modals: {
          ...prevState.modals,
          [id]: newConfig
        },
        modalStack: newStack,
        activeModal: id,
        isAnyModalOpen: true
      };
    });

    // Call onOpen callback
    config.onOpen?.();
  }, []);

  const closeModal = useCallback((id: string) => {
    setModalState(prevState => {
      const modal = prevState.modals[id];
      if (!modal || !modal.isOpen) return prevState;

      const newModals = {
        ...prevState.modals,
        [id]: { ...modal, isOpen: false }
      };

      // Remove from stack
      const newStack = prevState.modalStack.filter(modalId => modalId !== id);
      const newActiveModal = newStack[newStack.length - 1] || null;

      return {
        modals: newModals,
        modalStack: newStack,
        activeModal: newActiveModal,
        isAnyModalOpen: newStack.length > 0
      };
    });

    // Call onClose callback
    modalState.modals[id]?.onClose?.();
  }, [modalState.modals]);

  const closeActiveModal = useCallback(() => {
    if (derivedState.activeModal) {
      closeModal(derivedState.activeModal);
    }
  }, [derivedState.activeModal, closeModal]);

  const closeAllModals = useCallback(() => {
    setModalState(prevState => ({
      modals: Object.keys(prevState.modals).reduce((acc, id) => ({
        ...acc,
        [id]: { ...prevState.modals[id], isOpen: false }
      }), {}),
      modalStack: [],
      activeModal: null,
      isAnyModalOpen: false
    }));

    // Call onClose for all open modals
    Object.values(modalState.modals)
      .filter(modal => modal.isOpen)
      .forEach(modal => modal.onClose?.());
  }, [modalState.modals]);

  const toggleModal = useCallback((id: string, config: Partial<ModalConfig> = {}) => {
    const isCurrentlyOpen = modalState.modals[id]?.isOpen;
    if (isCurrentlyOpen) {
      closeModal(id);
    } else {
      openModal(id, config);
    }
  }, [modalState.modals, closeModal, openModal]);

  // Modal queries
  const isModalOpen = useCallback((id: string) => {
    return modalState.modals[id]?.isOpen || false;
  }, [modalState.modals]);

  const getModalConfig = useCallback((id: string) => {
    return modalState.modals[id];
  }, [modalState.modals]);

  const getActiveModalConfig = useCallback(() => {
    return derivedState.activeModal ? modalState.modals[derivedState.activeModal] : undefined;
  }, [derivedState.activeModal, modalState.modals]);

  // Stack management
  const bringToFront = useCallback((id: string) => {
    setModalState(prevState => {
      if (!prevState.modalStack.includes(id)) return prevState;

      const newStack = [...prevState.modalStack.filter(modalId => modalId !== id), id];
      return {
        ...prevState,
        modalStack: newStack,
        activeModal: id
      };
    });
  }, []);

  const sendToBack = useCallback((id: string) => {
    setModalState(prevState => {
      if (!prevState.modalStack.includes(id)) return prevState;

      const newStack = [id, ...prevState.modalStack.filter(modalId => modalId !== id)];
      return {
        ...prevState,
        modalStack: newStack,
        activeModal: newStack[newStack.length - 1] || null
      };
    });
  }, []);

  // Focus management
  const focusModal = useCallback((id: string) => {
    const modalElement = modalRefs.current[id];
    if (modalElement) {
      // Store current focused element
      lastFocusedElementRef.current = document.activeElement as HTMLElement;

      // Focus the modal
      modalElement.focus();

      // If modal has focusable elements, focus the first one
      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, []);

  const returnFocus = useCallback(() => {
    if (lastFocusedElementRef.current && document.contains(lastFocusedElementRef.current)) {
      lastFocusedElementRef.current.focus();
    }
  }, []);

  // Keyboard handling
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const activeConfig = getActiveModalConfig();

    if (!activeConfig) return;

    switch (event.key) {
      case 'Escape':
        if (activeConfig.closable) {
          event.preventDefault();
          activeConfig.onEscape?.();
          closeActiveModal();
        }
        break;

      case 'Tab':
        // Handle focus trapping if enabled
        if (activeConfig.trapFocus) {
          const modalElement = modalRefs.current[activeConfig.id];
          if (modalElement) {
            const focusableElements = modalElement.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (event.shiftKey) {
              // Shift + Tab
              if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
              }
            } else {
              // Tab
              if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
              }
            }
          }
        }
        break;
    }
  }, [getActiveModalConfig, closeActiveModal]);

  // Effects
  useEffect(() => {
    if (derivedState.isAnyModalOpen) {
      // Store last focused element
      if (!lastFocusedElementRef.current) {
        lastFocusedElementRef.current = document.activeElement as HTMLElement;
      }

      // Prevent body scroll if needed
      const activeConfig = getActiveModalConfig();
      if (activeConfig?.preventScroll) {
        document.body.style.overflow = 'hidden';
      }

      // Focus active modal
      if (derivedState.activeModal) {
        setTimeout(() => focusModal(derivedState.activeModal!), 100);
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = '';

      // Return focus
      returnFocus();
      lastFocusedElementRef.current = null;
    }
  }, [derivedState.isAnyModalOpen, derivedState.activeModal, getActiveModalConfig, focusModal, returnFocus]);

  // Global keyboard listener
  useEffect(() => {
    if (derivedState.isAnyModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [derivedState.isAnyModalOpen, handleKeyDown]);

  // Register modal ref
  const registerModalRef = useCallback((id: string, element: HTMLElement | null) => {
    modalRefs.current[id] = element;
  }, []);

  return {
    // State
    modals: modalState.modals,
    activeModal: derivedState.activeModal,
    modalStack: modalState.modalStack,
    isAnyModalOpen: derivedState.isAnyModalOpen,

    // Modal actions
    openModal,
    closeModal,
    closeActiveModal,
    closeAllModals,
    toggleModal,

    // Modal queries
    isModalOpen,
    getModalConfig,
    getActiveModalConfig,

    // Stack management
    bringToFront,
    sendToBack,

    // Keyboard handling
    handleKeyDown,

    // Focus management
    focusModal,
    returnFocus,

    // Additional utilities
    registerModalRef
  } as UseModalManagerReturn & { registerModalRef: (id: string, element: HTMLElement | null) => void };
};
