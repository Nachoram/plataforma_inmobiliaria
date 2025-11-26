/**
 * PostulationMessagesTab.tsx
 *
 * Componente para futura implementación de sistema de comunicaciones
 * en postulaciones. Actualmente muestra un placeholder.
 *
 * Funcionalidades futuras:
 * - Comunicación entre propietario y postulantes
 * - Historial de mensajes
 * - Notificaciones
 * - Adjuntos en mensajes
 *
 * @since 2025-11-26
 */

import React from 'react';

interface PostulationMessagesTabProps {
  applicationId: string;
}

// ========================================================================
// MAIN COMPONENT
// ========================================================================

export const PostulationMessagesTab: React.FC<PostulationMessagesTabProps> = ({
  applicationId
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sistema de Comunicación
          </h3>

          <p className="text-gray-600 mb-4">
            Próximamente: Comunicación directa con postulantes y avales
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">
                  Funcionalidad en desarrollo
                </h4>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Esta sección permitirá enviar mensajes directos a los postulantes y avales,
                    mantener un historial de comunicaciones y adjuntar documentos a los mensajes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Funcionalidades futuras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Funcionalidades Planificadas
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Mensajes directos con postulantes
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Historial completo de conversaciones
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Adjuntos en mensajes
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Notificaciones automáticas
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Beneficios
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <svg className="h-4 w-4 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Comunicación más eficiente con postulantes
            </li>
            <li className="flex items-start">
              <svg className="h-4 w-4 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Mejor seguimiento de solicitudes de información
            </li>
            <li className="flex items-start">
              <svg className="h-4 w-4 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Historial auditable de todas las comunicaciones
            </li>
            <li className="flex items-start">
              <svg className="h-4 w-4 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Reducción de tiempos de respuesta
            </li>
          </ul>
        </div>
      </div>

      {/* Timeline de desarrollo */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Roadmap de Desarrollo
        </h4>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">1</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Diseño de interfaz de chat</p>
              <p className="text-xs text-gray-500">Implementar UI similar a WhatsApp para comunicaciones</p>
            </div>
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              Planificado
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Sistema de notificaciones</p>
              <p className="text-xs text-gray-500">Email y push notifications para nuevos mensajes</p>
            </div>
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              Planificado
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">3</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Adjuntos en mensajes</p>
              <p className="text-xs text-gray-500">Permitir adjuntar documentos a las conversaciones</p>
            </div>
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              Planificado
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">4</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Integración con WhatsApp</p>
              <p className="text-xs text-gray-500">API de WhatsApp Business para comunicaciones externas</p>
            </div>
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              Futuro
            </span>
          </div>
        </div>
      </div>

      {/* Información de contacto para desarrollo */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="text-center">
          <h4 className="font-semibold text-blue-900 mb-2">¿Interesado en esta funcionalidad?</h4>
          <p className="text-blue-800 text-sm mb-4">
            Esta funcionalidad mejorará significativamente la experiencia de gestión de postulaciones.
            Contacta al equipo de desarrollo para priorizar su implementación.
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Solicitar Desarrollo
          </button>
        </div>
      </div>
    </div>
  );
};
