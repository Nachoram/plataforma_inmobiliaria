/**
 * Script de prueba para el sistema documental sistematizado de postulantes
 * Ejecutar con: node test_applicant_documents_system.js
 */

import { createClient } from '@supabase/supabase-js'

// Configurar Supabase (reemplazar con tus credenciales)
const supabaseUrl = process.env.SUPABASE_URL || 'tu-supabase-url'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'tu-supabase-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testApplicantDocumentsSystem() {
  console.log('🧪 Probando sistema documental de postulantes...\n')

  try {
    // 1. Obtener tipos de documentos disponibles
    console.log('1️⃣ Obteniendo tipos de documentos disponibles...')
    const { data: documentTypes, error: typesError } = await supabase
      .from('applicant_document_types')
      .select('*')
      .eq('is_active', true)
      .order('processing_priority')

    if (typesError) throw typesError

    console.log(`✅ Encontrados ${documentTypes.length} tipos de documentos:`)
    documentTypes.forEach(type => {
      console.log(`   - ${type.code}: ${type.name} (${type.category}) ${type.is_required ? '[OBLIGATORIO]' : ''}`)
    })

    // 2. Obtener documentos pendientes de procesamiento
    console.log('\n2️⃣ Obteniendo documentos pendientes de procesamiento...')
    const { data: pendingDocs, error: pendingError } = await supabase
      .rpc('get_pending_applicant_documents', {
        applicant_uuid: null,
        limit_count: 3
      })

    if (pendingError) throw pendingError

    console.log(`✅ Encontrados ${pendingDocs.length} documentos pendientes:`)
    pendingDocs.forEach(doc => {
      console.log(`   - ${doc.document_type_name}: ${doc.applicant_name} (${doc.applicant_rut})`)
      console.log(`     URL: ${doc.file_url}`)
    })

    // 3. Probar vista completa de documentos
    console.log('\n3️⃣ Probando vista completa de documentos...')
    const { data: completeView, error: viewError } = await supabase
      .from('applicant_documents_complete')
      .select('*')
      .limit(2)

    if (viewError) throw viewError

    console.log(`✅ Vista completa retorna ${completeView.length} registros`)
    if (completeView.length > 0) {
      console.log('   Ejemplo de registro:')
      console.log(`   - Documento: ${completeView[0].document_type_name}`)
      console.log(`   - Postulante: ${completeView[0].applicant_name}`)
      console.log(`   - Estado: ${completeView[0].processing_status}`)
      if (completeView[0].extracted_full_name) {
        console.log(`   - Nombre extraído: ${completeView[0].extracted_full_name}`)
      }
    }

    // 4. Simular procesamiento de un documento (si hay documentos pendientes)
    if (pendingDocs.length > 0) {
      console.log('\n4️⃣ Simulando procesamiento de documento...')

      const testDoc = pendingDocs[0]
      const mockExtractedData = {
        full_name: testDoc.applicant_name,
        rut: testDoc.applicant_rut,
        document_number: 'TEST-123',
        monthly_income: 750000,
        employer_name: 'Empresa de Prueba SpA'
      }

      // Actualizar estado del documento
      const { error: updateError } = await supabase
        .rpc('update_document_processing_status', {
          document_uuid: testDoc.document_id,
          new_status: 'processing',
          ocr_content: 'Texto OCR simulado del documento...',
          metadata_json: { test: true, timestamp: new Date().toISOString() }
        })

      if (updateError) throw updateError

      // Insertar contenido extraído
      const { error: insertError } = await supabase
        .rpc('insert_document_content', {
          document_uuid: testDoc.document_id,
          content_data: mockExtractedData,
          extraction_method: 'test',
          confidence: 0.95,
          extracted_fields: mockExtractedData
        })

      if (insertError) throw insertError

      console.log('✅ Documento procesado exitosamente')
      console.log(`   Datos extraídos: ${JSON.stringify(mockExtractedData, null, 2)}`)
    }

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!')

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message)
    console.error('Detalles:', error)
  }
}

// Ejecutar pruebas
testApplicantDocumentsSystem()
