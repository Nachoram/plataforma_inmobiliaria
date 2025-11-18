import React from 'react';

export const MarketplacePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-4xl font-bold mb-8">Marketplace</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Lista de propiedades */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Propiedad Destacada</h3>
          <p className="text-gray-600">Dirección: Calle Principal 123</p>
          <p className="text-gray-600">Precio: $300,000</p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
            Ver Detalles
          </button>
        </div>
      </div>
    </div>
  );
};
