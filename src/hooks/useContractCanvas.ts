import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Función de prueba para verificar el parsing (puedes usar esto en la consola del navegador)
export const testN8nParsing = () => {
  const sampleContract = `CONTRATO DE ARRENDAMIENTO RESIDENCIAL

CLÁUSULA PRIMERA: COMPARECIENCIA
En Santiago de Chile, a 29 de septiembre de 2025, comparecen:
**Carolina Andrea Soto Rojas**, con RUT N° 15.123.456-7, domiciliada en Eliodoro Yáñez 1890, Providencia, en adelante "el Arrendador"; y
**Carlos Alberto Soto Vega**, con RUT N° 22.222.222-2, domiciliado en Los Leones 567 Depto. 56, Providencia, en adelante "el Arrendatario".
Ambas partes convienen en celebrar el presente contrato de arrendamiento residencial, el que se regirá por las siguientes cláusulas.

CLÁUSULA SEGUNDA: OBJETO
El Arrendador da en arrendamiento al Arrendatario, quien acepta para sí, el inmueble ubicado en Suecia 1234 Casa A, Providencia, con ROL de avalúo N° [ROL no especificado].
El inmueble arrendado se destina exclusivamente para fines residenciales, para la habitación del Arrendatario y su familia.
Se deja constancia que el inmueble no incluye estacionamiento ni bodega.

CLÁUSULA TERCERA: RENTA
La renta mensual de arrendamiento será la suma de $1.600.000 (un millón seiscientos mil pesos chilenos).
El Arrendatario se obliga a pagar dicha suma por adelantado dentro de los primeros cinco (5) días de cada mes, en la forma y lugar que las partes convengan o determinen posteriormente.

CLÁUSULA CUARTA: DURACIÓN
El presente contrato tendrá una duración de [DATO FALTANTE] a contar del [DATO FALTANTE], pudiendo renovarse previo acuerdo expreso entre las partes.
El Arrendatario podrá poner término al contrato notificando al Arrendador con al menos [DATO FALTANTE] días de anticipación, en conformidad con la legislación vigente.
Asimismo, el Arrendador podrá poner término conforme a los plazos y causales legales aplicables.

CLÁUSULA QUINTA: GARANTÍA, AVAL Y CODEUDOR SOLIDARIO
Para garantía del fiel cumplimiento de todas las obligaciones emanadas del presente contrato, comparece y se constituye en aval y codeudor solidario:
**Don Rodolfo Rrrrrrrr Mmmmmm**, con RUT N° 11.111.111-1, domiciliado en Irarrazaval 5350 Depto. 22, Ñuñoa, quien responde solidariamente con el Arrendatario por todas las obligaciones presentes y futuras derivadas del presente contrato.

Firmado en dos ejemplares de un mismo tenor y a un solo efecto, en Santiago de Chile a [DATO FALTANTE].

_____________________________
Carolina Andrea Soto Rojas
RUT: 15.123.456-7
ARRENDADOR

_____________________________
Carlos Alberto Soto Vega
RUT: 22.222.222-2
ARRENDATARIO

_____________________________
Rodolfo Rrrrrrrr Mmmmmm
RUT: 11.111.111-1
AVAL Y CODEUDOR SOLIDARIO`;

  const result = parseN8nContractToCanvas(sampleContract);
  console.log('📄 Resultado del parsing N8N:', result);
  return result;
};

