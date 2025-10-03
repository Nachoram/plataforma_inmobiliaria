// Ejemplo de uso del componente WorkflowViewer

import React from 'react';
import { WorkflowViewer } from './src/components/workflow/WorkflowViewer';

const ExampleUsage: React.FC = () => {
  // Ejemplo 1: Uso básico con webhookUrl requerido
  const basicUsage = (
    <WorkflowViewer
      webhookUrl="https://tu-api-endpoint.com/webhook"
    />
  );

  // Ejemplo 2: Con requestBody opcional
  const withRequestBody = (
    <WorkflowViewer
      webhookUrl="https://tu-api-endpoint.com/webhook"
      requestBody={{
        workflowId: "informe_mensual_propiedad",
        propertyId: "uuid-de-propiedad",
        userId: "uuid-de-usuario"
      }}
    />
  );

  // Ejemplo 3: Integración con sistema existente
  const integratedUsage = (
    <WorkflowViewer
      webhookUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-workflow-html`}
      requestBody={{
        workflowId: "reporte_financiero",
        propertyId: "123e4567-e89b-12d3-a456-426614174000"
      }}
    />
  );

  return (
    <div>
      <h1>Ejemplos de uso de WorkflowViewer</h1>

      <h2>1. Uso Básico</h2>
      {basicUsage}

      <h2>2. Con Request Body</h2>
      {withRequestBody}

      <h2>3. Integrado con Supabase</h2>
      {integratedUsage}
    </div>
  );
};

export default ExampleUsage;
