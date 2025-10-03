import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContractViewer from './ContractViewer';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import CustomButton from '../common/CustomButton';

const ContractViewerPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  if (!contractId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            ID de contrato no válido
          </h2>
          <p className="text-gray-600 mb-4">
            No se proporcionó un ID de contrato válido.
          </p>
          <CustomButton
            onClick={() => navigate('/contracts')}
            className="flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Contratos</span>
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <ContractViewer
      contractId={contractId}
      onClose={() => navigate('/contracts')}
      showActions={true}
    />
  );
};

export default ContractViewerPage;
