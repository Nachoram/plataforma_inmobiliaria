import React, { useState } from 'react';
import { X, Upload, Check, FileText, User, Building, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface RentalApplicationFormProps {
  propertyId: string;
  propertyAddress: string;
  onClose: () => void;
}

interface ApplicationData {
  // Datos del Postulante
  applicant: {
    fullName: string;
    rut: string;
    profession: string;
    company: string;
    monthlyIncome: string;
    workExperience: string;
    email: string;
    phone: string;
  };
  
  // Documentos del Postulante
  applicantDocuments: {
    nationalId: File | null;
    workContract: File | null;
    paySlips: File | null;
    pensionCertificate: File | null;
    creditReport: File | null;
  };
  
  // Datos del Aval
  hasGuarantor: boolean;
  guarantor: {
    fullName: string;
    rut: string;
    monthlyIncome: string;
    email: string;
    phone: string;
  };
  
  // Documentos del Aval
  guarantorDocuments: {
    nationalId: File | null;
    paySlips: File | null;
    creditReport: File | null;
  };
  
  // Confirmación
  declarationAccepted: boolean;
}

export const RentalApplicationForm: React.FC<RentalApplicationFormProps> = ({
  propertyId,
  propertyAddress,
  onClose
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado del formulario
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    applicant: {
      fullName: '',
      rut: '',
      profession: '',
      company: '',
      monthlyIncome: '',
      workExperience: '',
      email: user?.email || '',
      phone: '',
    },
    applicantDocuments: {
      nationalId: null,
      workContract: null,
      paySlips: null,
      pensionCertificate: null,
      creditReport: null,
    },
    hasGuarantor: false,
    guarantor: {
      fullName: '',
      rut: '',
      monthlyIncome: '',
      email: '',
      phone: '',
    },
    guarantorDocuments: {
      nationalId: null,
      paySlips: null,
      creditReport: null,
    },
    declarationAccepted: false,
  });

  // Configuración de documentos requeridos
  const requiredApplicantDocuments = [
    { key: 'nationalId', label: 'Cédula de Identidad (ambos lados)', icon: <User className="h-5 w-5" /> },
    { key: 'workContract', label: 'Contrato de Trabajo Indefinido', icon: <FileText className="h-5 w-5" /> },
    { key: 'paySlips', label: 'Últimas 3 Liquidaciones de Sueldo', icon: <FileText className="h-5 w-5" /> },
    { key: 'pensionCertificate', label: 'Certificado de Cotizaciones AFP (12 meses)', icon: <Shield className="h-5 w-5" /> },
    { key: 'creditReport', label: 'Informe Comercial (ej: Equifax Platinum 360)', icon: <FileText className="h-5 w-5" /> },
  ];

  const requiredGuarantorDocuments = [
    { key: 'nationalId', label: 'Cédula de Identidad del Aval (ambos lados)', icon: <User className="h-5 w-5" /> },
    { key: 'paySlips', label: 'Últimas 3 Liquidaciones de Sueldo del Aval', icon: <FileText className="h-5 w-5" /> },
    { key: 'creditReport', label: 'Informe Comercial del Aval', icon: <FileText className="h-5 w-5" /> },
  ];

  // Manejo de archivos
  const handleFileUpload = (
    section: 'applicantDocuments' | 'guarantorDocuments',
    documentKey: string,
    file: File
  ) => {
    setApplicationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [documentKey]: file
      }
    }));
  };

  // Remover archivo
  const removeFile = (
    section: 'applicantDocuments' | 'guarantorDocuments',
    documentKey: string
  ) => {
    setApplicationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [documentKey]: null
      }
    }));
  };

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar datos del postulante
    if (!applicationData.applicant.fullName.trim()) {
      newErrors.applicantFullName = 'El nombre completo es requerido';
    }
    if (!applicationData.applicant.rut.trim()) {
      newErrors.applicantRut = 'El RUT es requerido';
    }
    if (!applicationData.applicant.profession.trim()) {
      newErrors.applicantProfession = 'La profesión u oficio es requerida';
    }
    if (!applicationData.applicant.company.trim()) {
      newErrors.applicantCompany = 'La empresa es requerida';
    }
    if (!applicationData.applicant.monthlyIncome.trim()) {
      newErrors.applicantIncome = 'La renta mensual es requerida';
    }
    if (!applicationData.applicant.workExperience.trim()) {
      newErrors.applicantExperience = 'La antigüedad laboral es requerida';
    }
    if (!applicationData.applicant.email.trim()) {
      newErrors.applicantEmail = 'El email es requerido';
    }
    if (!applicationData.applicant.phone.trim()) {
      newErrors.applicantPhone = 'El teléfono es requerido';
    }

    // Validar documentos del postulante
    requiredApplicantDocuments.forEach(doc => {
      if (!applicationData.applicantDocuments[doc.key as keyof typeof applicationData.applicantDocuments]) {
        newErrors[`applicantDoc_${doc.key}`] = 'Documento requerido';
      }
    });

    // Validar datos del aval si se presenta
    if (applicationData.hasGuarantor) {
      if (!applicationData.guarantor.fullName.trim()) {
        newErrors.guarantorFullName = 'El nombre del aval es requerido';
      }
      if (!applicationData.guarantor.rut.trim()) {
        newErrors.guarantorRut = 'El RUT del aval es requerido';
      }
      if (!applicationData.guarantor.monthlyIncome.trim()) {
        newErrors.guarantorIncome = 'La renta del aval es requerida';
      }
      if (!applicationData.guarantor.email.trim()) {
        newErrors.guarantorEmail = 'El email del aval es requerido';
      }
      if (!applicationData.guarantor.phone.trim()) {
        newErrors.guarantorPhone = 'El teléfono del aval es requerido';
      }

      // Validar documentos del aval
      requiredGuarantorDocuments.forEach(doc => {
        if (!applicationData.guarantorDocuments[doc.key as keyof typeof applicationData.guarantorDocuments]) {
          newErrors[`guarantorDoc_${doc.key}`] = 'Documento requerido';
        }
      });
    }

    // Validar declaración
    if (!applicationData.declarationAccepted) {
      newErrors.declaration = 'Debe aceptar la declaración';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Subir archivos a Supabase Storage
  const uploadFiles = async () => {
    const uploadedUrls: string[] = [];

    // Subir documentos del postulante
    for (const [key, file] of Object.entries(applicationData.applicantDocuments)) {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/applicant_${key}_${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('rental-documents')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('rental-documents')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }
    }

    // Subir documentos del aval si existe
    if (applicationData.hasGuarantor) {
      for (const [key, file] of Object.entries(applicationData.guarantorDocuments)) {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user?.id}/guarantor_${key}_${Date.now()}.${fileExt}`;

          const { data, error } = await supabase.storage
            .from('rental-documents')
            .upload(fileName, file);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('rental-documents')
            .getPublicUrl(data.path);

          uploadedUrls.push(publicUrl);
        }
      }
    }

    return uploadedUrls;
  };

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Subir archivos
      const documentUrls = await uploadFiles();

      // Preparar datos para la base de datos
      const applicationPayload = {
        property_id: propertyId,
        applicant_id: user?.id,
        message: `Postulación completa de ${applicationData.applicant.fullName}`,
        applicant_data: {
          personal: applicationData.applicant,
          hasGuarantor: applicationData.hasGuarantor,
          guarantor: applicationData.hasGuarantor ? applicationData.guarantor : null,
        },
        documents_urls: documentUrls,
      };

      const { error } = await supabase
        .from('applications')
        .insert(applicationPayload);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors({ submit: 'Error al enviar la postulación. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  // Componente para carga de archivos
  const FileUploadRow = ({ 
    document, 
    file, 
    onUpload, 
    onRemove, 
    error 
  }: {
    document: { key: string; label: string; icon: React.ReactNode };
    file: File | null;
    onUpload: (file: File) => void;
    onRemove: () => void;
    error?: string;
  }) => (
    <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
      error ? 'border-red-300 bg-red-50' : file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${
          error ? 'bg-red-100 text-red-600' : file ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {document.icon}
        </div>
        <div>
          <p className="font-medium text-gray-900">{document.label}</p>
          {file && (
            <p className="text-sm text-green-600 flex items-center">
              <Check className="h-4 w-4 mr-1" />
              {file.name}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {file ? (
          <button
            type="button"
            onClick={onRemove}
            className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            Eliminar
          </button>
        ) : (
          <label className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            Subir Archivo
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  onUpload(selectedFile);
                }
              }}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {success ? (
          // Pantalla de éxito
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Postulación Enviada Exitosamente!</h3>
            <p className="text-gray-600 mb-4">
              Tu postulación completa ha sido enviada al propietario. Te contactarán pronto para continuar con el proceso.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-50 to-green-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Postulación de Arriendo</h2>
                <p className="text-gray-600 mt-1">{propertyAddress}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Sección 1: Datos del Postulante */}
              <div className="space-y-6">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <User className="h-6 w-6 mr-2 text-emerald-600" />
                    Datos del Postulante
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationData.applicant.fullName}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, fullName: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantFullName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Juan Carlos Pérez González"
                    />
                    {errors.applicantFullName && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantFullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      RUT o Identificación Nacional *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationData.applicant.rut}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, rut: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantRut ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="12.345.678-9"
                    />
                    {errors.applicantRut && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantRut}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Profesión u Oficio *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationData.applicant.profession}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, profession: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantProfession ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ingeniero Civil"
                    />
                    {errors.applicantProfession && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantProfession}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Empresa donde trabaja *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationData.applicant.company}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, company: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantCompany ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Empresa ABC S.A."
                    />
                    {errors.applicantCompany && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantCompany}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Renta Líquida Mensual (CLP) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={applicationData.applicant.monthlyIncome}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, monthlyIncome: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantIncome ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="1500000"
                    />
                    {errors.applicantIncome && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantIncome}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Antigüedad Laboral *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationData.applicant.workExperience}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, workExperience: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantExperience ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="2 años y 6 meses"
                    />
                    {errors.applicantExperience && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantExperience}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email de Contacto *
                    </label>
                    <input
                      type="email"
                      required
                      value={applicationData.applicant.email}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, email: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantEmail ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="juan@email.com"
                    />
                    {errors.applicantEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono de Contacto *
                    </label>
                    <input
                      type="tel"
                      required
                      value={applicationData.applicant.phone}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, phone: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantPhone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="+56 9 1234 5678"
                    />
                    {errors.applicantPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección 2: Documentación del Postulante */}
              <div className="space-y-6">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <FileText className="h-6 w-6 mr-2 text-emerald-600" />
                    Documentación del Postulante
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Todos los documentos son requeridos para procesar tu postulación
                  </p>
                </div>

                <div className="space-y-4">
                  {requiredApplicantDocuments.map((document) => (
                    <FileUploadRow
                      key={document.key}
                      document={document}
                      file={applicationData.applicantDocuments[document.key as keyof typeof applicationData.applicantDocuments]}
                      onUpload={(file) => handleFileUpload('applicantDocuments', document.key, file)}
                      onRemove={() => removeFile('applicantDocuments', document.key)}
                      error={errors[`applicantDoc_${document.key}`]}
                    />
                  ))}
                </div>
              </div>

              {/* Sección 3: Datos del Aval o Codeudor */}
              <div className="space-y-6">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <Shield className="h-6 w-6 mr-2 text-emerald-600" />
                    Aval o Codeudor
                  </h3>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="hasGuarantor"
                    checked={applicationData.hasGuarantor}
                    onChange={(e) => setApplicationData(prev => ({
                      ...prev,
                      hasGuarantor: e.target.checked,
                      guarantor: e.target.checked ? prev.guarantor : {
                        fullName: '',
                        rut: '',
                        monthlyIncome: '',
                        email: '',
                        phone: '',
                      }
                    }))}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="hasGuarantor" className="text-sm font-medium text-gray-700">
                    Presentaré un Aval o Codeudor
                  </label>
                </div>

                {/* Formulario condicional del aval */}
                {applicationData.hasGuarantor && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre Completo del Aval *
                      </label>
                      <input
                        type="text"
                        required={applicationData.hasGuarantor}
                        value={applicationData.guarantor.fullName}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          guarantor: { ...prev.guarantor, fullName: e.target.value }
                        }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                          errors.guarantorFullName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="María Elena González"
                      />
                      {errors.guarantorFullName && (
                        <p className="mt-1 text-sm text-red-600">{errors.guarantorFullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        RUT o Identificación Nacional del Aval *
                      </label>
                      <input
                        type="text"
                        required={applicationData.hasGuarantor}
                        value={applicationData.guarantor.rut}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          guarantor: { ...prev.guarantor, rut: e.target.value }
                        }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                          errors.guarantorRut ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="98.765.432-1"
                      />
                      {errors.guarantorRut && (
                        <p className="mt-1 text-sm text-red-600">{errors.guarantorRut}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Renta Líquida Mensual del Aval (CLP) *
                      </label>
                      <input
                        type="number"
                        required={applicationData.hasGuarantor}
                        min="0"
                        value={applicationData.guarantor.monthlyIncome}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          guarantor: { ...prev.guarantor, monthlyIncome: e.target.value }
                        }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                          errors.guarantorIncome ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="2000000"
                      />
                      {errors.guarantorIncome && (
                        <p className="mt-1 text-sm text-red-600">{errors.guarantorIncome}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email de Contacto del Aval *
                      </label>
                      <input
                        type="email"
                        required={applicationData.hasGuarantor}
                        value={applicationData.guarantor.email}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          guarantor: { ...prev.guarantor, email: e.target.value }
                        }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                          errors.guarantorEmail ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="maria@email.com"
                      />
                      {errors.guarantorEmail && (
                        <p className="mt-1 text-sm text-red-600">{errors.guarantorEmail}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Teléfono de Contacto del Aval *
                      </label>
                      <input
                        type="tel"
                        required={applicationData.hasGuarantor}
                        value={applicationData.guarantor.phone}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          guarantor: { ...prev.guarantor, phone: e.target.value }
                        }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                          errors.guarantorPhone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="+56 9 8765 4321"
                      />
                      {errors.guarantorPhone && (
                        <p className="mt-1 text-sm text-red-600">{errors.guarantorPhone}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 4: Documentación del Aval */}
              {applicationData.hasGuarantor && (
                <div className="space-y-6">
                  <div className="border-b pb-2">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <FileText className="h-6 w-6 mr-2 text-emerald-600" />
                      Documentación del Aval
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Documentos requeridos del aval o codeudor
                    </p>
                  </div>

                  <div className="space-y-4">
                    {requiredGuarantorDocuments.map((document) => (
                      <FileUploadRow
                        key={document.key}
                        document={document}
                        file={applicationData.guarantorDocuments[document.key as keyof typeof applicationData.guarantorDocuments]}
                        onUpload={(file) => handleFileUpload('guarantorDocuments', document.key, file)}
                        onRemove={() => removeFile('guarantorDocuments', document.key)}
                        error={errors[`guarantorDoc_${document.key}`]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sección 5: Confirmación */}
              <div className="space-y-6">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <Check className="h-6 w-6 mr-2 text-emerald-600" />
                    Confirmación
                  </h3>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="declaration"
                      checked={applicationData.declarationAccepted}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        declarationAccepted: e.target.checked
                      }))}
                      className={`w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5 ${
                        errors.declaration ? 'border-red-500' : ''
                      }`}
                    />
                    <div>
                      <label htmlFor="declaration" className="text-sm font-medium text-blue-900">
                        Declaro que toda la información y los documentos presentados son verídicos *
                      </label>
                      <p className="text-xs text-blue-700 mt-1">
                        Al marcar esta casilla, confirmo que he proporcionado información veraz y completa, 
                        y entiendo que cualquier falsedad puede resultar en el rechazo de mi postulación.
                      </p>
                      {errors.declaration && (
                        <p className="mt-1 text-sm text-red-600">{errors.declaration}</p>
                      )}
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Enviando Postulación...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Enviar Postulación</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};