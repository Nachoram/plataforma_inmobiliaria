import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Edit,
  Trash2,
  User,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { SaleOffer, OfferTask, UserRole, TaskFormData, TASK_TYPES, PRIORITY_LEVELS, STATUS_COLORS } from '../types';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import toast from 'react-hot-toast';

interface OfferTasksTabProps {
  offer: SaleOffer;
  userRole: UserRole | null;
  tasks: OfferTask[];
  onUpdateOffer: (status: SaleOffer['status'], extraData?: any) => Promise<void>;
  onAddTimelineEvent: (eventData: any) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onTasksChange: () => Promise<void>;
}

const OfferTasksTab: React.FC<OfferTasksTabProps> = ({
  offer,
  userRole,
  tasks,
  onUpdateOffer,
  onAddTimelineEvent,
  onRefreshData,
  onTasksChange
}) => {
  const { user } = useAuth();

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<OfferTask | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<TaskFormData>({
    task_type: 'documentación',
    description: '',
    priority: 'normal',
    assigned_to: '',
    due_date: ''
  });

  // ========================================================================
  // FILTERS AND SEARCH
  // ========================================================================

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         TASK_TYPES[task.task_type].toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // ========================================================================
  // TASK CRUD OPERATIONS
  // ========================================================================

  const handleCreateTask = async () => {
    if (!user || !offer.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('offer_tasks')
        .insert({
          offer_id: offer.id,
          task_type: formData.task_type,
          description: formData.description,
          priority: formData.priority,
          assigned_to: formData.assigned_to || null,
          assigned_by: user.id,
          due_date: formData.due_date || null
        });

      if (error) throw error;

      toast.success('Tarea creada exitosamente');
      setShowCreateModal(false);
      resetForm();
      await onTasksChange();

      // Agregar evento al timeline
      await onAddTimelineEvent({
        event_type: 'tarea_creada',
        event_title: 'Nueva tarea creada',
        event_description: `Se creó la tarea: ${TASK_TYPES[formData.task_type]}`,
        related_data: { task_type: formData.task_type, priority: formData.priority }
      });

    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error('Error al crear la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<OfferTask>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('offer_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Tarea actualizada exitosamente');
      await onTasksChange();

      // Agregar evento al timeline si cambió el estado
      if (updates.status) {
        await onAddTimelineEvent({
          event_type: 'tarea_actualizada',
          event_title: `Tarea ${updates.status === 'completada' ? 'completada' : 'actualizada'}`,
          event_description: `Estado cambiado a: ${updates.status}`,
          related_data: { task_id: taskId, new_status: updates.status }
        });
      }

    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error('Error al actualizar la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('offer_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Tarea eliminada exitosamente');
      await onTasksChange();

      await onAddTimelineEvent({
        event_type: 'tarea_eliminada',
        event_title: 'Tarea eliminada',
        event_description: 'Una tarea fue eliminada del proceso'
      });

    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error('Error al eliminar la tarea');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // FORM HANDLERS
  // ========================================================================

  const resetForm = () => {
    setFormData({
      task_type: 'documentación',
      description: '',
      priority: 'normal',
      assigned_to: '',
      due_date: ''
    });
    setEditingTask(null);
  };

  const openEditModal = (task: OfferTask) => {
    setEditingTask(task);
    setFormData({
      task_type: task.task_type,
      description: task.description || '',
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date || ''
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTask) {
      await handleUpdateTask(editingTask.id, formData);
    } else {
      await handleCreateTask();
    }
  };

  // ========================================================================
  // UI HELPERS
  // ========================================================================

  const getTaskStatusIcon = (status: OfferTask['status']) => {
    switch (status) {
      case 'completada': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'en_progreso': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'rechazada': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h2>
          <p className="text-gray-600">Administra las tareas operacionales de esta oferta</p>
        </div>

        {userRole === 'seller' || userRole === 'admin' ? (
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </button>
        ) : null}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completada">Completada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="w-full lg:w-48">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas las prioridades</option>
              <option value="baja">Baja</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asignado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No se encontraron tareas</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {TASK_TYPES[task.task_type]}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {task.description || 'Sin descripción'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTaskStatusIcon(task.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[task.status] || STATUS_COLORS.pendiente}`}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${PRIORITY_LEVELS[task.priority].color}`}>
                        {PRIORITY_LEVELS[task.priority].label}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {task.assigned_to ? 'Asignado' : 'Sin asignar'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.due_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm ${isOverdue(task.due_date) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                            {new Date(task.due_date).toLocaleDateString('es-CL')}
                            {isOverdue(task.due_date) && (
                              <span className="ml-1 text-red-500">⚠️</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin fecha</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {(userRole === 'seller' || userRole === 'admin') && (
                          <>
                            <button
                              onClick={() => openEditModal(task)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {task.status !== 'completada' && (
                              <button
                                onClick={() => handleUpdateTask(task.id, { status: 'completada', completed_at: new Date().toISOString() })}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Marcar como completada"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Creation/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingTask ? 'Editar Tarea' : 'Crear Nueva Tarea'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {editingTask ? 'Modifica los detalles de la tarea' : 'Agrega una nueva tarea al proceso'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Task Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Tarea
                </label>
                <select
                  value={formData.task_type}
                  onChange={(e) => setFormData({ ...formData, task_type: e.target.value as OfferTask['task_type'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {Object.entries(TASK_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe la tarea..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as OfferTask['priority'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(PRIORITY_LEVELS).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Assigned To (placeholder - en una implementación real esto sería un selector de usuarios) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asignar a (ID de usuario)
                </label>
                <input
                  type="text"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  placeholder="ID del usuario asignado..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  editingTask ? 'Actualizar Tarea' : 'Crear Tarea'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferTasksTab;
