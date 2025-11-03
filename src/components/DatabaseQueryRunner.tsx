import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import CustomButton from './common/CustomButton';

interface QueryResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const DatabaseQueryRunner: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Predefined fix for the property_type_characteristics_id issue
  const applyPropertyTypeFix = () => {
    const fixQuery = `
DO $$
DECLARE
    application_id UUID := '9b4b4270-f7c1-40ab-9d9d-851a4b7ac07b';
    property_record RECORD;
    characteristics_id UUID;
BEGIN
    RAISE NOTICE '🔍 IDENTIFICANDO PROPIEDAD PARA APPLICATION ID: %', application_id;

    -- Get the property for this application
    SELECT
        p.id,
        p.tipo_propiedad,
        p.address_street,
        p.address_number,
        p.property_type_characteristics_id
    INTO property_record
    FROM applications a
    JOIN properties p ON a.property_id = p.id
    WHERE a.id = application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '❌ No se encontró la aplicación con ID: %', application_id;
    END IF;

    RAISE NOTICE '📊 Información de la propiedad:';
    RAISE NOTICE '  - Property ID: %', property_record.id;
    RAISE NOTICE '  - Tipo propiedad: %', property_record.tipo_propiedad;
    RAISE NOTICE '  - Dirección: % %', property_record.address_street, property_record.address_number;
    RAISE NOTICE '  - Property type characteristics ID actual: %', property_record.property_type_characteristics_id;

    -- Check if property_type_characteristics_id is already set
    IF property_record.property_type_characteristics_id IS NOT NULL THEN
        RAISE NOTICE '✅ La propiedad ya tiene property_type_characteristics_id asignado';
        RETURN;
    END IF;

    -- Check if tipo_propiedad is set
    IF property_record.tipo_propiedad IS NULL THEN
        RAISE EXCEPTION '❌ La propiedad no tiene tipo_propiedad definido. No se puede determinar el UUID correspondiente.';
    END IF;

    -- Get the UUID for this property type
    SELECT id INTO characteristics_id
    FROM property_type_characteristics
    WHERE name = property_record.tipo_propiedad::text
    LIMIT 1;

    IF characteristics_id IS NULL THEN
        RAISE EXCEPTION '❌ No se encontró un UUID para el tipo de propiedad: %. Verifique que existe en property_type_characteristics.', property_record.tipo_propiedad;
    END IF;

    RAISE NOTICE '🔄 Actualizando propiedad con UUID: %', characteristics_id;

    -- Update the property with the UUID
    UPDATE properties
    SET property_type_characteristics_id = characteristics_id
    WHERE id = property_record.id;

    RAISE NOTICE '✅ Propiedad actualizada exitosamente';
    RAISE NOTICE '  - Property ID: %', property_record.id;
    RAISE NOTICE '  - Nuevo property_type_characteristics_id: %', characteristics_id;

END $$;

-- VERIFICATION
DO $$
DECLARE
    application_id UUID := '9b4b4270-f7c1-40ab-9d9d-851a4b7ac07b';
    property_data RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN FINAL';

    SELECT
        p.id,
        p.property_type_characteristics_id,
        p.tipo_propiedad,
        ptc.name as characteristics_name
    INTO property_data
    FROM applications a
    JOIN properties p ON a.property_id = p.id
    LEFT JOIN property_type_characteristics ptc ON p.property_type_characteristics_id = ptc.id
    WHERE a.id = application_id;

    IF FOUND THEN
        RAISE NOTICE '📊 Estado final de la propiedad:';
        RAISE NOTICE '  - Property ID: %', property_data.id;
        RAISE NOTICE '  - property_type_characteristics_id: %', property_data.property_type_characteristics_id;
        RAISE NOTICE '  - tipo_propiedad: %', property_data.tipo_propiedad;
        RAISE NOTICE '  - Characteristics name: %', property_data.characteristics_name;

        IF property_data.property_type_characteristics_id IS NOT NULL THEN
            RAISE NOTICE '✅ ÉXITO: La propiedad ahora tiene property_type_characteristics_id válido';
        ELSE
            RAISE NOTICE '❌ ERROR: La propiedad aún no tiene property_type_characteristics_id';
        END IF;
    ELSE
        RAISE NOTICE '❌ ERROR: No se pudo verificar la propiedad';
    END IF;
END $$;
    `;
    setQuery(fixQuery);
  };

  const executePropertyFix = async () => {
    setLoading(true);
    setResult(null);

    try {
      const applicationId = '9b4b4270-f7c1-40ab-9d9d-851a4b7ac07b';

      // Step 1: Get the property for this application
      const { data: applicationData, error: appError } = await supabase
        .from('applications')
        .select(`
          id,
          property_id,
          properties!inner (
            id,
            tipo_propiedad,
            property_type_characteristics_id,
            address_street,
            address_number
          )
        `)
        .eq('id', applicationId)
        .single();

      if (appError) {
        throw new Error(`Error obteniendo aplicación: ${appError.message}`);
      }

      const propertyData = applicationData.properties as any;

      console.log('📊 Propiedad encontrada:', {
        id: propertyData.id,
        tipo_propiedad: propertyData.tipo_propiedad,
        property_type_characteristics_id: propertyData.property_type_characteristics_id
      });

      // Check if already has the characteristic_id
      if (propertyData.property_type_characteristics_id) {
        setResult({
          success: true,
          message: 'La propiedad ya tiene property_type_characteristics_id asignado',
          data: propertyData
        });
        return;
      }

      // Step 2: Get the UUID for this property type
      const { data: characteristicsData, error: charError } = await supabase
        .from('property_type_characteristics')
        .select('id, name')
        .eq('name', propertyData.tipo_propiedad)
        .single();

      if (charError) {
        throw new Error(`Error obteniendo characteristics: ${charError.message}`);
      }

      console.log('🔄 UUID encontrado para tipo:', propertyData.tipo_propiedad, '=', characteristicsData.id);

      // Step 3: Update the property
      const { data: updateData, error: updateError } = await supabase
        .from('properties')
        .update({
          property_type_characteristics_id: characteristicsData.id
        })
        .eq('id', propertyData.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error actualizando propiedad: ${updateError.message}`);
      }

      console.log('✅ Propiedad actualizada exitosamente');

      // Step 4: Verify the update
      const { data: verifyData, error: verifyError } = await supabase
        .from('applications')
        .select(`
          id,
          properties!inner (
            id,
            property_type_characteristics_id,
            tipo_propiedad
          )
        `)
        .eq('id', applicationId)
        .single();

      if (verifyError) {
        console.warn('Error en verificación:', verifyError);
      }

      setResult({
        success: true,
        message: '✅ Fix aplicado exitosamente. La propiedad ahora tiene property_type_characteristics_id válido.',
        data: {
          property_id: propertyData.id,
          tipo_propiedad: propertyData.tipo_propiedad,
          nuevo_characteristics_id: characteristicsData.id,
          characteristics_name: characteristicsData.name,
          verificacion: verifyData?.properties
        }
      });

    } catch (err: any) {
      setResult({
        success: false,
        message: 'Error aplicando el fix',
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Ejecutor de Consultas de Base de Datos</h2>

      <div className="mb-4">
        <CustomButton
          onClick={applyPropertyTypeFix}
          variant="secondary"
          className="mr-4"
        >
          Aplicar Fix para property_type_characteristics_id
        </CustomButton>
        <span className="text-sm text-gray-600">
          Aplica la corrección específica para el error que estás experimentando
        </span>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Consulta SQL
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm"
          placeholder="Ingresa tu consulta SQL aquí..."
        />
      </div>

      <div className="mb-4">
        <CustomButton
          onClick={executePropertyFix}
          disabled={loading}
          variant="primary"
        >
          {loading ? 'Aplicando Fix...' : 'Aplicar Fix para property_type_characteristics_id'}
        </CustomButton>
      </div>

      {result && (
        <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className={`text-lg font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.success ? '✅ Éxito' : '❌ Error'}
          </h3>
          <p className={`mt-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
          {result.error && (
            <pre className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded">
              {result.error}
            </pre>
          )}
          {result.data && (
            <pre className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-lg font-semibold text-blue-800 mb-2">💡 Información de Seguridad</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Esta herramienta ejecuta consultas SQL directamente en la base de datos</li>
          <li>• Solo ejecuta consultas de fuentes confiables</li>
          <li>• Las consultas SELECT son seguras para leer datos</li>
          <li>• Las consultas UPDATE/INSERT/DELETE modifican datos permanentemente</li>
          <li>• Siempre verifica tu consulta antes de ejecutarla</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseQueryRunner;
