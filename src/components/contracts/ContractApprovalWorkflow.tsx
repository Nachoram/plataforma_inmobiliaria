import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  FileText,
  Send,
  User,
  Shield,
  AlertTriangle,
  Eye,
  Edit3,
  Mail
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { electronicSignatureService } from '../../lib/electronicSignature';
import CustomButton from '../common/CustomButton';
import { HTMLCanvasViewer } from '../common/HTMLCanvasViewer';

interface ContractSection {
  id: string;
  title: string;
  content: string;
  editable: boolean;
}

interface ContractContent {
  sections: ContractSection[];
}

interface ApprovalError {
  message?: string;
}

interface SignatureRecord {
  contract_id: string;
  signer_type: 'owner' | 'tenant' | 'guarantor';
  signer_name: string;
  signer_email: string;
  signature_status: string;
}

interface ContractApprovalWorkflowProps {
  contractId: string;
  onContractUpdated?: () => void;
  onClose?: () => void;
}

interface Contract {
  id: string;
  status: string;
  contract_content: ContractContent;
  approved_at: string;
  sent_to_signature_at: string;
  owner_signed_at: string;
  tenant_signed_at: string;
  guarantor_signed_at: string;
  applications: {
    id: string;
    snapshot_applicant_first_name: string;
    snapshot_applicant_paternal_last_name: string;
    snapshot_applicant_email: string;
    properties: {
      description: string;
      address_street: string;
      address_number: string;
      address_department: string | null;
      address_commune: string;
      address_region: string;
      owner_id: string;
      profiles: {
        first_name: string;
        paternal_last_name: string;
        email: string;
      };
    };
    guarantors: Array<{
      profiles: {
        first_name: string;
        paternal_last_name: string;
        email: string;
      };
    }>;
  };
}

interface Signature {
  id: string;
  signer_type: string;
  signer_name: string;
  signer_email: string;
  signature_status: string;
  signed_at: string;
  signature_url: string;
}

