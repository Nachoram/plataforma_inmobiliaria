import React, { useState, useEffect } from 'react';

interface WorkflowViewerProps {
  webhookUrl: string;
  requestBody?: Record<string, any>;
}

export const WorkflowViewer: React.FC<WorkflowViewerProps> = ({
  webhookUrl,
  requestBody
}) => {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflowData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody ? JSON.stringify(requestBody) : undefined,
        });

        if (!response.ok) {
          throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          // Respuesta JSON esperada
          const data = await response.json();

          if (!data || !data.html) {
            throw new Error('La respuesta JSON no contiene la propiedad "html" esperada');
          }

          setHtmlContent(data.html);
        } else {
          // Respuesta HTML directa (como la que devuelve N8N con Respond to Webhook)
          const htmlText = await response.text();

          if (!htmlText || htmlText.trim().length === 0) {
            throw new Error('La respuesta HTML está vacía');
          }

          setHtmlContent(htmlText);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar el informe';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowData();
  }, [webhookUrl, requestBody]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Cargando informe...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600 text-center">
          <div className="text-lg font-semibold mb-2">Error al cargar el informe</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent || '' }} />
  );
};
