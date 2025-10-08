import React from 'react';
import ContractCanvasEditor from './ContractCanvasEditor';

const TestCanvasEditor: React.FC = () => {
  // Datos de ejemplo para probar el editor Canvas
  const sampleContract = {
    titulo: "CONTRATO DE ARRENDAMIENTO DE BIEN RAÍZ URBANO",
    comparecencia: "En Santiago de Chile, a 8 de octubre de 2025, entre don Juan Pérez González, cédula de identidad número 12.345.678-9, domiciliado en Av. Providencia 1234, Santiago, en adelante denominado 'el Arrendador', por una parte; y doña María González López, cédula de identidad número 98.765.432-1, domiciliada en Las Condes 567, Santiago, en adelante denominada 'la Arrendataria', por la otra parte, se ha convenido el siguiente contrato de arrendamiento de bien raíz urbano.",
    clausulas: [
      {
        titulo: "PRIMERO: PROPIEDAD ARRENDADA",
        contenido: "El Arrendador da en arrendamiento a la Arrendataria el inmueble ubicado en la dirección acordada por las partes. La propiedad se encuentra en perfectas condiciones de habitabilidad y uso, con todos sus servicios básicos funcionando correctamente. Se deja constancia que la propiedad se arrienda con sus servicios de luz, agua, gas y gastos comunes al día."
      },
      {
        titulo: "SEGUNDO: RENTA DE ARRENDAMIENTO",
        contenido: "La renta mensual de arrendamiento será la suma de $500.000 (quinientos mil pesos). La Arrendataria se obliga a pagar dicha renta por mensualidades anticipadas, dentro de los primeros cinco días de cada mes, mediante transferencia electrónica a la cuenta que el Arrendador indique. El pago se realizará sin deducción alguna y dentro de los plazos estipulados."
      },
      {
        titulo: "TERCERO: DURACIÓN DEL CONTRATO",
        contenido: "El presente contrato de arrendamiento tendrá una duración de 12 meses, contados desde la fecha de suscripción. Este contrato se renovará tácitamente por períodos iguales, salvo que alguna de las partes manifestare su voluntad de ponerle término mediante carta certificada con una anticipación mínima de 60 días al vencimiento del período respectivo."
      },
      {
        titulo: "CUARTO: GARANTÍA",
        contenido: "A fin de garantizar la conservación de la propiedad, la Arrendataria entrega en este acto al Arrendador a título de garantía la suma de $500.000, equivalente a un mes de renta, la cual será devuelta dentro de los 30 días siguientes a la restitución del inmueble, una vez verificado el estado del mismo y el pago total de las cuentas de servicios y gastos comunes."
      }
    ],
    firmantes: [
      { nombre: "Juan Pérez González", rut: "12.345.678-9", rol: "ARRENDADOR" },
      { nombre: "María González López", rut: "98.765.432-1", rol: "ARRENDATARIO" }
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
            <h3 className="font-semibold text-blue-900 mb-2">✨ Lienzo de Documento Dinámico - Características:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Apariencia A4:</strong> Documento con formato profesional (max-w-4xl, p-12 sm:pt-16 sm:px-16)</li>
              <li>• <strong>Fuente Serif:</strong> Tipografía formal y clásica (font-serif)</li>
              <li>• <strong>Texto Justificado:</strong> Párrafos alineados a izquierda y derecha (text-justify)</li>
              <li>• <strong>Altura de Línea:</strong> Espaciado cómodo (leading-relaxed)</li>
              <li>• <strong>Espaciado Generoso:</strong> Cláusulas separadas con space-y-8</li>
              <li>• <strong>Manipulación Dinámica:</strong> Añadir/eliminar cláusulas y firmantes con confirmación</li>
              <li>• <strong>Firmantes Escalables:</strong> Sistema dinámico de firmantes (rol, nombre, RUT)</li>
              <li>• <strong>Edición Directa:</strong> Campos editables con estados visuales intuitivos</li>
              <li>• <strong>Export PDF:</strong> Documento final listo para impresión</li>
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
