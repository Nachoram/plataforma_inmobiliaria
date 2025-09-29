import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContractCanvas, ContractContent, parseN8nContractToCanvas } from '../../hooks/useContractCanvas';
import RichTextEditor from './RichTextEditor';

const ContractCanvasDemo: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [activeSection, setActiveSection] = useState<keyof ContractContent>('header');
  const [notes, setNotes] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showN8nImport, setShowN8nImport] = useState(false);
  const [n8nContractText, setN8nContractText] = useState('');
  const isDemoMode = !contractId;

  // Hook para manejar la integración con backend
  const {
    contract,
    clauses,
    canvasContent,
    loading,
    saving,
    error,
    saveContract,
    updateContractStatus,
    importFromN8n,
    syncCanvasContent
  } = useContractCanvas(contractId);

  // Estado para el contenido del demo
  const [demoCanvasContent, setDemoCanvasContent] = useState<ContractContent | null>(null);

  // Cargar contenido del demo si estamos en modo demo
  useEffect(() => {
    if (isDemoMode && !demoCanvasContent) {
      const sampleContract = `CONTRATO DE ARRENDAMIENTO RESIDENCIAL

CLÁUSULA PRIMERA: COMPARECIENCIA
En Santiago de Chile, a 29 de septiembre de 2025, comparecen:
**Carolina Andrea Soto Rojas**, con RUT N° 15.123.456-7, domiciliada en Eliodoro Yáñez 1890, Providencia, en adelante "el Arrendador"; y
**Carlos Alberto Soto Vega**, con RUT N° 22.222.222-2, domiciliado en Los Leones 567 Depto. 56, Providencia, en adelante "el Arrendatario".
Ambas partes convienen en celebrar el presente contrato de arrendamiento residencial, el que se regirá por las siguientes cláusulas.

CLÁUSULA SEGUNDA: OBJETO
El Arrendador da en arrendamiento al Arrendatario, quien acepta para sí, el inmueble ubicado en Suecia 1234 Casa A, Providencia, con ROL de avalúo N° [ROL no especificado].
El inmueble arrendado se destina exclusivamente para fines residenciales, para la habitación del Arrendatario y su familia.
Se deja constancia que el inmueble no incluye estacionamiento ni bodega.

CLÁUSULA TERCERA: RENTA
La renta mensual de arrendamiento será la suma de $1.600.000 (un millón seiscientos mil pesos chilenos).
El Arrendatario se obliga a pagar dicha suma por adelantado dentro de los primeros cinco (5) días de cada mes, en la forma y lugar que las partes convengan o determinen posteriormente.

CLÁUSULA CUARTA: DURACIÓN
El presente contrato tendrá una duración de 12 meses a contar del 1 de octubre de 2025, pudiendo renovarse previo acuerdo expreso entre las partes.
El Arrendatario podrá poner término al contrato notificando al Arrendador con al menos 30 días de anticipación, en conformidad con la legislación vigente.
Asimismo, el Arrendador podrá poner término conforme a los plazos y causales legales aplicables.

CLÁUSULA QUINTA: GARANTÍA, AVAL Y CODEUDOR SOLIDARIO
Para garantía del fiel cumplimiento de todas las obligaciones emanadas del presente contrato, comparece y se constituye en aval y codeudor solidario:
**Don Rodolfo Rrrrrrrr Mmmmmm**, con RUT N° 11.111.111-1, domiciliado en Irarrazaval 5350 Depto. 22, Ñuñoa, quien responde solidariamente con el Arrendatario por todas las obligaciones presentes y futuras derivadas del presente contrato.

Firmado en dos ejemplares de un mismo tenor y a un solo efecto, en Santiago de Chile a 29 de septiembre de 2025.

_____________________________
Carolina Andrea Soto Rojas
RUT: 15.123.456-7
ARRENDADOR

_____________________________
Carlos Alberto Soto Vega
RUT: 22.222.222-2
ARRENDATARIO

_____________________________
Rodolfo Rrrrrrrr Mmmmmm
RUT: 11.111.111-1
AVAL Y CODEUDOR SOLIDARIO`;

      const parsedContent = parseN8nContractToCanvas(sampleContract);
      setDemoCanvasContent(parsedContent);
    }
  }, [isDemoMode, demoCanvasContent]);

  // Usar canvasContent generado desde cláusulas o del demo
  useEffect(() => {
    setNotes(contract?.notes || '');
  }, [contract]);

  // Determinar qué contenido usar
  const currentCanvasContent = isDemoMode ? demoCanvasContent : canvasContent;

  // Función para actualizar una sección del contrato (ahora guarda en cláusulas)
  const updateSection = async (section: keyof ContractContent, content: string) => {
    if (isDemoMode) {
      // En modo demo, solo actualizar el estado local
      setDemoCanvasContent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [section]: {
            ...prev[section],
            content
          }
        };
      });
      setHasUnsavedChanges(true);
      return;
    }

    if (!contract) return;

    try {
      // Guardar el contenido actualizado
      if (!currentCanvasContent) return;

      await saveContract({
        ...currentCanvasContent,
        [section]: {
          ...currentCanvasContent[section],
          content
        }
      });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error updating section:', err);
      alert('Error al guardar la sección');
    }
  };

  // Función para guardar cambios (ahora solo sincroniza las cláusulas)
  const handleSave = async () => {
    if (isDemoMode) {
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      alert('✅ Cambios guardados localmente (modo demo)');
      return;
    }

    if (!contract) return;

    try {
      await syncCanvasContent();
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      alert('✅ Contrato sincronizado exitosamente');
    } catch (err) {
      alert('❌ Error al sincronizar el contrato');
    }
  };

  // Función para cambiar estado
  const handleStatusChange = async (status: 'approved' | 'sent_to_signature') => {
    if (isDemoMode) {
      alert('❌ Esta función no está disponible en modo demo');
      return;
    }

    try {
      await updateContractStatus(status);
      alert(`✅ Estado cambiado a: ${status === 'approved' ? 'Aprobado' : 'Enviado a firma'}`);
    } catch (err) {
      alert('❌ Error al cambiar el estado del contrato');
    }
  };

  // Función para probar el parsing (para debugging)
  const testN8nParsing = () => {
    if (!n8nContractText.trim()) {
      alert('❌ Por favor, pega un contrato de N8N para probar el parsing');
      return;
    }

    // Importar la función de parsing desde el hook
    import('../../hooks/useContractCanvas').then(({ parseN8nContractToCanvas }) => {
      const result = parseN8nContractToCanvas(n8nContractText);
      console.log('🔍 Resultado del parsing de tu contrato:', result);
      console.log('📄 Texto original:', n8nContractText);
      alert('✅ Revisa la consola del navegador (F12) para ver cómo se parseó tu contrato');
    });
  };

  // Función para importar desde N8N
  const handleN8nImport = async () => {
    if (!n8nContractText.trim()) {
      alert('❌ Por favor, pega el contrato generado por N8N');
      return;
    }

    try {
      await importFromN8n(n8nContractText);
      setShowN8nImport(false);
      setN8nContractText('');
      alert('✅ Contrato importado exitosamente desde N8N');
    } catch (err) {
      alert('❌ Error al importar contrato desde N8N');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contrato no encontrado</h1>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🎨 {isDemoMode ? 'Canvas del Contrato - Modo Demo' : 'Canvas del Contrato'}
                {hasUnsavedChanges && <span className="ml-2 text-orange-500 text-sm">●</span>}
                {isDemoMode && <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">DEMO</span>}
              </h1>
              <p className="text-sm text-gray-600">
                {isDemoMode ? (
                  'Editor visual de ejemplo • Modo demostración • Cambios locales'
                ) : (
                  <>
                    Editor visual • Contrato: {contract?.id?.slice(0, 8)} • Estado: {contract?.status}
                    {lastSaved && (
                      <span className="ml-2 text-green-600">
                        • Sincronizado: {lastSaved.toLocaleTimeString('es-ES')}
                      </span>
                    )}
                    <span className="ml-2 text-blue-600">
                      • {clauses.length} cláusulas
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              {!isDemoMode && (
                <button
                  onClick={() => setShowN8nImport(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  title="Importar contrato desde N8N"
                >
                  🤖 Importar N8N
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !currentCanvasContent}
                className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${
                  hasUnsavedChanges
                    ? 'bg-orange-600 hover:bg-orange-700 animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {saving ? '🔄 Guardando...' : (isDemoMode ? '💾 Guardar Local' : '🔄 Sincronizar Canvas')}
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                📄 Vista Previa
              </button>
              {!isDemoMode && (
                <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                  📤 Exportar PDF
                </button>
              )}
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar - Secciones */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Secciones</h2>
              <nav className="space-y-2">
                {currentCanvasContent && Object.entries(currentCanvasContent).map(([key, section]) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key as keyof ContractContent)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeSection === key
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>

            {/* Estado del contrato */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Estado</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado actual:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    contract.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    contract.status === 'approved' ? 'bg-green-100 text-green-800' :
                    contract.status === 'sent_to_signature' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {contract.status === 'draft' ? 'Borrador' :
                     contract.status === 'approved' ? 'Aprobado' :
                     contract.status === 'sent_to_signature' ? 'En Firma' :
                     'Otro'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Versión:</span>
                  <span className="text-sm font-medium">{contract.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Actualizado:</span>
                  <span className="text-xs text-gray-500">
                    {new Date(contract.updated_at).toLocaleDateString('es-ES')}
                  </span>
                </div>

                {/* Acciones de estado */}
                {contract.status === 'draft' && (
                  <div className="space-y-2 pt-4 border-t">
                    <button
                      onClick={() => handleStatusChange('approved')}
                      className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      ✅ Aprobar Contrato
                    </button>
                  </div>
                )}

                {contract.status === 'approved' && (
                  <div className="space-y-2 pt-4 border-t">
                    <button
                      onClick={() => handleStatusChange('sent_to_signature')}
                      className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      ✍️ Enviar a Firma
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Notas</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar notas sobre el contrato..."
                className="w-full h-24 p-3 border rounded-md text-sm resize-none"
              />
            </div>
          </div>

          {/* Editor principal */}
          <div className="col-span-9">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentCanvasContent?.[activeSection]?.title}
                </h2>
              </div>

              <div className="p-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <RichTextEditor
                    value={currentCanvasContent?.[activeSection]?.content || ''}
                    onChange={(value) => updateSection(activeSection, value)}
                    placeholder={`Escribe el contenido de la sección "${currentCanvasContent?.[activeSection]?.title || 'Sección'}"...`}
                    className="contract-editor"
                  />
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {hasUnsavedChanges ? (
                      <span className="text-orange-600 font-medium">
                        ⚠️ Tienes cambios sin sincronizar. Haz click en "Sincronizar Canvas" para actualizar el contenido.
                      </span>
                    ) : (
                      <span>
                        💡 El canvas está sincronizado con las cláusulas. Los cambios se reflejan automáticamente en la base de datos.
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${
                        hasUnsavedChanges
                          ? 'bg-orange-600 hover:bg-orange-700 animate-pulse'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {saving ? '🔄 Sincronizando...' : '✓ Sincronizar'}
                    </button>
                    <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                      🔄 Revertir
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Vista previa */}
            <div className="bg-white rounded-lg shadow-sm mt-6">
              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-900">👁️ Vista Previa del Contrato</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Vista formateada de la sección actual - útil para revisar antes de guardar
                </p>
              </div>
              <div className="p-6">
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">
                      📄 {currentCanvasContent?.[activeSection]?.title || 'Sección'}
                    </span>
                  </div>
                  <div className="p-8 max-h-96 overflow-y-auto">
                    <div
                      className="prose prose-sm max-w-none contract-preview"
                      dangerouslySetInnerHTML={{ __html: currentCanvasContent?.[activeSection]?.content || '' }}
                    />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 text-center">
                  💡 Esta vista previa muestra cómo se verá la sección en el contrato final
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para importar desde N8N */}
      {showN8nImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">🤖 Importar Contrato desde N8N</h2>
                <button
                  onClick={() => setShowN8nImport(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Pega el contrato generado por tu automatización de N8N y se convertirá automáticamente al formato del canvas.
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📄 Contrato generado por N8N:
                </label>
                <textarea
                  value={n8nContractText}
                  onChange={(e) => setN8nContractText(e.target.value)}
                  placeholder="Pega aquí el contrato completo generado por N8N...

Ejemplo:
CONTRATO DE ARRENDAMIENTO RESIDENCIAL

CLÁUSULA PRIMERA: COMPARECIENCIA
En Santiago de Chile, a 29 de septiembre de 2025, comparecen: ..."
                  className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">ℹ️ Cómo funciona la importación:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>CLÁUSULA PRIMERA</strong> → Sección "Encabezado"</li>
                  <li>• <strong>CLÁUSULA SEGUNDA-QUINTA</strong> → Sección "Condiciones"</li>
                  <li>• <strong>Cláusulas de garantías</strong> → Sección "Obligaciones"</li>
                  <li>• <strong>Firmas al final</strong> → Sección "Firmas Digitales"</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={testN8nParsing}
                  disabled={!n8nContractText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  🔍 Probar Parsing
                </button>
                <button
                  onClick={() => setShowN8nImport(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleN8nImport}
                  disabled={!n8nContractText.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🚀 Importar Contrato
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos adicionales para el editor de contratos */}
      <style>{`
        .contract-editor {
          border-radius: 0.5rem;
        }

        .contract-preview {
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.6;
          color: #1f2937;
        }

        .contract-preview h1,
        .contract-preview h2,
        .contract-preview h3,
        .contract-preview h4,
        .contract-preview h5,
        .contract-preview h6 {
          color: #111827;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }

        .contract-preview h1 {
          font-size: 2em;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.3em;
        }

        .contract-preview h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.2em;
        }

        .contract-preview h3 {
          font-size: 1.25em;
        }

        .contract-preview p {
          margin-bottom: 1em;
        }

        .contract-preview strong {
          font-weight: 600;
        }

        .contract-preview em {
          font-style: italic;
        }

        .contract-preview u {
          text-decoration: underline;
        }

        .contract-preview blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          background-color: #f8fafc;
          padding: 1rem;
          border-radius: 0.25rem;
        }

        .contract-preview pre {
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          padding: 0.75rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875em;
          overflow-x: auto;
        }

        .contract-preview ol,
        .contract-preview ul {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }

        .contract-preview li {
          margin-bottom: 0.25rem;
        }

        .contract-preview a {
          color: #3b82f6;
          text-decoration: underline;
        }

        .contract-preview a:hover {
          color: #1d4ed8;
        }

        /* Estilos de alineación */
        .contract-preview .ql-align-center {
          text-align: center;
        }

        .contract-preview .ql-align-right {
          text-align: right;
        }

        .contract-preview .ql-align-justify {
          text-align: justify;
        }
      `}</style>
    </div>
  );
};

export default ContractCanvasDemo;
