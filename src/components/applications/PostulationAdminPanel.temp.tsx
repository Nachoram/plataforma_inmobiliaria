/**
 * PostulationAdminPanel.tsx - TEMP VERSION
 */

import React from 'react';
import { useParams } from 'react-router-dom';

export const PostulationAdminPanel: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            PostulationAdminPanel - TEMP
          </h1>
          <p>Application ID: {id}</p>
        </div>
      </div>
    </div>
  );
};

