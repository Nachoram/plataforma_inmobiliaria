import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HTMLCanvasViewer, HTMLCanvasViewerRef } from '../common/HTMLCanvasViewer';
import HTMLContractViewer from './HTMLContractViewer';
import ContractEditor from './ContractEditor';
import ContractCanvasEditor from './ContractCanvasEditor';
import { supabase } from '../../lib/supabase';
import CustomButton from '../common/CustomButton';
import {
  FileText,
  Download,
  Printer,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileDown,
  Edit3
} from 'lucide-react';

interface ContractViewerProps {
  contractId: string;
  onClose?: () => void;
  showActions?: boolean;
}

interface ContractData {
  id: string;
  contract_content: any;
  contract_html: string | null;
  contract_format: string;
  contract_number: string | null;
  status: string;
  applications: {
    id: string;
    snapshot_applicant_first_name: string;
    snapshot_applicant_paternal_last_name: string;
    properties: {
      description: string;
      address_street: string;
      address_number: string;
      address_department: string | null;
      address_commune: string;
      address_region: string;
    };
  };
}

const ContractViewer: React.FC<ContractViewerProps> = ({
  contractId,
  onClose,
  showActions = true
}) => {
  const canvasRef = useRef<HTMLCanvasViewerRef>(null);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const loadContract = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: contractData, error: contractError } = await supabase
        .from('rental_contracts')
        .select(`
          id,
          contract_content,
          contract_html,
          contract_format,
          contract_number,
          status,
          applications (
            id,
            snapshot_applicant_first_name,
            snapshot_applicant_paternal_last_name,
            properties (
              description,
              address_street,
              address_number,
              address_department,
              address_commune,
              address_region
            )
          )
        `)
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      setContract(contractData);

      // Priorizar contract_content (JSONB) sobre contract_html para optimización
      if (contractData.contract_content) {
        // Generar HTML desde JSONB optimizado
        const html = generateContractHTMLFromJSONB(contractData);
        setHtmlContent(html);
      } else if (contractData.contract_html) {
        // Fallback para contratos antiguos que solo tienen HTML
        setHtmlContent(contractData.contract_html);
      } else {
        setHtmlContent('<div class="text-center p-8 text-gray-500">Contenido del contrato no disponible</div>');
      }

    } catch (err: any) {
      console.error('Error loading contract:', err);
      setError(err.message || 'Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadContract();
  }, [contractId, loadContract]);

  // Función para procesar y justificar contenido HTML
  const processContentForJustification = (content: string): string => {
    if (!content) return '';
    
    // Si el contenido ya tiene etiquetas HTML, procesarlo
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Aplicar estilos de justificación a todos los elementos
    const elements = tempDiv.querySelectorAll('*');
    elements.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      // No aplicar a títulos ni elementos que deban estar centrados
      if (!htmlEl.classList.contains('header') && 
          !htmlEl.classList.contains('contract-title') && 
          !htmlEl.classList.contains('section-title')) {
        htmlEl.style.textAlign = 'justify';
      }
    });
    
    // Si es solo texto plano, envolverlo en un párrafo justificado
    if (!content.includes('<')) {
      return `<p style="text-align: justify !important; line-height: 1.9;">${content}</p>`;
    }
    
    return tempDiv.innerHTML;
  };

  const generateContractHTMLFromJSONB = (contract: ContractData): string => {
    if (!contract.contract_content) {
      return '<div class="text-center p-8 text-gray-500">Contenido del contrato no disponible</div>';
    }

    const data = contract.contract_content;

    let html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contrato de Arriendo - ${data.arrendatario?.nombre || 'Cliente'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12px;
              line-height: 1.6;
              color: #000;
              background: white;
              padding: 40px 60px;
              max-width: 210mm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #000;
            }
            .contract-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .contract-subtitle {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 15px;
              text-transform: uppercase;
            }
            .contract-date {
              font-size: 12px;
              margin-bottom: 10px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
              text-transform: uppercase;
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
            }
            .party-section {
              margin-bottom: 25px;
            }
            .party-title {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .party-content {
              font-size: 12px;
              line-height: 1.6;
              margin-left: 20px;
            }
            .clause {
              margin-bottom: 18px;
            }
            .clause-title {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .clause-content {
              font-size: 12px;
              line-height: 1.6;
              text-align: justify;
              text-justify: inter-word;
            }
            .signatures {
              margin-top: 60px;
              border-top: 1px solid #000;
              padding-top: 40px;
            }
            .signatures-text {
              font-size: 12px;
              line-height: 1.6;
              text-align: justify;
              margin-bottom: 40px;
            }
            .signatures-boxes {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .signature-box {
              flex: 1;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-bottom: 5px;
              padding-top: 20px;
            }
            .signature-label {
              font-weight: bold;
              font-size: 11px;
              text-transform: uppercase;
            }
            .signature-name {
              font-size: 11px;
              margin-top: 5px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            @media print {
              body {
                padding: 30px 40px;
                font-size: 11px;
              }
              .contract-title { font-size: 16px; }
              .section-title { font-size: 12px; }
            }
          </style>
        </head>
        <body>
    `;

    // Header
    html += `
      <div class="header">
        <div class="contract-title">CONTRATO DE ARRENDAMIENTO</div>
        <div class="contract-subtitle">DE BIEN RAÍZ URBANO</div>
        <div class="contract-date">Santiago, ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
    `;

    // Partes contratantes
    html += `<div class="section"><div class="section-title">PARTES CONTRATANTES</div>`;

    if (data.arrendador) {
      html += `
        <div class="party-section">
          <div class="party-title">arrendador:</div>
          <div class="party-content">
            ${data.arrendador.nombre || '[Nombre]'}, RUT ${data.arrendador.rut || '[RUT]'},<br>
            Domiciliado en ${data.arrendador.domicilio || '[Domicilio]'}
          </div>
        </div>
      `;
    }

    if (data.arrendatario) {
      html += `
        <div class="party-section">
          <div class="party-title">arrendatario:</div>
          <div class="party-content">
            ${data.arrendatario.nombre || '[Nombre]'}, RUT ${data.arrendatario.rut || '[RUT]'},<br>
            Domiciliado en ${data.arrendatario.domicilio || '[Domicilio]'}
          </div>
        </div>
      `;
    }

    if (data.aval && data.aval.nombre) {
      html += `
        <div class="party-section">
          <div class="party-title">codeudor solidario (aval):</div>
          <div class="party-content">
            ${data.aval.nombre}, RUT ${data.aval.rut},<br>
            Domiciliado en ${data.aval.domicilio}
          </div>
        </div>
      `;
    }

    html += `</div>`;

    // Cláusulas
    if (data.clausulas && data.clausulas.length > 0) {
      data.clausulas.forEach((clause: any, index: number) => {
        html += `
          <div class="clause">
            <div class="clause-title">${clause.titulo || `CLÁUSULA ${index + 1}`}:</div>
            <div class="clause-content">${clause.contenido || ''}</div>
          </div>
        `;
      });
    }

    // Firmas
    html += `
      <div class="signatures">
        <div class="signatures-text">
          En comprobante de lo pactado, se firma el presente contrato en dos ejemplares de igual tenor y fecha,
          declarando las partes haber leído y aceptado todas y cada una de las cláusulas del presente instrumento.
        </div>

        <div class="signatures-boxes">
          <div class="signature-box">
            <div class="signature-line">
              <div class="signature-label">arrendador</div>
              <div class="signature-name">${data.arrendador?.nombre || '[Nombre]'}</div>
            </div>
          </div>

          <div class="signature-box">
            <div class="signature-line">
              <div class="signature-label">arrendatario</div>
              <div class="signature-name">${data.arrendatario?.nombre || '[Nombre]'}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Footer
    html += `
      <div class="footer">
        <div>Documento generado electrónicamente - ID: ${contract.id}</div>
        <div>Este contrato se rige por la Ley N° 18.101 sobre Arrendamiento de Bienes Raíces Urbanos</div>
      </div>
    `;

    html += `
        </body>
      </html>
    `;

    return html;
  };

  const generateContractHTML = (contract: ContractData): string => {
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
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Times New Roman', Times, serif;
              line-height: 1.8;
              color: #000;
              background: white;
              padding: 60px 100px;
              max-width: 210mm;
              margin: 0 auto;
              font-size: 14px;
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 25px;
              border-bottom: 3px double #000;
            }
            
            .contract-title {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 2px;
              line-height: 1.4;
            }
            
            .contract-number {
              font-size: 14px;
              color: #333;
              margin-top: 10px;
              font-weight: bold;
            }
            
            .contract-date {
              font-size: 13px;
              color: #555;
              margin-top: 8px;
              font-style: italic;
            }
            
            .section {
              margin-bottom: 35px;
              page-break-inside: avoid;
            }
            
            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 18px;
              text-transform: uppercase;
              color: #000;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              letter-spacing: 1px;
            }
            
            .section-content {
              text-align: justify;
              line-height: 1.9;
              margin-bottom: 15px;
            }
            
            .clause {
              margin-bottom: 20px;
              text-align: justify;
            }
            
            .clause-title {
              font-weight: bold;
              text-decoration: underline;
              margin-bottom: 8px;
              display: block;
            }
            
            .party-box {
              border: 2px solid #000;
              padding: 20px;
              margin: 20px 0;
              background: #f9f9f9;
            }
            
            .party-header {
              font-weight: bold;
              font-size: 15px;
              text-transform: uppercase;
              margin-bottom: 12px;
              text-decoration: underline;
            }
            
            .party-details {
              line-height: 1.8;
              padding-left: 10px;
            }
            
            .party-details p {
              margin-bottom: 6px;
            }
            
            .property-box {
              border: 2px solid #000;
              padding: 20px;
              margin: 20px 0;
              background: #f5f5f5;
            }
            
            .info-row {
              display: flex;
              margin-bottom: 8px;
            }
            
            .info-label {
              font-weight: bold;
              min-width: 150px;
            }
            
            .info-value {
              flex: 1;
            }
            
            .numbered-list {
              counter-reset: clause-counter;
              list-style: none;
              padding-left: 0;
            }
            
            .numbered-list li {
              counter-increment: clause-counter;
              margin-bottom: 15px;
              text-align: justify;
              padding-left: 35px;
              position: relative;
            }
            
            .numbered-list li:before {
              content: counter(clause-counter) ".";
              font-weight: bold;
              position: absolute;
              left: 0;
            }
            
            .signature-section {
              margin-top: 80px;
              page-break-inside: avoid;
            }
            
            .signature-boxes {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              gap: 40px;
            }
            
            .signature-box {
              flex: 1;
              text-align: center;
            }
            
            .signature-line {
              border-top: 2px solid #000;
              margin-bottom: 10px;
              padding-top: 10px;
            }
            
            .signature-label {
              font-weight: bold;
              text-transform: uppercase;
              font-size: 12px;
              margin-bottom: 6px;
            }
            
            .signature-name {
              font-size: 13px;
              margin-bottom: 4px;
            }
            
            .signature-rut {
              font-size: 12px;
              color: #555;
            }
            
            .contract-footer {
              margin-top: 60px;
              padding-top: 25px;
              border-top: 2px solid #ccc;
              text-align: center;
              font-size: 11px;
              color: #666;
              page-break-inside: avoid;
            }
            
            .footer-line {
              margin-bottom: 5px;
            }
            
            p {
              margin-bottom: 12px;
              text-align: justify !important;
            }
            
            div:not(.header):not(.contract-title):not(.contract-number):not(.contract-date):not(.section-title):not(.signature-section):not(.signature-boxes):not(.signature-box):not(.signature-line):not(.contract-footer):not(.party-header) {
              text-align: justify !important;
            }
            
            span, label, td {
              text-align: justify !important;
            }
            
            ul, ol {
              text-align: justify !important;
            }
            
            li {
              text-align: justify !important;
            }
            
            strong {
              font-weight: bold;
            }
            
            .text-center {
              text-align: center !important;
            }
            
            .text-uppercase {
              text-transform: uppercase;
            }
            
            .emphasis {
              font-style: italic;
              font-weight: bold;
            }
            
            @media print {
              body {
                padding: 40px 60px;
                font-size: 12px;
              }
              
              .contract-title {
                font-size: 18px;
              }
              
              .section-title {
                font-size: 14px;
              }
            }
          </style>
        </head>
        <body>
    `;

    // Header - Título del contrato
    html += `
      <div class="header">
        <div class="contract-title">CONTRATO DE ARRENDAMIENTO<br>DE BIEN RAÍZ URBANO</div>
        ${contract.contract_number ? `<div class="contract-number">N° ${contract.contract_number}</div>` : ''}
        <div class="contract-date">Santiago, Chile - ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
    `;

    // Parties - Partes del Contrato
    const partiesSection = sections.find((s: any) => s.id === 'parties');
    if (partiesSection) {
      html += `
        <div class="section">
          <div class="section-title">I. COMPARECIENTES</div>
          <div class="section-content" style="text-align: justify !important;">
            ${processContentForJustification(partiesSection.content)}
          </div>
        </div>
      `;
    } else {
      // Generar sección de partes si no existe
      html += `
        <div class="section">
          <div class="section-title">I. COMPARECIENTES</div>
          <div class="party-box">
            <div class="party-header">ARRENDADOR</div>
            <div class="party-details">
              <p><strong>Nombre:</strong> [Nombre del Arrendador]</p>
              <p><strong>RUT:</strong> [RUT del Arrendador]</p>
              <p><strong>Domicilio:</strong> [Domicilio del Arrendador]</p>
            </div>
          </div>
          <div class="party-box">
            <div class="party-header">ARRENDATARIO</div>
            <div class="party-details">
              <p><strong>Nombre:</strong> ${contract.applications.snapshot_applicant_first_name} ${contract.applications.snapshot_applicant_paternal_last_name}</p>
              <p><strong>Domicilio:</strong> ${fullAddress}</p>
            </div>
          </div>
        </div>
      `;
    }

    // Property - Bien Arrendado
    const propertySection = sections.find((s: any) => s.id === 'property');
    html += `
      <div class="section">
        <div class="section-title">II. BIEN ARRENDADO</div>
        <div class="property-box">
          <div class="info-row">
            <div class="info-label">Dirección:</div>
            <div class="info-value">${fullAddress}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Comuna:</div>
            <div class="info-value">${property.address_commune}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Región:</div>
            <div class="info-value">${property.address_region}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Tipo de Inmueble:</div>
            <div class="info-value">${property.description || 'Propiedad residencial'}</div>
          </div>
        </div>
        ${propertySection ? `<div class="section-content" style="text-align: justify !important;">${processContentForJustification(propertySection.content)}</div>` : ''}
      </div>
    `;

    // Conditions - Condiciones
    const conditionsSection = sections.find((s: any) => s.id === 'conditions');
    if (conditionsSection) {
      html += `
        <div class="section">
          <div class="section-title">III. ${conditionsSection.title || 'CONDICIONES DEL ARRENDAMIENTO'}</div>
          <div class="section-content" style="text-align: justify !important;">
            ${processContentForJustification(conditionsSection.content)}
          </div>
        </div>
      `;
    }

    // Obligations - Obligaciones
    const obligationsSection = sections.find((s: any) => s.id === 'obligations');
    if (obligationsSection) {
      html += `
        <div class="section">
          <div class="section-title">IV. ${obligationsSection.title || 'OBLIGACIONES DE LAS PARTES'}</div>
          <div class="section-content" style="text-align: justify !important;">
            ${processContentForJustification(obligationsSection.content)}
          </div>
        </div>
      `;
    }

    // Termination - Término
    const terminationSection = sections.find((s: any) => s.id === 'termination');
    if (terminationSection) {
      html += `
        <div class="section">
          <div class="section-title">V. ${terminationSection.title || 'TÉRMINO DEL CONTRATO'}</div>
          <div class="section-content" style="text-align: justify !important;">
            ${processContentForJustification(terminationSection.content)}
          </div>
        </div>
      `;
    }

    // Legal - Disposiciones Legales
    const legalSection = sections.find((s: any) => s.id === 'legal');
    if (legalSection) {
      html += `
        <div class="section">
          <div class="section-title">VI. ${legalSection.title || 'DISPOSICIONES LEGALES'}</div>
          <div class="section-content" style="text-align: justify !important;">
            ${processContentForJustification(legalSection.content)}
          </div>
        </div>
      `;
    }

    // Signatures - Firmas
    html += `
      <div class="signature-section">
        <div class="section-title text-center">FIRMAS</div>
        <p style="text-align: justify !important; margin-bottom: 30px; line-height: 1.9;">
          En comprobante de lo pactado, se firma el presente contrato en dos ejemplares de igual tenor y fecha, 
          declarando las partes haber leído y aceptado todas y cada una de las cláusulas del presente instrumento.
        </p>
        <div class="signature-boxes">
          <div class="signature-box">
            <div class="signature-line">
              <div class="signature-label">ARRENDADOR</div>
              <div class="signature-name">[Nombre]</div>
              <div class="signature-rut">[RUT]</div>
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-line">
              <div class="signature-label">ARRENDATARIO</div>
              <div class="signature-name">${contract.applications.snapshot_applicant_first_name} ${contract.applications.snapshot_applicant_paternal_last_name}</div>
              <div class="signature-rut">[RUT]</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Footer
    html += `
      <div class="contract-footer">
        <div class="footer-line"><strong>DOCUMENTO GENERADO ELECTRÓNICAMENTE</strong></div>
        <div class="footer-line">ID del Contrato: ${contract.id}</div>
        <div class="footer-line">Fecha de Generación: ${new Date().toLocaleDateString('es-CL')}</div>
        <div class="footer-line">Estado: ${getStatusText(contract.status)}</div>
        <div class="footer-line" style="margin-top: 10px; font-style: italic;">
          Este contrato se rige por la Ley N° 18.101 sobre Arrendamiento de Bienes Raíces Urbanos
        </div>
      </div>
    `;

    html += `
        </body>
      </html>
    `;

    return html;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'approved': return 'Aprobado';
      case 'sent_to_signature': return 'Enviado a Firma';
      case 'partially_signed': return 'Parcialmente Firmado';
      case 'fully_signed': return 'Completamente Firmado';
      default: return 'Desconocido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-5 w-5 text-gray-500" />;
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'sent_to_signature': return <FileText className="h-5 w-5 text-blue-500" />;
      case 'partially_signed': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'fully_signed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrato-${contract?.applications?.snapshot_applicant_first_name}-${contract?.applications?.snapshot_applicant_paternal_last_name}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!canvasRef.current || !contract) return;
    
    setIsDownloadingPDF(true);
    try {
      const filename = `contrato-${contract.applications.snapshot_applicant_first_name}-${contract.applications.snapshot_applicant_paternal_last_name}`;
      await canvasRef.current.downloadPDF(filename);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleEditorSave = () => {
    // Recargar el contrato después de guardar
    loadContract();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-red-50 rounded-lg max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar contrato</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <CustomButton onClick={loadContract} variant="outline">
            Reintentar
          </CustomButton>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Contrato no encontrado</p>
        </div>
      </div>
    );
  }

  // Determinar el tipo de editor basado en la estructura del contract_content
  const getEditorType = (contract: any) => {
    if (!contract.contract_content) return 'html';

    // Si tiene la estructura optimizada (arrendador, arrendatario, aval, clausulas)
    if (contract.contract_content.arrendador ||
        contract.contract_content.arrendatario ||
        contract.contract_content.aval ||
        contract.contract_content.clausulas) {
      return 'canvas';
    }

    // Si tiene sections (formato antiguo estructurado)
    if (contract.contract_content.sections) {
      return 'editor';
    }

    // Si solo tiene contract_html (contratos antiguos)
    if (contract.contract_html) {
      return 'html';
    }

    return 'canvas'; // Default para contratos nuevos
  };

  const editorType = getEditorType(contract);

  // Usar HTMLContractViewer solo para contratos que solo tienen HTML
  if (editorType === 'html') {
    return (
      <HTMLContractViewer
        htmlContent={contract.contract_html}
        contractNumber={contract.contract_number || contract.id}
        contractId={contract.id}
        contractData={contract}
        onClose={onClose}
        onSave={handleEditorSave}
        showActions={showActions}
      />
    );
  }

  // Renderizado para contratos con contract_content (JSONB) - flujo optimizado
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-4">
              {onClose && (
                <CustomButton
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver</span>
                </CustomButton>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-blue-600" />
                  Visualización del Contrato
                </h1>
                <p className="text-gray-600 mt-1">
                  {contract.applications.properties.description || `Propiedad en ${contract.applications.properties.address_commune}`} - {contract.applications.snapshot_applicant_first_name} {contract.applications.snapshot_applicant_paternal_last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(contract.status)}`}>
                {getStatusIcon(contract.status)}
                <span>{getStatusText(contract.status)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">ID:</span> {contract.id}
                  <span className="mx-2">•</span>
                  <span className="font-medium">Generado:</span> {new Date().toLocaleDateString('es-CL')}
                </div>
                <div className="flex space-x-3">
                  <CustomButton
                    onClick={() => setShowEditor(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Editar</span>
                  </CustomButton>
                  <CustomButton
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimir</span>
                  </CustomButton>
                  <CustomButton
                    onClick={handleDownloadPDF}
                    variant="primary"
                    size="sm"
                    className="flex items-center space-x-2"
                    disabled={isDownloadingPDF}
                  >
                    <FileDown className="h-4 w-4" />
                    <span>{isDownloadingPDF ? 'Generando PDF...' : 'Descargar PDF'}</span>
                  </CustomButton>
                  <CustomButton
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Descargar HTML</span>
                  </CustomButton>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contract Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border rounded-lg overflow-hidden">
            <HTMLCanvasViewer ref={canvasRef} htmlString={htmlContent} />
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {showEditor && contract && (
        <>
          {editorType === 'canvas' ? (
            <ContractCanvasEditor
              contractId={contractId}
              contractData={contract}
              onClose={() => setShowEditor(false)}
              onSave={handleEditorSave}
            />
          ) : (
            <ContractEditor
              contractId={contractId}
              contractData={contract}
              onClose={() => setShowEditor(false)}
              onSave={handleEditorSave}
            />
          )}
        </>
      )}
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'approved': return 'bg-green-100 text-green-800';
    case 'sent_to_signature': return 'bg-blue-100 text-blue-800';
    case 'partially_signed': return 'bg-yellow-100 text-yellow-800';
    case 'fully_signed': return 'bg-purple-100 text-purple-800';
    default: return 'bg-red-100 text-red-800';
  }
};

export default ContractViewer;
