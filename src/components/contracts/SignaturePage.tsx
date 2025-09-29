import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, FileText, User, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { electronicSignatureService } from '../../lib/electronicSignature';
import CustomButton from '../common/CustomButton';

interface SignatureRequest {
  id: string;
  contract_id: string;
  signer_type: string;
  signer_name: string;
  signer_email: string;
  signature_status: string;
  signature_url: string;
  created_at: string;
  expires_at: string;
}

interface Contract {
  id: string;
  contract_content: any;
  applications: {
    properties: {
      title: string;
      address: string;
    };
  };
}

const SignaturePage: React.FC = () => {
  const { signatureId } = useParams<{ signatureId: string }>();
  const [signatureRequest, setSignatureRequest] = useState<SignatureRequest | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (signatureId) {
      loadSignatureData(signatureId);
    }
  }, [signatureId]);

  const loadSignatureData = async (sigId: string) => {
    try {
      setLoading(true);

      // Buscar la solicitud de firma por el ID simulado o real
      const { data: signatureData, error: sigError } = await supabase
        .from('contract_signatures')
        .select('*')
        .or(`signature_request_id.eq.${sigId},id.eq.${sigId}`)
        .single();

      if (sigError) throw sigError;
      setSignatureRequest(signatureData);

      // Cargar el contrato
      const { data: contractData, error: contractError } = await supabase
        .from('rental_contracts')
        .select(`
          id,
          contract_content,
          applications (
            properties (
              title,
              address
            )
          )
        `)
        .eq('id', signatureData.contract_id)
        .single();

      if (contractError) throw contractError;
      setContract(contractData);

    } catch (error) {
      console.error('Error loading signature data:', error);
      alert('Error al cargar los datos de firma');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureRequest) return;

    setSigning(true);
    try {
      // Simular proceso de firma
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Actualizar estado en la base de datos
      const { error } = await supabase
        .from('contract_signatures')
        .update({
          signature_status: 'signed',
          signed_at: new Date().toISOString()
        })
        .eq('id', signatureRequest.id);

      if (error) throw error;

      // Actualizar estado del contrato si todas las firmas están completas
      await checkContractCompletion(signatureRequest.contract_id);

      setSigned(true);
      setSignatureRequest(prev => prev ? {
        ...prev,
        signature_status: 'signed'
      } : null);

    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Error al firmar el contrato');
    } finally {
      setSigning(false);
    }
  };

  const checkContractCompletion = async (contractId: string) => {
    try {
      const { data: signatures, error } = await supabase
        .from('contract_signatures')
        .select('signature_status')
        .eq('contract_id', contractId);

      if (error) throw error;

      const allSigned = signatures.every(sig => sig.signature_status === 'signed');

      if (allSigned) {
        await supabase
          .from('rental_contracts')
          .update({
            status: 'fully_signed',
            updated_at: new Date().toISOString()
          })
          .eq('id', contractId);
      } else {
        const anySigned = signatures.some(sig => sig.signature_status === 'signed');
        if (anySigned) {
          await supabase
            .from('rental_contracts')
            .update({
              status: 'partially_signed',
              updated_at: new Date().toISOString()
            })
            .eq('id', contractId);
        }
      }
    } catch (error) {
      console.error('Error checking contract completion:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (!signatureRequest || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Documento no encontrado</h1>
          <p className="text-gray-600">
            El enlace de firma que estás buscando no es válido o ha expirado.
          </p>
        </div>
      </div>
    );
  }

  if (signed || signatureRequest.signature_status === 'signed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Documento Firmado!</h1>
          <p className="text-gray-600 mb-6">
            El contrato ha sido firmado exitosamente. Recibirás una copia por email.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Firmado por:</strong> {signatureRequest.signer_name}<br/>
              <strong>Fecha:</strong> {new Date().toLocaleString('es-CL')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Verificar si el enlace ha expirado
  const isExpired = signatureRequest.expires_at && new Date(signatureRequest.expires_at) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <Clock className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace Expirado</h1>
          <p className="text-gray-600">
            Este enlace de firma ha expirado. Por favor, solicita un nuevo enlace al propietario.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <FileText className="h-12 w-12 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Firma Electrónica</h1>
              <p className="text-gray-600">
                {contract.applications.properties.title} - {contract.applications.properties.address}
              </p>
            </div>
          </div>
        </div>

        {/* Signer Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Firmante</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="font-medium">{signatureRequest.signer_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-gray-500" />
              <span>{signatureRequest.signer_email}</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Tipo de firmante: {signatureRequest.signer_type === 'owner' ? 'Propietario' :
                                 signatureRequest.signer_type === 'tenant' ? 'Arrendatario' :
                                 'Aval'}
            </span>
          </div>
        </div>

        {/* Contract Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa del Contrato</h2>
          <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
            <div className="text-sm">
              {contract.contract_content?.sections?.map((section: any, index: number) => (
                <div key={index} className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{section.title}</h3>
                  <div
                    className="text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </div>
              )) || (
                <p className="text-gray-500">Contenido del contrato no disponible</p>
              )}
            </div>
          </div>
        </div>

        {/* Signature Action */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ¿Confirmas que has revisado el contrato y deseas firmarlo?
            </h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Importante:</strong> Al firmar este documento, aceptas todas las condiciones
                establecidas en el contrato de arriendo. Esta firma tiene valor legal.
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <CustomButton
                onClick={handleSign}
                disabled={signing}
                loading={signing}
                loadingText="Firmando..."
                className="bg-green-600 hover:bg-green-700 px-8 py-3"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Firmar Contrato
              </CustomButton>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Este enlace expira el {signatureRequest.expires_at ?
                new Date(signatureRequest.expires_at).toLocaleString('es-CL') :
                'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePage;
