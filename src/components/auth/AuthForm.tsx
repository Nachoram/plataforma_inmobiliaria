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
    <div className="max-w-md mx-auto padding-mobile bg-white rounded-xl shadow-soft mobile-card" role="main" aria-labelledby="auth-title">
      <h2 id="auth-title" className="text-xl xs:text-2xl font-bold text-gray-800 mb-4 xs:mb-6 text-center">
        {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
      </h2>

      {error && (
        <div
          className="mb-4 p-3 xs:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-mobile-sm"
          role="alert"
          aria-live="polite"
        >
          {error.message}
        </div>
      )}

      {message && (
        <div
          className="mb-4 p-3 xs:p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-mobile-sm"
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-mobile" noValidate>
        <div>
          <label className="block text-mobile-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mobile-input w-full"
            required
            autoComplete="email"
            inputMode="email"
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-mobile-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="mobile-input w-full"
              required
              placeholder="Tu nombre"
              autoComplete="given-name"
              inputMode="text"
            />
          </div>
        )}

        <div>
          <label className="block text-mobile-sm font-medium text-gray-700 mb-2">
            Contraseña *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="mobile-input w-full"
            required
            minLength={6}
            autoComplete={isLogin ? "current-password" : "new-password"}
            inputMode="text"
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-mobile-sm font-medium text-gray-700 mb-2">
              Confirmar Contraseña *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="mobile-input w-full"
              required
              minLength={6}
              autoComplete="new-password"
              inputMode="text"
            />
          </div>
        )}

        <CustomButton
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          loadingText="Procesando..."
          className="w-full mt-6"
        >
          {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
        </CustomButton>
      </form>

      <div className="mt-4 xs:mt-6 text-center">
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
          className="w-full"
        >
          {isLogin
            ? '¿No tienes cuenta? Regístrate'
            : '¿Ya tienes cuenta? Inicia sesión'
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
            className="w-full"
          >
            Cerrar Sesión
          </CustomButton>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
