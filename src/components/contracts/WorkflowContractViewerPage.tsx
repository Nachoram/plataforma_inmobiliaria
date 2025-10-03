import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import WorkflowContractViewer from './WorkflowContractViewer';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import CustomButton from '../common/CustomButton';

const WorkflowContractViewerPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Obtener parámetros de la URL
  const webhookUrl = searchParams.get('webhookUrl');
  const workflowId = searchParams.get('workflowId');
  const propertyId = searchParams.get('propertyId');
  const applicationId = searchParams.get('applicationId');

  // Si no hay webhookUrl, mostrar error
  if (!webhookUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            URL del Webhook Requerida
          </h2>
          <p className="text-gray-600 mb-4">
            Se necesita la URL del webhook de N8N para generar el contrato.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Parámetros esperados: ?webhookUrl=...&workflowId=...&propertyId=...&applicationId=...
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

  // Preparar el request body para el webhook
  const requestBody = {
    workflowId: workflowId || 'contrato_arriendo',
    contractId: contractId,
    propertyId: propertyId,
    applicationId: applicationId,
    action: 'generate_contract',
    timestamp: new Date().toISOString(),
    // Incluir cualquier otro dato necesario para N8N
    metadata: {
      source: 'plataforma_inmobiliaria',
      userAgent: navigator.userAgent,
      url: window.location.href
    }
  };

  const contractTitle = workflowId
    ? `Contrato - ${workflowId.replace(/_/g, ' ').toUpperCase()}`
    : 'Contrato Generado por Workflow';

  return (
    <WorkflowContractViewer
      webhookUrl={webhookUrl}
      requestBody={requestBody}
      contractTitle={contractTitle}
      onClose={() => navigate('/contracts')}
      showActions={true}
    />
  );
};

export default WorkflowContractViewerPage;
