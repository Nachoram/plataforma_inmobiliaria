import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Search,
  DollarSign,
  MapPin,
  Building,
  Save,
  AlertCircle
} from 'lucide-react';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';
import { Applicant } from './types';

interface ApplicantSettingsProps {
  applicant: Applicant;
  onUpdate: (updatedApplicant: Applicant) => void;
}

const ApplicantSettings: React.FC<ApplicantSettingsProps> = ({
  applicant,
  onUpdate
}) => {
  const [settings, setSettings] = useState({
    notifications_enabled: applicant.notifications_enabled,
    search_preferences: applicant.search_preferences || {}
  });

  const [saving, setSaving] = useState(false);

  // Tipos de propiedades disponibles
  const propertyTypes = [
    { value: 'Casa', label: 'Casa' },
    { value: 'Departamento', label: 'Departamento' },
    { value: 'Oficina', label: 'Oficina' },
    { value: 'Local Comercial', label: 'Local Comercial' },
    { value: 'Estacionamiento', label: 'Estacionamiento' },
    { value: 'Bodega', label: 'Bodega' },
    { value: 'Parcela', label: 'Parcela' }
  ];

  // Regiones de Chile
  const regions = [
    'Arica y Parinacota',
    'Tarapacá',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaíso',
    'Metropolitana',
    'O\'Higgins',
    'Maule',
    'Ñuble',
    'Biobío',
    'Araucanía',
    'Los Ríos',
    'Los Lagos',
    'Aysén',
    'Magallanes'
  ];

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Aquí iría la lógica para guardar en la base de datos
      // Por ahora, solo actualizamos localmente
      const updatedApplicant: Applicant = {
        ...applicant,
        notifications_enabled: settings.notifications_enabled,
        search_preferences: settings.search_preferences
      };

      onUpdate(updatedApplicant);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateSearchPreferences = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      search_preferences: {
        ...prev.search_preferences,
        [field]: value
      }
    }));
  };

  const togglePropertyType = (propertyType: string) => {
    const currentTypes = settings.search_preferences.property_types || [];
    const newTypes = currentTypes.includes(propertyType)
      ? currentTypes.filter(type => type !== propertyType)
      : [...currentTypes, propertyType];

    updateSearchPreferences('property_types', newTypes);
  };

  const toggleRegion = (region: string) => {
    const currentRegions = settings.search_preferences.regions || [];
    const newRegions = currentRegions.includes(region)
      ? currentRegions.filter(r => r !== region)
      : [...currentRegions, region];

    updateSearchPreferences('regions', newRegions);
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
        <Settings className="h-5 w-5 mr-2" />
        Configuración del Perfil
      </h3>

      <div className="space-y-8">
        {/* Notificaciones */}
        <div>
          <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Notificaciones por email
                </label>
                <p className="text-sm text-gray-500">
                  Recibe actualizaciones sobre tus postulaciones y nuevas propiedades
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.notifications_enabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    notifications_enabled: e.target.checked
                  }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Preferencias de búsqueda */}
        <div>
          <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center">
            <Search className="h-4 w-4 mr-2" />
            Preferencias de Búsqueda
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Configura tus preferencias para recibir recomendaciones más precisas
          </p>

          {/* Rango de precios */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Rango de Precio (CLP)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  placeholder="Precio mínimo"
                  value={settings.search_preferences.min_price || ''}
                  onChange={(e) => updateSearchPreferences('min_price', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Precio máximo"
                  value={settings.search_preferences.max_price || ''}
                  onChange={(e) => updateSearchPreferences('max_price', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Tipos de propiedad */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Building className="h-4 w-4 mr-1" />
              Tipos de Propiedad
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {propertyTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    (settings.search_preferences.property_types || []).includes(type.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={(settings.search_preferences.property_types || []).includes(type.value)}
                    onChange={() => togglePropertyType(type.value)}
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Regiones */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              Regiones de Interés
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {regions.map((region) => (
                <label
                  key={region}
                  className={`flex items-center p-2 text-sm border rounded cursor-pointer transition-colors ${
                    (settings.search_preferences.regions || []).includes(region)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={(settings.search_preferences.regions || []).includes(region)}
                    onChange={() => toggleRegion(region)}
                  />
                  <span>{region}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-900 mb-2">
            ¿Cómo funcionan estas preferencias?
          </h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Las preferencias te ayudan a recibir propiedades más relevantes</li>
            <li>• Puedes cambiar estas configuraciones en cualquier momento</li>
            <li>• Los filtros se aplican tanto en búsquedas como en recomendaciones</li>
          </ul>
        </div>

        {/* Botón guardar */}
        <div className="flex justify-end pt-6 border-t">
          <CustomButton
            onClick={handleSaveSettings}
            loading={saving}
            className="flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Configuración
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default ApplicantSettings;