// Función para convertir contrato generado por N8N al formato del canvas
export const parseN8nContractToCanvas = (n8nContractText: string): ContractContent => {
  const sections: ContractContent = {
    header: { title: 'Encabezado del Contrato', content: '' },
    conditions: { title: 'Condiciones del Arriendo', content: '' },
    obligations: { title: 'Obligaciones de las Partes', content: '' },
    termination: { title: 'Terminación del Contrato', content: '' },
    signatures: { title: 'Firmas Digitales', content: '' }
  };

  // Dividir el texto por cláusulas usando regex más específico
  const clauseRegex = /CLÁUSULA\s+(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|Sexta|Septima|OCTAVA|NOVENA|DÉCIMA|UNDÉCIMA|DUODÉCIMA|DECIMOTERCERA|DECIMOCUARTA|DECIMOQUINTA|DECIMOSEXTA|DECIMOSÉPTIMA|DECIMOCTAVA|DECIMONOVENA|VIGÉSIMA|VIGÉSIMA PRIMERA|VIGÉSIMA SEGUNDA|VIGÉSIMA TERCERA|VIGÉSIMA CUARTA|VIGÉSIMA QUINTA|VIGÉSIMA SEXTA|VIGÉSIMA SÉPTIMA|VIGÉSIMA OCTAVA|VIGÉSIMA NOVENA|TRIGÉSIMA|(?:\d+(?:ª|°)?)):\s*/gi;

  // Obtener todas las cláusulas con su contenido
  const clauses: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = clauseRegex.exec(n8nContractText)) !== null) {
    if (lastIndex > 0) {
      clauses.push(n8nContractText.slice(lastIndex, match.index).trim());
    }
    lastIndex = match.index;
  }

  // Agregar la última cláusula
  if (lastIndex < n8nContractText.length) {
    clauses.push(n8nContractText.slice(lastIndex).trim());
  }

  // Procesar cada cláusula y mapearla a las secciones del canvas
  const matches = [...n8nContractText.matchAll(clauseRegex)];

  matches.forEach((match, index) => {
    const clauseTitle = match[0].trim();
    const clauseNumber = match[1]?.toUpperCase();
    const clauseContent = clauses[index] || '';

    // Mapear cláusulas a secciones del canvas
    switch (clauseNumber) {
      case 'PRIMERA':
        // CLÁUSULA PRIMERA: COMPARECIENCIA -> Header
        sections.header.content = `## ${clauseTitle}\n${clauseContent}`;
        break;

      case 'SEGUNDA':
        // CLÁUSULA SEGUNDA: OBJETO -> Parte de conditions
        sections.conditions.content += `## ${clauseTitle}\n${clauseContent}\n\n`;
        break;

      case 'TERCERA':
        // CLÁUSULA TERCERA: RENTA -> Parte de conditions
        sections.conditions.content += `## ${clauseTitle}\n${clauseContent}\n\n`;
        break;

      case 'CUARTA':
        // CLÁUSULA CUARTA: DURACIÓN -> Parte de conditions
        sections.conditions.content += `## ${clauseTitle}\n${clauseContent}\n\n`;
        break;

      case 'QUINTA':
        // CLÁUSULA QUINTA: GARANTÍA, AVAL -> Obligations
        sections.obligations.content += `## ${clauseTitle}\n${clauseContent}\n\n`;
        break;

      default:
        // Otras cláusulas van a obligations o termination según el contenido
        if (clauseContent.toLowerCase().includes('terminación') ||
            clauseContent.toLowerCase().includes('rescisión') ||
            clauseContent.toLowerCase().includes('desocupación')) {
          sections.termination.content += `## ${clauseTitle}\n${clauseContent}\n\n`;
        } else {
          sections.obligations.content += `## ${clauseTitle}\n${clauseContent}\n\n`;
        }
        break;
    }
  });

  // Procesar la parte final con firmas
  const signatureMatch = n8nContractText.match(/(Firmado en dos ejemplares[\s\S]*$)/);
  if (signatureMatch) {
    sections.signatures.content = signatureMatch[1];
  }

  // Limpiar y formatear el contenido
  Object.keys(sections).forEach(key => {
    const sectionKey = key as keyof ContractContent;
    sections[sectionKey].content = sections[sectionKey].content
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Máximo 2 saltos de línea
      .replace(/\*\*/g, '**'); // Asegurar que las negritas estén bien formateadas
  });

  return sections;
};

export interface ContractContent {
  header: {
    title: string;
    content: string;
  };
  conditions: {
    title: string;
    content: string;
  };
  obligations: {
    title: string;
    content: string;
  };
  termination: {
    title: string;
    content: string;
  };
  signatures: {
    title: string;
    content: string;
  };
}

export interface ContractClause {
  id: string;
  contract_id: string;
  clause_number: string;
  clause_title: string;
  clause_content: string;
  canvas_section: 'header' | 'conditions' | 'obligations' | 'termination' | 'signatures';
  sort_order: number;
  created_by_system: string;
  created_at: string;
  updated_at: string;
}

export interface RentalContract {
  id: string;
  application_id: string;
  status: 'draft' | 'approved' | 'sent_to_signature' | 'partially_signed' | 'fully_signed' | 'cancelled';
  contract_content: ContractContent;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  sent_to_signature_at?: string;
  created_by?: string;
  approved_by?: string;
  notes?: string;
  version: number;
}

