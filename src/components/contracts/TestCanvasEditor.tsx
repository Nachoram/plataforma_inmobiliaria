import React from 'react';
import ContractCanvasEditor from './ContractCanvasEditor';

const TestCanvasEditor: React.FC = () => {
  // Datos de ejemplo para probar el editor Canvas
  const sampleContract = {
    titulo: "CONTRATO DE ARRENDAMIENTO",
    comparecencia: "En Santiago de Chile, a 8 de octubre de 2025, entre don Juan Pérez González, cédula de identidad número 12.345.678-9, domiciliado en Av. Providencia 1234, Santiago, en adelante denominado 'el Arrendador', por una parte; y doña María González López, cédula de identidad número 98.765.432-1, domiciliada en Las Condes 567, Santiago, en adelante denominada 'la Arrendataria', por la otra parte, se ha convenido el siguiente contrato de arrendamiento de bien raíz urbano.",
    clausulas: [
      {
        titulo: "PRIMERO: PROPIEDAD ARRENDADA",
        contenido: "El Arrendador da en arrendamiento a la Arrendataria el inmueble ubicado en la dirección acordada por las partes. La propiedad se encuentra en perfectas condiciones de habitabilidad y uso, con todos sus servicios básicos funcionando correctamente."
      },
      {
        titulo: "SEGUNDO: RENTA DE ARRENDAMIENTO",
        contenido: "La renta mensual de arrendamiento será la suma de $500.000 (quinientos mil pesos). La Arrendataria se obliga a pagar dicha renta por mensualidades anticipadas, dentro de los primeros cinco días de cada mes, mediante transferencia electrónica a la cuenta que el Arrendador indique."
      },
      {
        titulo: "TERCERO: DURACIÓN DEL CONTRATO",
        contenido: "El presente contrato de arrendamiento tendrá una duración de 12 meses, contados desde la fecha de suscripción. Este contrato se renovará tácitamente por períodos iguales, salvo que alguna de las partes manifestare su voluntad de ponerle término mediante carta certificada con una anticipación mínima de 60 días."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🧪 Prueba del ContractCanvasEditor
          </h1>
          <p className="text-gray-600 mb-4">
            Este es un componente de prueba para demostrar que el nuevo ContractCanvasEditor funciona correctamente.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">✨ Características implementadas:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Edición in-place:</strong> Haz clic en cualquier campo de texto para editarlo</li>
              <li>• <strong>Auto-resize:</strong> Los textareas se ajustan automáticamente al contenido</li>
              <li>• <strong>Estados visuales:</strong> Bordes sutiles al hacer hover, prominentes al editar</li>
              <li>• <strong>PDF Export:</strong> Botón "Descargar PDF" genera documento profesional</li>
              <li>• <strong>Cláusulas dinámicas:</strong> Añadir/eliminar cláusulas fácilmente</li>
              <li>• <strong>Responsive:</strong> Funciona en diferentes tamaños de pantalla</li>
            </ul>
          </div>
        </div>

        {/* El ContractCanvasEditor con datos de ejemplo */}
        <ContractCanvasEditor initialContract={sampleContract} />
      </div>
    </div>
  );
};

export default TestCanvasEditor;
