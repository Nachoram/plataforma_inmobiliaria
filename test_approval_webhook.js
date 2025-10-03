// Script de prueba para verificar que el webhook envía created_by y approved_by
// Ejecutar con: node test_approval_webhook.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testApprovalWebhook() {
  try {
    console.log('🧪 Iniciando prueba del webhook de aprobación...');

    // Simular datos de prueba
    const testApplicationId = 'some-test-application-id';
    const testPropertyId = 'some-test-property-id';
    const testApplicantId = 'some-test-applicant-id';

    const applicantData = {
      full_name: 'Juan Pérez',
      contact_email: 'juan@example.com',
      contact_phone: '+56912345678',
      profession: 'Ingeniero',
      company: 'Tech Corp',
      monthly_income: 1500000
    };

    const propertyData = {
      address: 'Calle Falsa 123',
      city: 'Santiago',
      price: 500000,
      listing_type: 'rental'
    };

    console.log('📤 Enviando webhook con datos de prueba...');

    const { data, error } = await supabase.functions.invoke('approve-application', {
      body: {
        application_id: testApplicationId,
        created_by: 'test-created-by-user-id',
        approved_by: 'test-approved-by-user-id',
        property_id: testPropertyId,
        applicant_id: testApplicantId,
        applicant_data: applicantData,
        property_data: propertyData,
        timestamp: new Date().toISOString(),
        action: 'application_approved'
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (error) {
      console.error('❌ Error en webhook:', error);
    } else {
      console.log('✅ Webhook enviado exitosamente:', data);
    }

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

testApprovalWebhook();
