import React from 'react';

export const PortfolioPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-4xl font-bold mb-8">Mi Portafolio</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Contenido del portafolio */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Propiedad 1</h3>
          <p className="text-gray-600">Descripción de la propiedad...</p>
        </div>
      </div>
    </div>
  );
};
