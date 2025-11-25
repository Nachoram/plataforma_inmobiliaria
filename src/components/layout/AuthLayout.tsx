import React from 'react';
import { Link } from 'react-router-dom';
import { Footer } from './Footer';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title = "Bienvenido a PROPAI",
  subtitle = "Tu plataforma inmobiliaria de confianza"
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Logo */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="flex items-center space-x-2 group">
            <img
              src="/propai-logo.svg"
              alt="PROPAI Logo"
              className="h-48 w-auto drop-shadow-lg"
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Title Section */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            <p className="text-gray-600">
              {subtitle}
            </p>
          </div>

          {/* Auth Form Container */}
          <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
            {children}
          </div>

          {/* Footer Links */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <Link
                to="/terms"
                className="hover:text-blue-600 transition-colors"
              >
                Términos de Servicio
              </Link>
              <span>•</span>
              <Link
                to="/privacy"
                className="hover:text-blue-600 transition-colors"
              >
                Política de Privacidad
              </Link>
            </div>
            <div className="text-xs text-gray-400">
              ¿Necesitas ayuda?{' '}
              <Link
                to="/contact"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contáctanos
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer variant="auth" />
    </div>
  );
};







