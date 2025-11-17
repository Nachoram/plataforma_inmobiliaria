import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ContractCanvasEditor from './ContractCanvasEditor';
import { CustomButton } from '../common';

const ContractCanvasEditorPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const [contractData, setContractData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractId) {
      loadContract();
    }
  }, [contractId]);

  const loadContract = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: contractError } = await supabase
        .from('rental_contracts')
        .select('id, contract_content, contract_number, status')
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      setContractData(data);
    } catch (err: any) {
      console.error('Error loading contract:', err);
      setError(err.message || 'Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/contracts');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-4">Error al cargar el contrato</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-x-4">
            <CustomButton onClick={loadContract} variant="outline">
              Reintentar
            </CustomButton>
            <CustomButton onClick={handleBack} variant="primary">
              Volver
            </CustomButton>
          </div>
        </div>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Contrato no encontrado</h3>
          <CustomButton onClick={handleBack} variant="primary">
            Volver
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with navigation */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CustomButton
                onClick={handleBack}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver a Contratos</span>
              </CustomButton>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Editor de Contrato</h1>
                <p className="text-sm text-gray-600">
                  {contractData.contract_number && `Contrato N° ${contractData.contract_number}`}
                  {!contractData.contract_number && `ID: ${contractId}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor con guardado integrado */}
      <ContractCanvasEditor
        initialContract={contractData.contract_content || {}}
        contractId={contractId}
        showSaveButton={true}
      />
    </div>
  );
};

export default ContractCanvasEditorPage;
