const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN3oCSVQlaYaPkPmXS2w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWebhookData() {
  console.log('🧪 Probando obtención de datos para webhook...\n');

  try {
    // Obtener una aplicación de prueba
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('id, property_id, status')
      .eq('status', 'En Revisión')
      .limit(1);

    if (appsError || !applications || applications.length === 0) {
      console.log('❌ No hay aplicaciones en estado "En Revisión" para probar');
      return;
    }

    const testApplication = applications[0];
    console.log('📋 Aplicación de prueba:', testApplication);

    const applicationId = testApplication.id;

    // Simular la función getWebhookData
    console.log('\n🔍 Probando getWebhookData con applicationId:', applicationId);

    // 1. Obtener property_id de la aplicación
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('property_id')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error('❌ Error obteniendo aplicación:', appError);
      return;
    }

    const propertyId = application.property_id;
    console.log('✅ Properties.id =', propertyId);

    // 2. Obtener property_id de rental_owners
    const { data: rentalOwner, error: ownerError } = await supabase
      .from('rental_owners')
      .select('property_id')
      .eq('property_id', propertyId)
      .single();

    const rentalOwnerPropertyId = rentalOwner?.property_id || propertyId;
    console.log('✅ Rental_owners.property_id =', rentalOwnerPropertyId);

    // 3. Obtener application_id de application_applicants
    const { data: applicants, error: applicantsError } = await supabase
      .from('application_applicants')
      .select('application_id')
      .eq('application_id', applicationId)
      .limit(1);

    const applicantApplicationId = applicants && applicants.length > 0
      ? applicants[0].application_id
      : applicationId;

    console.log('✅ Application_applicants.application_id =', applicantApplicationId);

    // Datos finales
    const webhookData = {
      properties_id: propertyId,
      rental_owners_property_id: rentalOwnerPropertyId,
      application_applicants_application_id: applicantApplicationId,
      application_id: applicationId,
      timestamp: new Date().toISOString()
    };

    console.log('\n🎯 DATOS FINALES PARA WEBHOOK:');
    console.log(JSON.stringify(webhookData, null, 2));

    // Probar envío real al webhook (opcional)
    console.log('\n🚀 Probando envío real al webhook...');
    try {
      const response = await fetch('https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      console.log('📡 Status del webhook:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Respuesta del webhook:', result);
      } else {
        const errorText = await response.text();
        console.log('❌ Error del webhook:', errorText);
      }
    } catch (fetchError) {
      console.log('❌ Error conectando al webhook:', fetchError.message);
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

testWebhookData();














