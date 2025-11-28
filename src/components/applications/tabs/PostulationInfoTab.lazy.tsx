/**
 * PostulationInfoTab.lazy.tsx
 *
 * Lazy-loaded version of PostulationInfoTab
 */

import React, { lazy } from 'react';

// Lazy load the actual component
const PostulationInfoTab = lazy(() => import('../PostulationInfoTab'));

// Loading component for this tab
const PostulationInfoTabSkeleton = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>

    {/* Contract card skeleton */}
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>

    {/* Actions skeleton */}
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Export both the lazy component and skeleton
export { PostulationInfoTab, PostulationInfoTabSkeleton };
export default PostulationInfoTab;


