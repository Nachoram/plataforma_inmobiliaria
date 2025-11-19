import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { IDocument, DocumentType, DocumentStatus } from './types';
import {
  getDocumentTypeLabel,
  getDocumentStatusColor,
  getDocumentStatusTextColor,
  getDocumentStatusBorderColor,
  getStatusBadgeText,
  formatFileSize,
  getFileTypeIcon,
  isDocumentExpired
} from './utils';
import DocumentViewer from './DocumentViewer';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';

interface DocumentListProps {
  documents: IDocument[];
  onDelete?: (documentId: string) => void;
  onDownload?: (document: IDocument) => void;
  onView?: (document: IDocument) => void;
  onStatusChange?: (documentId: string, status: DocumentStatus) => void;
  showActions?: boolean;
  className?: string;
  emptyMessage?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDelete,
  onDownload,
  onView,
  onStatusChange,
  showActions = true,
  className = '',
  emptyMessage = 'No hay documentos para mostrar'
}) => {
  const [selectedDocument, setSelectedDocument] = useState<IDocument | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           getDocumentTypeLabel(doc.type).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchesType = typeFilter === 'all' || doc.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.uploadedAt).getTime();
          bValue = new Date(b.uploadedAt).getTime();
          break;
        case 'type':
          aValue = getDocumentTypeLabel(a.type);
          bValue = getDocumentTypeLabel(b.type);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleView = (document: IDocument) => {
    setSelectedDocument(document);
    setViewerOpen(true);
    if (onView) onView(document);
  };

  const handleDownload = (document: IDocument) => {
    // Create download link
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onDownload) onDownload(document);
    toast.success('Descarga iniciada');
  };

  const handleDelete = async (document: IDocument) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${document.name}"?`)) {
      try {
        // Here you would call your delete API
        // For now, just call the callback
        if (onDelete) {
          onDelete(document.id);
        }
        toast.success('Documento eliminado');
      } catch (error) {
        toast.error('Error al eliminar el documento');
      }
    }
  };

  const handleStatusChange = (documentId: string, newStatus: DocumentStatus) => {
    if (onStatusChange) {
      onStatusChange(documentId, newStatus);
      toast.success('Estado actualizado');
    }
  };

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (documents.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Sin documentos</h3>
        <p className="mt-1 text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="verified">Verificados</option>
              <option value="rejected">Rechazados</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DocumentType | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="applicant_id">Cédula Postulante</option>
              <option value="guarantor_id">Cédula Garante</option>
              <option value="income_proof">Comprobante Ingresos</option>
              <option value="title_study">Estudio Título</option>
              <option value="property_doc">Documento Propiedad</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            {filteredDocuments.length} de {documents.length} documentos
          </div>
        </div>

        {/* Document Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Documento</span>
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tipo</span>
                      {sortBy === 'type' && (
                        sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Estado</span>
                      {sortBy === 'status' && (
                        sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Fecha</span>
                      {sortBy === 'date' && (
                        sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  {showActions && (
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((document) => {
                  const isExpired = isDocumentExpired(document.uploadedAt, document.type);

                  return (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-lg mr-3">{getFileTypeIcon(document.name)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {document.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatFileSize(document.fileSize || 0)}
                              {isExpired && (
                                <span className="ml-2 text-red-600 font-medium">(Expirado)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getDocumentTypeLabel(document.type)}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(document.status)}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentStatusColor(document.status)} ${getDocumentStatusTextColor(document.status)} ${getDocumentStatusBorderColor(document.status)}`}>
                            {getStatusBadgeText(document.status)}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(document.uploadedAt).toLocaleDateString('es-CL')}
                      </td>

                      {showActions && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleView(document)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Ver"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDownload(document)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Descargar"
                            >
                              <Download className="h-4 w-4" />
                            </button>

                            {document.status === 'pending' && onStatusChange && (
                              <select
                                value={document.status}
                                onChange={(e) => handleStatusChange(document.id, e.target.value as DocumentStatus)}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="pending">Pendiente</option>
                                <option value="verified">Verificar</option>
                                <option value="rejected">Rechazar</option>
                              </select>
                            )}

                            {onDelete && (
                              <button
                                onClick={() => handleDelete(document)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredDocuments.length === 0 && documents.length > 0 && (
          <div className="text-center py-8">
            <Filter className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay resultados</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron documentos que coincidan con los filtros aplicados.
            </p>
            <CustomButton
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Limpiar filtros
            </CustomButton>
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </>
  );
};

export default DocumentList;




