import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Eye, AlertCircle, CheckCircle, Code, FileText } from 'lucide-react';
import CustomButton from '../common/CustomButton';
import { supabase } from '../../lib/supabase';

interface HTMLEditorProps {
  contractId: string;
  contractData: {
    id: string;
    contract_html: string | null;
    contract_number: string | null;
    status: string;
  };
  onClose: () => void;
  onSave: () => void;
}

const HTMLEditor: React.FC<HTMLEditorProps> = ({
  contractId,
  contractData,
  onClose,
  onSave
}) => {
  const [htmlContent, setHtmlContent] = useState(contractData.contract_html || '');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'html'>('visual');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Configurar el textarea para que tenga altura automática
  useEffect(() => {
    if (textareaRef.current && !showPreview) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [htmlContent, showPreview]);

  // Guardar cambios en la base de datos
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Actualizar el contrato en la base de datos
      const { error: updateError } = await supabase
        .from('rental_contracts')
        .update({
          contract_html: htmlContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (updateError) throw updateError;

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSave(); // Notificar al componente padre
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error al guardar el contrato:', err);
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlContent(e.target.value);
    // Ajustar altura automáticamente
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const insertHTMLTag = (tag: string, content?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = htmlContent.substring(start, end);
    const insertContent = content || selectedText || 'contenido';

    let replacement = '';
    switch (tag) {
      case 'bold':
        replacement = `<strong>${insertContent}</strong>`;
        break;
      case 'italic':
        replacement = `<em>${insertContent}</em>`;
        break;
      case 'underline':
        replacement = `<u>${insertContent}</u>`;
        break;
      case 'paragraph':
        replacement = `<p>${insertContent}</p>`;
        break;
      case 'heading1':
        replacement = `<h1>${insertContent}</h1>`;
        break;
      case 'heading2':
        replacement = `<h2>${insertContent}</h2>`;
        break;
      case 'heading3':
        replacement = `<h3>${insertContent}</h3>`;
        break;
      case 'list':
        replacement = `<ul>\n  <li>${insertContent}</li>\n</ul>`;
        break;
      case 'numbered-list':
        replacement = `<ol>\n  <li>${insertContent}</li>\n</ol>`;
        break;
      case 'link':
        replacement = `<a href="#">${insertContent}</a>`;
        break;
      case 'br':
        replacement = `<br>`;
        break;
      default:
        replacement = `<${tag}>${insertContent}</${tag}>`;
    }

    const newContent = htmlContent.substring(0, start) + replacement + htmlContent.substring(end);
    setHtmlContent(newContent);

    // Restaurar el foco y la selección
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatToolbar = [
    { label: 'Negrita', action: () => insertHTMLTag('bold'), icon: 'B' },
    { label: 'Cursiva', action: () => insertHTMLTag('italic'), icon: 'I' },
    { label: 'Subrayado', action: () => insertHTMLTag('underline'), icon: 'U' },
    { label: 'Párrafo', action: () => insertHTMLTag('paragraph'), icon: '¶' },
    { label: 'H1', action: () => insertHTMLTag('heading1'), icon: 'H1' },
    { label: 'H2', action: () => insertHTMLTag('heading2'), icon: 'H2' },
    { label: 'H3', action: () => insertHTMLTag('heading3'), icon: 'H3' },
    { label: 'Lista', action: () => insertHTMLTag('list'), icon: '•' },
    { label: 'Lista Num.', action: () => insertHTMLTag('numbered-list'), icon: '1.' },
    { label: 'Enlace', action: () => insertHTMLTag('link'), icon: '🔗' },
    { label: 'Salto', action: () => insertHTMLTag('br'), icon: '↵' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Code className="h-6 w-6 mr-2 text-blue-600" />
              Editor HTML del Contrato
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              ID: {contractId}
              {contractData.contract_number && ` • N° ${contractData.contract_number}`}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('visual')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'visual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-1" />
                Vista Previa
              </button>
              <button
                onClick={() => setViewMode('html')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'html'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Code className="h-4 w-4 inline mr-1" />
                HTML
              </button>
            </div>
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

        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel */}
          {viewMode === 'html' && (
            <div className="flex-1 flex flex-col border-r">
              {/* Toolbar */}
              <div className="border-b p-3 bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  {formatToolbar.map((item, index) => (
                    <button
                      key={index}
                      onClick={item.action}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors flex items-center space-x-1"
                      title={item.label}
                    >
                      <span className="font-mono font-bold">{item.icon}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Selecciona texto y haz clic en los botones para aplicar formato, o escribe HTML directamente
                </p>
              </div>

              {/* Editor */}
              <div className="flex-1 p-4 overflow-auto">
                <textarea
                  ref={textareaRef}
                  value={htmlContent}
                  onChange={handleTextareaChange}
                  className="w-full h-full border border-gray-300 rounded-lg p-4 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Escribe el HTML del contrato aquí..."
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {/* Preview Panel */}
          <div className={`flex-1 ${viewMode === 'html' ? '' : 'flex'}`}>
            <div className="h-full flex flex-col">
              {/* Preview Header */}
              <div className="border-b p-3 bg-gray-50 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Vista Previa del Contrato
                </h3>
                {viewMode === 'html' && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showPreview ? 'Ocultar' : 'Mostrar'} Vista Completa
                  </button>
                )}
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-auto">
                <div className="p-6">
                  <div
                    className="bg-white border rounded-lg p-6 shadow-sm"
                    style={{
                      fontFamily: 'Times New Roman, Times, serif',
                      lineHeight: '1.8',
                      color: '#000',
                      maxWidth: viewMode === 'html' && !showPreview ? '100%' : '800px',
                      margin: '0 auto'
                    }}
                    dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="text-gray-500 italic">Sin contenido HTML</p>' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Estado:</span> {contractData.status}
            <span className="mx-2">•</span>
            <span className="font-medium">Caracteres:</span> {htmlContent.length}
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
              disabled={saving || !htmlContent.trim()}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HTMLEditor;