const ContractApprovalWorkflow: React.FC<ContractApprovalWorkflowProps> = ({
  contractId,
  onContractUpdated,
  onClose
}) => {
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showCanvasViewer, setShowCanvasViewer] = useState(false);
  const [contractHtmlContent, setContractHtmlContent] = useState<string>('');

  const loadContractData = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar contrato con datos relacionados
      const { data: contractData, error: contractError } = await supabase
        .from('rental_contracts')
        .select(`
          *,
          applications (
            id,
            snapshot_applicant_first_name,
            snapshot_applicant_paternal_last_name,
            snapshot_applicant_email,
            properties (
              description,
              address_street,
              address_number,
              address_department,
              address_commune,
              address_region,
              owner_id,
              profiles!properties_owner_id_fkey (
                first_name,
                paternal_last_name,
                email
              )
            ),
            guarantors (
              guarantor_id,
              profiles!guarantors_guarantor_id_fkey (
                first_name,
                paternal_last_name,
                email
              )
            )
          )
        `)
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;
      setContract(contractData);

      // Generar HTML del contrato para canvas
      const htmlContent = generateContractHtmlForCanvas(contractData);
      setContractHtmlContent(htmlContent);

      // Cargar firmas
      const { data: signaturesData, error: signaturesError } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at');

      if (signaturesError) throw signaturesError;
      setSignatures(signaturesData || []);

    } catch (error: ApprovalError) {
      console.error('Error loading contract data:', error);
      const errorMessage = error?.message || 'Error desconocido';
      alert(`Error al cargar los datos del contrato:\n\n${errorMessage}\n\nRevisa la consola para más detalles.`);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadContractData();
  }, [contractId, loadContractData]);

  const handleApproveContract = async () => {
    if (!confirm('¿Estás seguro de que deseas aprobar este contrato? Una vez aprobado, se enviará a firma electrónica.')) {
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('rental_contracts')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', contractId);

      if (error) throw error;

      setContract(prev => prev ? {
        ...prev,
        status: 'approved',
        approved_at: new Date().toISOString()
      } : null);

      if (onContractUpdated) {
        onContractUpdated();
      }

      alert('Contrato aprobado exitosamente');
    } catch (error: ApprovalError) {
      console.error('Error approving contract:', error);
      const errorMessage = error?.message || 'Error desconocido';
      alert(`Error al aprobar el contrato:\n\n${errorMessage}\n\nRevisa la consola para más detalles.`);
      setProcessing(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleSendToSignature = async () => {
    if (!confirm('¿Estás seguro de que deseas enviar este contrato a firma electrónica? Se enviarán correos a todas las partes.')) {
      return;
    }

    setProcessing(true);
    try {
      // Crear registros de firma para cada parte
      const signatureRecords = [
        {
          contract_id: contractId,
          signer_type: 'owner',
          signer_user_id: contract?.applications.properties.owner_id,
          signer_name: `${contract?.applications.properties.profiles.first_name} ${contract?.applications.properties.profiles.paternal_last_name}`,
          signer_email: contract?.applications.properties.profiles.email,
          signature_status: 'pending'
        },
        {
          contract_id: contractId,
          signer_type: 'tenant',
          signer_name: `${contract?.applications.snapshot_applicant_first_name} ${contract?.applications.snapshot_applicant_paternal_last_name}`,
          signer_email: contract?.applications.snapshot_applicant_email,
          signature_status: 'pending'
        }
      ];

      // Agregar aval si existe
      if (contract?.applications.guarantors?.[0]) {
        const guarantor = contract.applications.guarantors[0];
        signatureRecords.push({
          contract_id: contractId,
          signer_type: 'guarantor',
          signer_user_id: null, // Los garantes no necesariamente son usuarios registrados
          signer_name: `${guarantor.profiles.first_name} ${guarantor.profiles.paternal_last_name}`,
          signer_email: guarantor.profiles.email,
          signature_status: 'pending'
        });
      }

      // Insertar registros de firma
      const { error: signaturesError } = await supabase
        .from('contract_signatures')
        .insert(signatureRecords);

      if (signaturesError) throw signaturesError;

      // Actualizar estado del contrato
      const { error: contractError } = await supabase
        .from('rental_contracts')
        .update({
          status: 'sent_to_signature',
          sent_to_signature_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (contractError) throw contractError;

      // Enviar firmas electrónicas usando el servicio real
      await sendElectronicSignatures(signatureRecords);

      setContract(prev => prev ? {
        ...prev,
        status: 'sent_to_signature',
        sent_to_signature_at: new Date().toISOString()
      } : null);

      // Recargar firmas
      await loadContractData();

      if (onContractUpdated) {
        onContractUpdated();
      }

      alert('Contrato enviado a firma electrónica exitosamente');
    } catch (error: ApprovalError) {
      console.error('Error sending to signature:', error);
      const errorMessage = error?.message || 'Error desconocido';
      alert(`Error al enviar a firma electrónica:\n\n${errorMessage}\n\nRevisa la consola para más detalles.`);
      setProcessing(false);
    } finally {
      setProcessing(false);
    }
  };

  const sendElectronicSignatures = async (signatureRecords: SignatureRecord[]) => {
    // Usar el servicio de firma electrónica real
    for (const record of signatureRecords) {
      try {
        // Generar contenido HTML del contrato para firma
        const contractHtml = generateContractHtml(contract);

        const signatureRequest = {
          contractId: record.contract_id,
          signerType: record.signer_type as 'owner' | 'tenant' | 'guarantor',
          signerName: record.signer_name,
          signerEmail: record.signer_email,
          documentContent: contractHtml
        };

        const response = await electronicSignatureService.sendForSignature(signatureRequest);

        if (response.success && response.signatureRequestId && response.signatureUrl) {
          // Actualizar registro de firma con datos reales
          await supabase
            .from('contract_signatures')
            .update({
              signature_request_id: response.signatureRequestId,
              signature_url: response.signatureUrl,
              signature_status: 'sent',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
            })
            .eq('contract_id', contractId)
            .eq('signer_type', record.signer_type);
        } else {
          console.error('Error sending signature for', record.signer_type, response.error);
          // Mantener como pendiente si falla
        }
      } catch (error) {
        console.error('Error processing signature for', record.signer_type, error);
      }
    }
  };

  const generateContractHtml = (contract: Contract): string => {
    if (!contract.contract_content?.sections) {
      return '<p>Contenido del contrato no disponible</p>';
    }

    let html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1, h2, h3 { color: #333; }
            .signature-section { margin-top: 50px; border-top: 1px solid #000; padding-top: 20px; }
          </style>
        </head>
        <body>
    `;

    contract.contract_content.sections.forEach((section: ContractSection) => {
      html += `
        <h2>${section.title}</h2>
        ${section.content}
      `;
    });

    html += `
        </body>
      </html>
    `;

    return html;
  };

  const generateContractHtmlForCanvas = (contract: Contract): string => {
    if (!contract.contract_content?.sections) {
      return '<div class="text-center p-8 text-gray-500">Contenido del contrato no disponible</div>';
    }

    const sections = contract.contract_content.sections;
    const property = contract.applications.properties;

    // Construir dirección completa
    const fullAddress = `${property.address_street} ${property.address_number}${property.address_department ? `, ${property.address_department}` : ''}, ${property.address_commune}`;

    let html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contrato de Arriendo - ${contract.applications.snapshot_applicant_first_name} ${contract.applications.snapshot_applicant_paternal_last_name}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .contract-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            .contract-subtitle {
              font-size: 16px;
              color: #666;
              margin-bottom: 20px;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #2c3e50;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .party-info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 10px 0;
            }
            .party-label {
              font-weight: bold;
              color: #495057;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              page-break-inside: avoid;
            }
            .signature-box {
              width: 30%;
              text-align: center;
              border-top: 1px solid #000;
              padding-top: 20px;
            }
            .signature-label {
              font-weight: bold;
              margin-bottom: 10px;
            }
            .signature-name {
              margin-bottom: 5px;
            }
            .signature-rut {
              font-size: 12px;
              color: #666;
            }
            .property-info {
              background: #e8f4f8;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #17a2b8;
              margin: 15px 0;
            }
            .conditions-list {
              background: #fff3cd;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #ffc107;
              margin: 15px 0;
            }
            .obligations-list {
              background: #d1ecf1;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #17a2b8;
              margin: 15px 0;
            }
            ol, ul {
              padding-left: 20px;
            }
            li {
              margin-bottom: 8px;
            }
            .contract-footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body {
                padding: 20px;
                font-size: 12px;
              }
              .contract-title {
                font-size: 20px;
              }
              .section-title {
                font-size: 16px;
              }
            }
          </style>
        </head>
        <body>
    `;

    // Header
    const headerSection = sections.find((s: ContractSection) => s.id === 'header');
    if (headerSection) {
      html += `
        <div class="header">
          ${headerSection.content}
        </div>
      `;
    }

    // Parties
    const partiesSection = sections.find((s: ContractSection) => s.id === 'parties');
    if (partiesSection) {
      html += `
        <div class="section">
          <div class="section-title">${partiesSection.title}</div>
          ${partiesSection.content}
        </div>
      `;
    }

    // Property
    const propertySection = sections.find((s: ContractSection) => s.id === 'property');
    if (propertySection) {
      html += `
        <div class="section">
          <div class="section-title">${propertySection.title}</div>
          <div class="property-info">
            <strong>Información de la Propiedad:</strong><br>
            <strong>Dirección:</strong> ${fullAddress}<br>
            <strong>Tipo:</strong> ${property.description || 'Propiedad residencial'}
          </div>
          ${propertySection.content}
        </div>
      `;
    }

    // Conditions
    const conditionsSection = sections.find((s: ContractSection) => s.id === 'conditions');
    if (conditionsSection) {
      html += `
        <div class="section">
          <div class="section-title">${conditionsSection.title}</div>
          ${conditionsSection.content}
        </div>
      `;
    }

    // Obligations
    const obligationsSection = sections.find((s: ContractSection) => s.id === 'obligations');
    if (obligationsSection) {
      html += `
        <div class="section">
          <div class="section-title">${obligationsSection.title}</div>
          ${obligationsSection.content}
        </div>
      `;
    }

    // Termination
    const terminationSection = sections.find((s: ContractSection) => s.id === 'termination');
    if (terminationSection) {
      html += `
        <div class="section">
          <div class="section-title">${terminationSection.title}</div>
          ${terminationSection.content}
        </div>
      `;
    }

    // Legal
    const legalSection = sections.find((s: ContractSection) => s.id === 'legal');
    if (legalSection) {
      html += `
        <div class="section">
          <div class="section-title">${legalSection.title}</div>
          ${legalSection.content}
        </div>
      `;
    }

    // Signatures
    const signaturesSection = sections.find((s: ContractSection) => s.id === 'signatures');
    if (signaturesSection) {
      html += `
        <div class="section">
          <div class="section-title">${signaturesSection.title}</div>
          ${signaturesSection.content}
        </div>
      `;
    }

    // Footer
    html += `
      <div class="contract-footer">
        <p><strong>Contrato generado electrónicamente</strong></p>
        <p>ID del contrato: ${contract.id}</p>
        <p>Fecha de generación: ${new Date().toLocaleDateString('es-CL')}</p>
        <p>Estado: ${getStatusText(contract.status)}</p>
      </div>
    `;

    html += `
        </body>
      </html>
    `;

    return html;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit3 className="h-5 w-5 text-gray-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'sent_to_signature':
        return <Send className="h-5 w-5 text-blue-500" />;
      case 'partially_signed':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'fully_signed':
        return <Shield className="h-5 w-5 text-green-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'approved':
        return 'Aprobado';
      case 'sent_to_signature':
        return 'Enviado a Firma';
      case 'partially_signed':
        return 'Parcialmente Firmado';
      case 'fully_signed':
        return 'Completamente Firmado';
      default:
        return 'Cancelado';
    }
  };

  const getSignatureStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'sent':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSignatureStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'sent':
        return 'Enviado';
      case 'signed':
        return 'Firmado';
      case 'rejected':
        return 'Rechazado';
      case 'expired':
        return 'Expirado';
      default:
        return 'Pendiente';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Cargando contrato...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">No se pudo cargar el contrato</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-xl">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6" />
          <div>
            <h2 className="text-xl font-bold">Flujo de Aprobación del Contrato</h2>
            <p className="text-green-100 text-sm">
              {contract.applications.properties.description || `Propiedad en ${contract.applications.properties.address_commune}`} - {contract.applications.snapshot_applicant_first_name} {contract.applications.snapshot_applicant_paternal_last_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg px-3 py-1">
            {getStatusIcon(contract.status)}
            <span className="font-medium">{getStatusText(contract.status)}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Contract Status Timeline */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Contrato</h3>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
              contract.status === 'draft' ? 'bg-blue-100 text-blue-800' :
              contract.status === 'approved' ? 'bg-green-100 text-green-800' :
              contract.status === 'sent_to_signature' ? 'bg-yellow-100 text-yellow-800' :
              contract.status === 'fully_signed' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {getStatusIcon(contract.status)}
              <div>
                <p className="font-medium">{getStatusText(contract.status)}</p>
                {contract.approved_at && (
                  <p className="text-xs">
                    {contract.status === 'approved' ? 'Aprobado' :
                     contract.status === 'sent_to_signature' ? 'Enviado a firma' : 'Completado'} el {new Date(contract.approved_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Signatures Status */}
        {signatures.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de las Firmas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {signatures.map((signature) => (
                <div key={signature.id} className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {signature.signer_type === 'owner' && <User className="h-4 w-4 text-blue-500" />}
                      {signature.signer_type === 'tenant' && <User className="h-4 w-4 text-green-500" />}
                      {signature.signer_type === 'guarantor' && <Shield className="h-4 w-4 text-orange-500" />}
                      <span className="font-medium capitalize">
                        {signature.signer_type === 'owner' ? 'Propietario' :
                         signature.signer_type === 'tenant' ? 'Arrendatario' :
                         'Aval'}
                      </span>
                    </div>
                    {getSignatureStatusIcon(signature.signature_status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{signature.signer_name}</p>
                  <p className="text-sm text-gray-500 mb-2">{signature.signer_email}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      signature.signature_status === 'signed' ? 'bg-green-100 text-green-800' :
                      signature.signature_status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getSignatureStatusText(signature.signature_status)}
                    </span>
                    {signature.signed_at && (
                      <span className="text-xs text-gray-500">
                        {new Date(signature.signed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {signature.signature_url && signature.signature_status !== 'signed' && (
                    <a
                      href={signature.signature_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
                    >
                      Ver enlace de firma →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex space-x-3">
            <CustomButton
              onClick={() => setShowCanvasViewer(true)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Ver en Canvas</span>
            </CustomButton>
            <CustomButton
              onClick={() => navigate(`/contract/${contractId}`)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Ver Contrato Completo</span>
            </CustomButton>
          </div>

          <div className="flex space-x-3">
            {contract.status === 'draft' && (
              <CustomButton
                onClick={handleApproveContract}
                disabled={processing}
                loading={processing}
                loadingText="Aprobando..."
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar y Enviar a Firma
              </CustomButton>
            )}

            {contract.status === 'approved' && (
              <CustomButton
                onClick={handleSendToSignature}
                disabled={processing}
                loading={processing}
                loadingText="Enviando..."
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar a Firma Electrónica
              </CustomButton>
            )}

            {onClose && (
              <CustomButton
                onClick={onClose}
                variant="outline"
              >
                Cerrar
              </CustomButton>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Viewer Modal */}
      {showCanvasViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
          <div className="w-full max-w-6xl max-h-[95vh] overflow-hidden bg-white rounded-lg">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-orange-600 text-white rounded-t-lg">
              <h2 className="text-xl font-bold flex items-center">
                <Eye className="h-6 w-6 mr-2" />
                Vista Previa del Contrato
              </h2>
              <button
                onClick={() => setShowCanvasViewer(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-4 max-h-[85vh] overflow-y-auto">
              <div className="border rounded-lg overflow-hidden">
                <HTMLCanvasViewer htmlString={contractHtmlContent} />
              </div>
            </div>
            <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-lg">
              <CustomButton
                onClick={() => setShowCanvasViewer(false)}
                variant="outline"
              >
                Cerrar
              </CustomButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractApprovalWorkflow;
