import React from 'react';

export const MyOffersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-4xl font-bold mb-8">Mis Ofertas</h1>
      <div className="space-y-4">
        {/* Lista de ofertas */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Oferta #1</h3>
          <p className="text-gray-600">Monto: $500,000</p>
          <p className="text-gray-600">Estado: En revisión</p>
          <p className="text-gray-600">Fecha: 2024-01-15</p>
        </div>
      </div>
    </div>
  );
};
