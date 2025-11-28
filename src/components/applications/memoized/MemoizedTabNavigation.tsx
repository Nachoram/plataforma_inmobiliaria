/**
 * MemoizedTabNavigation.tsx
 *
 * Memoized tab navigation component with performance optimizations
 */

import React, { memo, useMemo } from 'react';
import { FileText, Paperclip, MessageSquare } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  count?: number;
}

interface MemoizedTabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

// Default tabs configuration
const DEFAULT_TABS: TabItem[] = [
  { id: 'info', label: 'Información y Acciones', icon: FileText },
  { id: 'documents', label: 'Documentos', icon: Paperclip },
  { id: 'messages', label: 'Mensajes', icon: MessageSquare }
];

// Individual tab component - memoized for performance
const TabButton = memo<{
  tab: TabItem;
  isActive: boolean;
  onClick: () => void;
}>(({ tab, isActive, onClick }) => {
  const tabClasses = useMemo(() =>
    `flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
      isActive
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`,
    [isActive]
  );

  const iconClasses = useMemo(() =>
    `w-4 h-4 mr-2 ${isActive ? 'text-blue-600' : 'text-gray-400'}`,
    [isActive]
  );

  return (
    <button
      onClick={onClick}
      className={tabClasses}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.id}`}
      id={`tab-${tab.id}`}
    >
      <tab.icon className={iconClasses} aria-hidden="true" />
      {tab.label}
      {tab.count && tab.count > 0 && (
        <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-600 font-medium">
          {tab.count}
        </span>
      )}
    </button>
  );
});

TabButton.displayName = 'TabButton';

// Main memoized tab navigation component
export const MemoizedTabNavigation = memo<MemoizedTabNavigationProps>(({
  tabs = DEFAULT_TABS,
  activeTab,
  onTabChange,
  className = ''
}) => {
  // Memoize tabs with current state
  const tabsWithState = useMemo(() =>
    tabs.map(tab => ({
      ...tab,
      isActive: tab.id === activeTab,
      onClick: () => onTabChange(tab.id)
    })),
    [tabs, activeTab, onTabChange]
  );

  const containerClasses = useMemo(() =>
    `flex space-x-8 overflow-x-auto ${className}`,
    [className]
  );

  return (
    <div className={containerClasses} role="tablist" aria-label="Panel de administración de postulación">
      {tabsWithState.map(tabData => (
        <TabButton
          key={tabData.id}
          tab={tabData}
          isActive={tabData.isActive}
          onClick={tabData.onClick}
        />
      ))}
    </div>
  );
});

MemoizedTabNavigation.displayName = 'MemoizedTabNavigation';

// Hook for using memoized tab navigation
export const useMemoizedTabNavigation = (
  tabs: TabItem[] = DEFAULT_TABS,
  initialActiveTab = 'info'
) => {
  const [activeTab, setActiveTab] = React.useState(initialActiveTab);

  const navigationProps = useMemo(() => ({
    tabs,
    activeTab,
    onTabChange: setActiveTab
  }), [tabs, activeTab]);

  const navigationHelpers = useMemo(() => ({
    setActiveTab,
    goToInfo: () => setActiveTab('info'),
    goToDocuments: () => setActiveTab('documents'),
    goToMessages: () => setActiveTab('messages'),
    isActive: (tabId: string) => activeTab === tabId
  }), [activeTab]);

  return {
    activeTab,
    navigationProps,
    ...navigationHelpers
  };
};


