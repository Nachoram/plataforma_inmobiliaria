import React from 'react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-4xl font-bold mb-8">Mi Perfil</h1>
      <div className="bg-gray-100 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Información Personal</h3>
        <div className="space-y-2">
          <p><strong>Nombre:</strong> Usuario</p>
          <p><strong>Email:</strong> usuario@email.com</p>
          <p><strong>Teléfono:</strong> +56 9 1234 5678</p>
        </div>
      </div>
    </div>
  );
};
