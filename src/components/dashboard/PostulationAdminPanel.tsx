import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import PostulationCard from './PostulationCard';
import PostulationDetailDrawer from './PostulationDetailDrawer';

// ========================================================================
// INTERFACES & TYPES
// ========================================================================

interface FilterState {
  status: string[];
  scoreRange: [number, number];
  dateRange: [string, string];
  hasContract: boolean | null;
}

const PostulationAdminPanel: React.FC = () => {
  const navigate = useNavigate();

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [postulations, setPostulations] = useState<Postulation[]>([]);
  const [filteredPostulations, setFilteredPostulations] = useState<Postulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPostulation, setSelectedPostulation] = useState<Postulation | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    scoreRange: [0, 1000],
    dateRange: ['', ''],
    hasContract: null
  });

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  useEffect(() => {
    fetchPostulations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [postulations, searchTerm, filters]);

  const fetchPostulations = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual Supabase query
      const mockPostulations: Postulation[] = [
        {
          id: 1,
          applicationId: 'bde831fe-1234-5678-9abc-def012345678',
          propertyId: 'prop-001',
          name: 'Juan Pérez González',
          date: '2025-11-12',
          score: 750,
          status: 'Aprobado',
          profile: {
            email: 'juan@email.com',
            phone: '+56912345678',
            income: 15000000,
            employment: 'Ingeniero'
          },
          guarantor: {
            name: 'María González',
            email: 'maria@email.com',
            phone: '+56987654321',
            income: 13900000
          },
          propertyTitle: 'Calle de Prueba Venta',
          propertyLocation: 'Santiago, Metropolitana',
          hasContractConditions: true,
          hasContract: true,
          contractSigned: false,
          modificationCount: 2,
          auditLogCount: 5
        },
        {
          id: 2,
          applicationId: 'abc123fe-5678-9abc-def0-123456789012',
          propertyId: 'prop-002',
          name: 'Ana López Martínez',
          date: '2025-11-10',
          score: 680,
          status: 'En Revisión',
          profile: {
            email: 'ana@email.com',
            phone: '+56923456789',
            income: 12000000,
            employment: 'Profesora'
          },
          guarantor: null,
          propertyTitle: 'Av. Providencia 123',
          propertyLocation: 'Providencia, Metropolitana',
          hasContractConditions: false,
          hasContract: false,
          contractSigned: false,
          modificationCount: 0,
          auditLogCount: 2
        },
        {
          id: 3,
          applicationId: 'xyz789fe-9abc-def0-1234-567890123456',
          propertyId: 'prop-003',
          name: 'Carlos Rodríguez Silva',
          date: '2025-11-08',
          score: 590,
          status: 'Rechazado',
          profile: {
            email: 'carlos@email.com',
            phone: '+56934567890',
            income: 9500000,
            employment: 'Técnico'
          },
          guarantor: {
            name: 'Pedro Rodríguez',
            email: 'pedro@email.com',
            phone: '+56945678901',
            income: 11000000
          },
          propertyTitle: 'Pje. Las Flores 456',
          propertyLocation: 'Las Condes, Metropolitana',
          hasContractConditions: false,
          hasContract: false,
          contractSigned: false,
          modificationCount: 1,
          auditLogCount: 3
        }
      ];

      setPostulations(mockPostulations);
    } catch (error) {
      console.error('Error fetching postulations:', error);
      toast.error('Error al cargar las postulaciones');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // FILTERING & SEARCH
  // ========================================================================

  const applyFilters = () => {
    let filtered = [...postulations];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.profile.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(post => filters.status.includes(post.status));
    }

    // Score range filter
    filtered = filtered.filter(post =>
      post.score >= filters.scoreRange[0] && post.score <= filters.scoreRange[1]
    );

    // Contract filter
    if (filters.hasContract !== null) {
      filtered = filtered.filter(post => post.hasContract === filters.hasContract);
    }

    setFilteredPostulations(filtered);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 1000) count++;
    if (filters.dateRange[0] || filters.dateRange[1]) count++;
    if (filters.hasContract !== null) count++;
    return count;
  };

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  const handleBack = () => {
    navigate(-1);
  };

  const handlePostulationClick = (postulation: Postulation) => {
    setSelectedPostulation(postulation);
    setShowDetailDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDetailDrawer(false);
    setSelectedPostulation(null);
  };


  // ========================================================================
  // RENDER COMPONENTS
  // ========================================================================

  const renderMobileHeader = () => (
    <header className="flex items-center justify-between h-14 bg-white border-b px-4 py-2 md:hidden">
      <button
        onClick={handleBack}
        className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
        aria-label="Volver"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-lg font-bold text-gray-900">Postulaciones</h1>
      <button
        className="p-2 -mr-2 text-gray-600 hover:text-gray-800"
        aria-label="Menú"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
    </header>
  );

  const renderToolbar = () => (
    <div className="flex gap-2 p-4 border-b bg-white">
      <button
        onClick={() => setShowFiltersModal(true)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
      >
        <Filter className="w-4 h-4" />
        <span>Filtro</span>
        {getActiveFiltersCount() > 0 && (
          <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {getActiveFiltersCount()}
          </span>
        )}
      </button>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por ID, nombre, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );


  const renderDesktopTable = () => (
    <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propiedad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Postulante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPostulations.map((postulation) => (
              <tr key={postulation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  #{postulation.applicationId.slice(-8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{postulation.propertyTitle}</div>
                  <div className="text-sm text-gray-500">{postulation.propertyLocation}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{postulation.name}</div>
                  <div className="text-sm text-gray-500">{postulation.profile.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(postulation.status)}
                    <span className="text-sm text-gray-900">{postulation.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {postulation.score}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(postulation.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handlePostulationClick(postulation)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Ver detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFiltersModal = () => (
    <div className={`fixed inset-0 z-50 md:hidden ${showFiltersModal ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowFiltersModal(false)} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Filtros</h3>
          <button
            onClick={() => setShowFiltersModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <div className="space-y-2">
              {['En Revisión', 'Aprobado', 'Rechazado', 'Info Solicitada', 'Con Contrato Firmado', 'Anulada', 'Modificada'].map((status) => (
                <label key={status} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters(prev => ({ ...prev, status: [...prev.status, status] }));
                      } else {
                        setFilters(prev => ({ ...prev, status: prev.status.filter(s => s !== status) }));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Score range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score: {filters.scoreRange[0]} - {filters.scoreRange[1]}
            </label>
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="1000"
                value={filters.scoreRange[0]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  scoreRange: [parseInt(e.target.value), prev.scoreRange[1]]
                }))}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="1000"
                value={filters.scoreRange[1]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  scoreRange: [prev.scoreRange[0], parseInt(e.target.value)]
                }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Contract filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contrato</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="contract"
                  checked={filters.hasContract === null}
                  onChange={() => setFilters(prev => ({ ...prev, hasContract: null }))}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Todos</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="contract"
                  checked={filters.hasContract === true}
                  onChange={() => setFilters(prev => ({ ...prev, hasContract: true }))}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Con contrato</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="contract"
                  checked={filters.hasContract === false}
                  onChange={() => setFilters(prev => ({ ...prev, hasContract: false }))}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Sin contrato</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={() => {
              setFilters({
                status: [],
                scoreRange: [0, 1000],
                dateRange: ['', ''],
                hasContract: null
              });
            }}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Limpiar
          </button>
          <button
            onClick={() => setShowFiltersModal(false)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );


  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando postulaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {renderMobileHeader()}

      {/* Desktop Header */}
      <div className="hidden md:block bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Postulaciones</h1>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {renderToolbar()}

      {/* Content */}
      <div className="p-4 md:p-6">
        {/* Mobile Cards */}
        <div className="md:hidden">
          {filteredPostulations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron postulaciones</p>
            </div>
          ) : (
            filteredPostulations.map((postulation) => (
              <PostulationCard
                key={postulation.id}
                postulation={{
                  id: postulation.applicationId,
                  status: postulation.status,
                  score: postulation.score,
                  created_at: postulation.date,
                  property: {
                    title: postulation.propertyTitle || 'Propiedad',
                    city: postulation.propertyLocation?.split(',')[0] || 'Ciudad',
                    region: postulation.propertyLocation?.split(',')[1]?.trim() || 'Región'
                  },
                  applicant: {
                    name: postulation.name,
                    email: postulation.profile.email
                  }
                }}
                onSelect={handlePostulationClick}
                isSelected={selectedPostulation?.id === postulation.id}
              />
            ))
          )}
        </div>

        {/* Desktop Table */}
        {renderDesktopTable()}

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-500">
          {filteredPostulations.length} postulaciones encontradas
        </div>
      </div>

      {/* Modals */}
      {renderFiltersModal()}
      <PostulationDetailDrawer
        postulation={selectedPostulation ? {
          id: selectedPostulation.applicationId,
          status: selectedPostulation.status,
          score: selectedPostulation.score,
          created_at: selectedPostulation.date,
          property: {
            title: selectedPostulation.propertyTitle || 'Propiedad',
            city: selectedPostulation.propertyLocation?.split(',')[0] || 'Ciudad',
            region: selectedPostulation.propertyLocation?.split(',')[1]?.trim() || 'Región'
          },
          applicant: {
            name: selectedPostulation.name,
            email: selectedPostulation.profile.email
          }
        } : null}
        isOpen={showDetailDrawer}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

export default PostulationAdminPanel;
