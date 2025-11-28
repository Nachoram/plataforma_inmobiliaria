/**
 * PostulationMessagesTab.lazy.tsx
 *
 * Lazy-loaded version of PostulationMessagesTab
 */

import React, { lazy } from 'react';

// Lazy load the actual component
const PostulationMessagesTab = lazy(() => import('../PostulationMessagesTab'));

// Loading component for this tab
const PostulationMessagesTabSkeleton = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>

    {/* Messages list skeleton */}
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                i % 2 === 0 ? 'bg-gray-200' : 'bg-blue-200'
              }`}>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-20"></div>
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message input skeleton */}
      <div className="border-t border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="h-10 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-10 w-20 bg-blue-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Quick actions skeleton */}
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Export both the lazy component and skeleton
export { PostulationMessagesTab, PostulationMessagesTabSkeleton };
export default PostulationMessagesTab;