export const useContractCanvas = (contractId?: string, applicationId?: string) => {
  const { user } = useAuth();
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar contrato existente y sus cláusulas
  const loadContract = useCallback(async () => {
    if (!contractId && !applicationId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('rental_contracts')
        .select('*');

      if (contractId) {
        query = query.eq('id', contractId);
      } else if (applicationId) {
        query = query.eq('application_id', applicationId);
      }

      const { data: contractData, error: contractError } = await query.single();

      if (contractError && contractError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw contractError;
      }

      if (contractData) {
        setContract(contractData);

        // Cargar cláusulas del contrato
        const { data: clausesData, error: clausesError } = await supabase
          .from('contract_clauses')
          .select('*')
          .eq('contract_id', contractData.id)
          .order('sort_order', { ascending: true });

        if (clausesError) {
          console.warn('Error loading clauses:', clausesError);
        } else {
          setClauses(clausesData || []);
        }
      } else {
        // Si no existe contrato, crear uno por defecto
        await createDefaultContract(applicationId!);
      }
    } catch (err: any) {
      console.error('Error loading contract:', err);
      setError(err.message || 'Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  }, [contractId, applicationId]);

  // Crear contrato por defecto
  const createDefaultContract = async (appId: string) => {
    if (!user) return;

    const defaultContent: ContractContent = {
      header: {
        title: 'Encabezado del Contrato',
        content: `# CONTRATO DE ARRENDAMIENTO DE VIVIENDA

**Fecha:** ${new Date().toLocaleDateString('es-ES')}

**Partes Involucradas:**

**ARRENDADOR (Propietario):**
- Nombre: [Nombre del Propietario]
- RUT: [RUT del Propietario]
- Dirección: [Dirección del Propietario]

**ARRENDATARIO (Arrendatario):**
- Nombre: [Nombre del Arrendatario]
- RUT: [RUT del Arrendatario]
- Dirección: [Dirección del Arrendatario]

**GARANTE (Aval):**
- Nombre: [Nombre del Garante]
- RUT: [RUT del Garante]
- Dirección: [Dirección del Garante]`
      },
      conditions: {
        title: 'Condiciones del Arriendo',
        content: `## CONDICIONES GENERALES DEL ARRENDAMIENTO

### 1. OBJETO DEL CONTRATO
El Arrendador da en arriendo al Arrendatario, quien lo acepta, la siguiente propiedad:

**Propiedad:**
- Dirección: [Dirección completa de la propiedad]
- Tipo: [Casa/Departamento/Local comercial]
- Superficie: [Metros cuadrados útiles]

### 2. PLAZO DEL ARRENDAMIENTO
El presente contrato tendrá una duración de [número] meses, contados desde el [fecha inicio] hasta el [fecha término].

### 3. PRECIO Y FORMA DE PAGO
El precio mensual del arriendo será de $[monto] pesos chilenos, pagaderos por adelantado el día [día] de cada mes.

### 4. GARANTÍAS
Como garantía del cumplimiento de las obligaciones del Arrendatario, se establece:
- Deposito en garantía: $[monto] pesos chilenos
- Aval: [Nombre del aval]
- Seguro de arriendo: [Compañía aseguradora]`
      },
      obligations: {
        title: 'Obligaciones de las Partes',
        content: `## OBLIGACIONES DE LAS PARTES

### OBLIGACIONES DEL ARRENDADOR:
1. Entregar la propiedad en perfectas condiciones de habitabilidad
2. Mantener la propiedad en buen estado de conservación
3. Respetar el derecho de uso pacífico del arrendatario
4. Proporcionar servicios básicos (agua, luz, gas)

### OBLIGACIONES DEL ARRENDATARIO:
1. Pagar puntualmente el precio del arriendo
2. Destinar la propiedad únicamente para vivienda familiar
3. Conservar la propiedad en buen estado
4. Permitir el acceso del arrendador para inspecciones
5. No realizar modificaciones sin autorización previa

### OBLIGACIONES DEL GARANTE:
1. Responder solidariamente por las obligaciones del arrendatario
2. Garantizar el cumplimiento de todas las cláusulas del contrato`
      },
      termination: {
        title: 'Terminación del Contrato',
        content: `## TERMINACIÓN DEL CONTRATO

### CAUSALES DE TERMINACIÓN ANTICIPADA:
1. Mutuo acuerdo entre las partes
2. Incumplimiento grave de las obligaciones contractuales
3. Destrucción total o parcial de la propiedad arrendada
4. Expropiación de la propiedad

### PROCEDIMIENTO DE DESOCUPACIÓN:
1. Notificación por escrito con 30 días de anticipación
2. Inspección conjunta de la propiedad
3. Devolución del depósito de garantía (menos deducciones por daños)
4. Entrega de las llaves

### CLAUSULA DICOM:
El arrendatario declara bajo juramento que no registra deudas con la DICOM.`
      },
      signatures: {
        title: 'Firmas Digitales',
        content: `## ESPACIOS PARA FIRMAS DIGITALES

### FIRMA DEL ARRENDADOR
_______________________________
[Nombre del Arrendador]
Fecha: __________

### FIRMA DEL ARRENDATARIO
_______________________________
[Nombre del Arrendatario]
Fecha: __________

### FIRMA DEL GARANTE
_______________________________
[Nombre del Garante]
Fecha: __________`
      }
    };

    const newContract = {
      application_id: appId,
      contract_content: defaultContent,
      created_by: user.id,
      status: 'draft' as const,
      version: 1
    };

    const { data, error } = await supabase
      .from('rental_contracts')
      .insert(newContract)
      .select()
      .single();

    if (error) throw error;
    setContract(data);
  };

  // Guardar cambios del canvas
  const saveContract = async (content: ContractContent, notes?: string) => {
    if (!contract) return;

    setSaving(true);
    setError(null);

    try {
      const updates = {
        contract_content: content,
        updated_at: new Date().toISOString(),
        notes: notes || contract.notes,
        version: contract.version + 1
      };

      const { data, error } = await supabase
        .from('rental_contracts')
        .update(updates)
        .eq('id', contract.id)
        .select()
        .single();

      if (error) throw error;
      setContract(data);
    } catch (err: any) {
      console.error('Error saving contract:', err);
      setError(err.message || 'Error al guardar el contrato');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Cambiar estado del contrato
  const updateContractStatus = async (status: RentalContract['status']) => {
    if (!contract) return;

    setSaving(true);
    setError(null);

    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Agregar timestamps según el estado
      if (status === 'approved' && !contract.approved_at) {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = user?.id;
      }

      if (status === 'sent_to_signature' && !contract.sent_to_signature_at) {
        updates.sent_to_signature_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('rental_contracts')
        .update(updates)
        .eq('id', contract.id)
        .select()
        .single();

      if (error) throw error;
      setContract(data);
    } catch (err: any) {
      console.error('Error updating contract status:', err);
      setError(err.message || 'Error al actualizar el estado del contrato');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Cargar contrato al montar el componente
  useEffect(() => {
    loadContract();
  }, [loadContract]);

  // Función para importar contrato desde N8N
  const importFromN8n = useCallback(async (n8nContractText: string) => {
    if (!contract) return;

    try {
      const canvasContent = parseN8nContractToCanvas(n8nContractText);
      await saveContract(canvasContent, 'Importado desde N8N');
    } catch (err: any) {
      console.error('Error importing from N8N:', err);
      setError(err.message || 'Error al importar contrato desde N8N');
      throw err;
    }
  }, [contract, saveContract]);

  // Convertir cláusulas al formato del canvas
  const getCanvasContentFromClauses = useCallback((): ContractContent => {
    const content: ContractContent = {
      header: { title: 'Encabezado del Contrato', content: '' },
      conditions: { title: 'Condiciones del Arriendo', content: '' },
      obligations: { title: 'Obligaciones de las Partes', content: '' },
      termination: { title: 'Terminación del Contrato', content: '' },
      signatures: { title: 'Firmas Digitales', content: '' }
    };

    // Agrupar cláusulas por sección del canvas
    clauses.forEach(clause => {
      const sectionContent = content[clause.canvas_section];
      sectionContent.content += `\n\n## CLÁUSULA ${clause.clause_number}: ${clause.clause_title}\n${clause.clause_content}`;
    });

    // Limpiar contenido
    Object.keys(content).forEach(key => {
      const section = content[key as keyof ContractContent];
      section.content = section.content.trim();
    });

    return content;
  }, [clauses]);

  // Sincronizar cláusulas con el contract_content JSONB
  const syncCanvasContent = useCallback(async () => {
    if (!contract) return;

    try {
      const { error } = await supabase.rpc('sync_contract_canvas_content', {
        contract_uuid: contract.id
      });

      if (error) throw error;

      // Recargar el contrato para obtener el contenido actualizado
      await loadContract();
    } catch (err: any) {
      console.error('Error syncing canvas content:', err);
      setError(err.message || 'Error al sincronizar el contenido del canvas');
    }
  }, [contract, loadContract]);

  return {
    contract,
    clauses,
    canvasContent: getCanvasContentFromClauses(),
    loading,
    saving,
    error,
    loadContract,
    saveContract,
    updateContractStatus,
    importFromN8n,
    syncCanvasContent,
    refreshContract: loadContract
  };
};
