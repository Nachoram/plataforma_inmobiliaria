import React, { useState } from 'react';

export interface ContactFormData {
  userType: 'corredor' | 'inmobiliaria' | 'inversionista' | 'otro';
  message: string;
  email: string;
}

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => void;
  isLoading?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    userType: 'corredor',
    message: '',
    email: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.email || !formData.message) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    if (formData.message.length < 10) {
      setError('El mensaje debe tener al menos 10 caracteres');
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      setSubmitted(true);
      setError(null);
      
      // Resetear formulario después de 3 segundos
      setTimeout(() => {
        setFormData({
          userType: 'corredor',
          message: '',
          email: ''
        });
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      setError('Hubo un error al enviar el formulario. Por favor intenta nuevamente.');
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">
          ¡Mensaje Enviado!
        </h3>
        <p className="text-green-700">
          Gracias por contactarnos. Te responderemos a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Contáctanos
        </h2>
        <p className="text-gray-600">
          Nos gustaría saber de ti
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Tipo de Usuario */}
        <div>
          <label htmlFor="userType" className="block text-sm font-semibold text-gray-700 mb-2">
            ¿Eres...? <span className="text-red-500">*</span>
          </label>
          <select
            id="userType"
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            required
          >
            <option value="corredor">Corredor Independiente</option>
            <option value="inmobiliaria">Inmobiliaria/Agencia</option>
            <option value="inversionista">Inversionista</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {/* Mensaje */}
        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
            Mensaje <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Cuéntanos tu consulta..."
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-vertical"
            required
            minLength={10}
          />
          <p className="text-sm text-gray-500 mt-1">
            Mínimo 10 caracteres ({formData.message.length}/10)
          </p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            required
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Enviando...
            </span>
          ) : (
            'Enviar'
          )}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;

