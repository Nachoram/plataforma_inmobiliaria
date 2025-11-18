import React from 'react';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white p-8 flex items-center justify-center">
      <div className="bg-gray-100 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">Iniciar Sesión</h1>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};
