import React, { useState } from 'react';
import { FileText, CreditCard, X, CheckCircle, AlertCircle } from 'lucide-react';

interface CommercialReportButtonProps {
  propertyId: string;
  propertyAddress: string;
}

export const CommercialReportButton: React.FC<CommercialReportButtonProps> = ({
  propertyId,
  propertyAddress
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Función para realizar la llamada al webhook de n8n
  const requestCommercialReport = async () => {
    setLoading(true);
    setError('');

    try {
      // TODO: Reemplazar con la URL real del webhook de n8n
      const webhookUrl = 'https://your-n8n-instance.com/webhook/commercial-report';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: propertyId
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Éxito: mostrar confirmación y cerrar modal
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error requesting commercial report:', error);
      setError('Error al procesar la solicitud. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para simular el proceso de pago y solicitar el informe
  const handlePayAndRequest = async () => {
    // TODO: Aquí se integraría la pasarela de pago real
    // Por ahora simulamos un pago exitoso y procedemos directamente
    await requestCommercialReport();
  };

  return (
    <>
      {/* Botón Principal */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center space-x-2 bg-white border-2 border-blue-600 text-blue-600 py-3 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors"
      >
        <FileText className="h-5 w-5" />
        <span>Solicitar Informe Comercial</span>
      </button>

      {/* Modal de Confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            {success ? (
              // Pantalla de Éxito
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  ¡Solicitud Recibida!
                </h3>
                <p className="text-gray-600">
                  Recibirás el informe comercial en tu correo en los próximos minutos.
                </p>
              </div>
            ) : (
              <>
                {/* Header del Modal */}
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900">
                    Confirmar Solicitud de Informe Comercial
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Contenido del Modal */}
                <div className="p-6">
                  {/* Descripción del Servicio */}
                  <div className="mb-6">
                    <p className="text-gray-700 mb-4">
                      Estás a punto de solicitar un informe comercial completo de esta propiedad, 
                      que incluye análisis de precios de mercado, historial de transacciones en la zona 
                      y proyecciones.
                    </p>
                    
                    {/* Precio del Servicio */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-900">Costo del servicio:</span>
                        <span className="text-xl font-bold text-blue-900">$15.000 CLP</span>
                      </div>
                    </div>

                    {/* Resumen de la Propiedad */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Propiedad:</h4>
                      <p className="text-gray-700 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                        {propertyAddress}
                      </p>
                    </div>
                  </div>

                  {/* Mensaje de Error */}
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Información Adicional */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-yellow-900 mb-2">¿Qué incluye el informe?</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Análisis comparativo de precios en la zona</li>
                      <li>• Historial de transacciones recientes</li>
                      <li>• Proyecciones de valorización</li>
                      <li>• Información del mercado local</li>
                    </ul>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handlePayAndRequest}
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          <span>Pagar y Solicitar Informe</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
