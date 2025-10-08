import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Eye, AlertCircle, CheckCircle, Edit3, FileText, Users, Shield, FileCheck } from 'lucide-react';
import CustomButton from '../common/CustomButton';
import { supabase } from '../../lib/supabase';

interface ContractData {
  id: string;
  contract_content: {
    arrendador?: {
      nombre: string;
      rut: string;
      domicilio: string;
    };
    arrendatario?: {
      nombre: string;
      rut: string;
      domicilio: string;
    };
    aval?: {
      nombre: string;
      rut: string;
      domicilio: string;
    };
    clausulas?: Array<{
      titulo: string;
      contenido: string;
    }>;
  };
  contract_number?: string;
  status?: string;
}

interface ContractCanvasEditorProps {
  contractId: string;
  contractData: ContractData;
  onClose: () => void;
  onSave: () => void;
}

const ContractCanvasEditor: React.FC<ContractCanvasEditorProps> = ({
  contractId,
  contractData,
  onClose,
  onSave
}) => {
  const [data, setData] = useState(contractData.contract_content || {});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'parties' | 'clauses'>('parties');

  // Inicializar datos por defecto
  useEffect(() => {
    if (!data.arrendador) {
      setData(prev => ({
        ...prev,
        arrendador: { nombre: '', rut: '', domicilio: '' }
      }));
    }
    if (!data.arrendatario) {
      setData(prev => ({
        ...prev,
        arrendatario: { nombre: '', rut: '', domicilio: '' }
      }));
    }
    if (!data.aval) {
      setData(prev => ({
        ...prev,
        aval: { nombre: '', rut: '', domicilio: '' }
      }));
    }
    if (!data.clausulas) {
      setData(prev => ({
        ...prev,
        clausulas: []
      }));
    }
  }, []);

  const updateField = (section: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const updateClause = (index: number, field: 'titulo' | 'contenido', value: string) => {
    setData(prev => ({
      ...prev,
      clausulas: prev.clausulas?.map((clause, i) =>
        i === index ? { ...clause, [field]: value } : clause
      )
    }));
  };

  const addClause = () => {
    setData(prev => ({
      ...prev,
      clausulas: [
        ...(prev.clausulas || []),
        { titulo: `CLÁUSULA ${romanize((prev.clausulas?.length || 0) + 1)}`, contenido: '' }
      ]
    }));
  };

  const removeClause = (index: number) => {
    setData(prev => ({
      ...prev,
      clausulas: prev.clausulas?.filter((_, i) => i !== index)
    }));
  };

  const romanize = (num: number): string => {
    const romanNumerals = [
      { value: 10, symbol: 'X' },
      { value: 9, symbol: 'IX' },
      { value: 5, symbol: 'V' },
      { value: 4, symbol: 'IV' },
      { value: 1, symbol: 'I' }
    ];

    let result = '';
    for (const { value, symbol } of romanNumerals) {
      while (num >= value) {
        result += symbol;
        num -= value;
      }
    }
    return result;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('rental_contracts')
        .update({
          contract_content: data,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (updateError) throw updateError;

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSave();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error al guardar el contrato:', err);
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => (
    <div className="bg-white p-8 shadow-lg rounded-lg max-h-[80vh] overflow-y-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold uppercase mb-4 text-black">
          CONTRATO DE ARRENDAMIENTO<br/>DE BIEN RAÍZ URBANO
        </h1>
        <p className="text-sm text-gray-600">
          Santiago, Chile - {new Date().toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* Partes */}
      <div className="mb-8">
        <h2 className="text-lg font-bold uppercase mb-4 text-black border-b-2 border-black pb-2">
          PARTES CONTRATANTES
        </h2>

        <div className="mb-6">
          <p className="font-bold text-black mb-2">ARRENDADOR:</p>
          <p className="text-sm leading-relaxed text-black">
            {data.arrendador?.nombre || '[Nombre del Arrendador]'}, RUT {data.arrendador?.rut || '[RUT]'},<br/>
            domiciliado en {data.arrendador?.domicilio || '[Domicilio]'}
          </p>
        </div>

        <div className="mb-6">
          <p className="font-bold text-black mb-2">ARRENDATARIO:</p>
          <p className="text-sm leading-relaxed text-black">
            {data.arrendatario?.nombre || '[Nombre del Arrendatario]'}, RUT {data.arrendatario?.rut || '[RUT]'},<br/>
            domiciliado en {data.arrendatario?.domicilio || '[Domicilio]'}
          </p>
        </div>

        {data.aval?.nombre && (
          <div className="mb-6">
            <p className="font-bold text-black mb-2">CODEUDOR SOLIDARIO (AVAL):</p>
            <p className="text-sm leading-relaxed text-black">
              {data.aval.nombre}, RUT {data.aval.rut},<br/>
              domiciliado en {data.aval.domicilio}
            </p>
          </div>
        )}
      </div>

      {/* Cláusulas */}
      <div>
        {data.clausulas?.map((clause, index) => (
          <div key={index} className="mb-6">
            <h3 className="font-bold text-black mb-3 uppercase">
              {clause.titulo}:
            </h3>
            <p className="text-sm leading-relaxed text-justify text-black">
              {clause.contenido}
            </p>
          </div>
        ))}
      </div>

      {/* Firmas */}
      <div className="mt-12 pt-8 border-t-2 border-black">
        <div className="text-center mb-8">
          <p className="text-sm leading-relaxed text-black">
            En comprobante de lo pactado, se firma el presente contrato en dos ejemplares de igual tenor y fecha,
            declarando las partes haber leído y aceptado todas y cada una de las cláusulas del presente instrumento.
          </p>
        </div>

        <div className="flex justify-between mt-16">
          <div className="text-center flex-1">
            <div className="border-t border-black pt-2">
              <p className="font-bold text-black text-sm">ARRENDADOR</p>
              <p className="text-xs text-black mt-1">{data.arrendador?.nombre || '[Nombre]'}</p>
              <p className="text-xs text-black">{data.arrendador?.rut || '[RUT]'}</p>
            </div>
          </div>

          <div className="text-center flex-1">
            <div className="border-t border-black pt-2">
              <p className="font-bold text-black text-sm">ARRENDATARIO</p>
              <p className="text-xs text-black mt-1">{data.arrendatario?.nombre || '[Nombre]'}</p>
              <p className="text-xs text-black">{data.arrendatario?.rut || '[RUT]'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Edit3 className="h-6 w-6 mr-2 text-blue-600" />
              Editor Canvas de Contrato
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              ID: {contractId}
              {contractData.contract_number && ` • N° ${contractData.contract_number}`}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <CustomButton
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>{showPreview ? 'Editor' : 'Vista Previa'}</span>
            </CustomButton>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mensajes de estado */}
        {saveSuccess && (
          <div className="mx-6 mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>¡Cambios guardados exitosamente!</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {!showPreview ? (
          <div className="flex-1 overflow-hidden">
            {/* Tabs */}
            <div className="border-b px-6">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveSection('parties')}
                  className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm ${
                    activeSection === 'parties'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Partes</span>
                </button>
                <button
                  onClick={() => setActiveSection('clauses')}
                  className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm ${
                    activeSection === 'clauses'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileCheck className="h-4 w-4" />
                  <span>Cláusulas</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeSection === 'parties' ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Partes Contratantes</h3>

                  {/* Arrendador */}
                  <div className="bg-gray-50 p-6 rounded-lg border">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-600" />
                      ARRENDADOR
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          value={data.arrendador?.nombre || ''}
                          onChange={(e) => updateField('arrendador', 'nombre', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Ej: Juan Pérez González"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                        <input
                          type="text"
                          value={data.arrendador?.rut || ''}
                          onChange={(e) => updateField('arrendador', 'rut', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Ej: 12.345.678-9"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Domicilio</label>
                        <input
                          type="text"
                          value={data.arrendador?.domicilio || ''}
                          onChange={(e) => updateField('arrendador', 'domicilio', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Ej: Av. Providencia 1234, Santiago"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Arrendatario */}
                  <div className="bg-gray-50 p-6 rounded-lg border">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-green-600" />
                      ARRENDATARIO
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          value={data.arrendatario?.nombre || ''}
                          onChange={(e) => updateField('arrendatario', 'nombre', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Ej: María González Castro"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                        <input
                          type="text"
                          value={data.arrendatario?.rut || ''}
                          onChange={(e) => updateField('arrendatario', 'rut', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Ej: 98.765.432-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Domicilio</label>
                        <input
                          type="text"
                          value={data.arrendatario?.domicilio || ''}
                          onChange={(e) => updateField('arrendatario', 'domicilio', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Ej: Las Condes 567, Santiago"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aval */}
                  <div className="bg-gray-50 p-6 rounded-lg border">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-orange-600" />
                      CODEUDOR SOLIDARIO (AVAL) - <em className="font-normal text-sm">Opcional</em>
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          value={data.aval?.nombre || ''}
                          onChange={(e) => updateField('aval', 'nombre', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Ej: Pedro Rodríguez Silva"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                        <input
                          type="text"
                          value={data.aval?.rut || ''}
                          onChange={(e) => updateField('aval', 'rut', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Ej: 11.222.333-4"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Domicilio</label>
                        <input
                          type="text"
                          value={data.aval?.domicilio || ''}
                          onChange={(e) => updateField('aval', 'domicilio', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Ej: Ñuñoa 890, Santiago"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Cláusulas del Contrato</h3>
                    <CustomButton
                      onClick={addClause}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Añadir Cláusula</span>
                    </CustomButton>
                  </div>

                  {data.clausulas?.map((clause, index) => (
                    <div key={index} className="bg-gray-50 p-6 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900">Cláusula {index + 1}</h4>
                        <button
                          onClick={() => removeClause(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Cláusula</label>
                          <input
                            type="text"
                            value={clause.titulo}
                            onChange={(e) => updateClause(index, 'titulo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                            placeholder="Ej: PRIMERO: PROPIEDAD ARRENDADA"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
                          <textarea
                            value={clause.contenido}
                            onChange={(e) => updateClause(index, 'contenido', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Escribe el contenido de la cláusula..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!data.clausulas || data.clausulas.length === 0) && (
                    <div className="text-center py-12 text-gray-500">
                      <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay cláusulas definidas</p>
                      <p className="text-sm mt-2">Haz clic en "Añadir Cláusula" para comenzar</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Vista Previa */
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Vista Previa del Contrato</h3>
                <p className="text-sm text-gray-600 mt-1">Así se verá el contrato final</p>
              </div>

              {renderPreview()}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {data.clausulas?.length || 0} cláusulas definidas
          </div>
          <div className="flex space-x-3">
            <CustomButton
              onClick={onClose}
              variant="outline"
            >
              Cancelar
            </CustomButton>
            <CustomButton
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Contrato'}</span>
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractCanvasEditor;
