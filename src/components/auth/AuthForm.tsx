import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { isValidEmail, VALIDATION_RULES, ERROR_MESSAGES } from '../../lib/supabase';
import CustomButton from '../common/CustomButton';

interface AuthFormProps {
  onSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const { user, loading, error, signIn, signUp, signOut, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
  });

  // Limpiar mensajes cuando cambie el modo
  useEffect(() => {
    setMessage(null);
    clearError();
  }, [isLogin, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      return ERROR_MESSAGES.REQUIRED_FIELD('Email');
    }

    // Usar validación de email consistente
    if (!isValidEmail(formData.email)) {
      return ERROR_MESSAGES.INVALID_EMAIL;
    }

    if (!formData.password.trim()) {
      return ERROR_MESSAGES.REQUIRED_FIELD('Contraseña');
    }

    if (!isLogin) {
      if (!formData.firstName.trim()) {
        return ERROR_MESSAGES.REQUIRED_FIELD('Nombre');
      }
      if (formData.firstName.trim().length < 2) {
        return 'El nombre debe tener al menos 2 caracteres';
      }
      if (formData.password !== formData.confirmPassword) {
        return ERROR_MESSAGES.PASSWORDS_DONT_MATCH;
      }
      if (formData.password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
        return ERROR_MESSAGES.PASSWORD_TOO_SHORT(VALIDATION_RULES.PASSWORD_MIN_LENGTH);
      }
      if (formData.password.length > VALIDATION_RULES.PASSWORD_MAX_LENGTH) {
        return ERROR_MESSAGES.PASSWORD_TOO_LONG(VALIDATION_RULES.PASSWORD_MAX_LENGTH);
      }
    } else {
      // Validaciones adicionales para login
      if (formData.password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
        return ERROR_MESSAGES.PASSWORD_TOO_SHORT(VALIDATION_RULES.PASSWORD_MIN_LENGTH);
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const validationError = validateForm();
    if (validationError) {
      return; // El error será mostrado por el hook useAuth
    }

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (!error) {
          setMessage('¡Inicio de sesión exitoso!');
          onSuccess?.();
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, {
          first_name: formData.firstName
        });
        if (!error) {
          setMessage('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
        }
      }
    } catch (err) {
      // El error será manejado por el hook useAuth
      console.error('Auth error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (!error) {
        setMessage('Sesión cerrada exitosamente');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg" role="main" aria-labelledby="auth-title">
      <h2 id="auth-title" className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
      </h2>

      {error && (
        <div
          className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
          role="alert"
          aria-live="polite"
        >
          {error.message}
        </div>
      )}

      {message && (
        <div
          className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded"
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Tu nombre"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            minLength={6}
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Contraseña *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>
        )}

        <CustomButton
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          loadingText="Procesando..."
          className="w-full"
        >
          {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
        </CustomButton>
      </form>

      <div className="mt-6 text-center">
        <CustomButton
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsLogin(!isLogin);
            setFormData({
              email: '',
              password: '',
              confirmPassword: '',
              firstName: '',
            });
          }}
        >
          {isLogin
            ? '¿No tienes cuenta? Regístrate aquí'
            : '¿Ya tienes cuenta? Inicia sesión aquí'
          }
        </CustomButton>
      </div>

      {user && (
        <div className="mt-4 text-center">
          <CustomButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleLogout}
          >
            Cerrar Sesión
          </CustomButton>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
