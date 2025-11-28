// Script para crear una oferta de prueba desde el navegador
// Pégalo en la consola del navegador en http://localhost:5173

const createTestOffer = async () => {
  console.log('🔍 Creando oferta de prueba desde el navegador...');

  try {
    // Verificar que window.supabase existe
    if (!window.supabase) {
      console.log('❌ Supabase no está disponible en window. ¿Estás en la página correcta?');
      return;
    }

    // Verificar si hay propiedades
    const { data: properties, error: propError } = await window.supabase
      .from('properties')
      .select('id, owner_id')
      .limit(1);

    if (propError || !properties || properties.length === 0) {
      console.log('❌ No hay propiedades disponibles.');
      console.log('💡 Crea una propiedad primero desde /properties');
      return;
    }

    const property = properties[0];
    console.log('✅ Usando propiedad existente:', property.id);

    // Crear oferta de prueba
    const { data: offer, error: offerError } = await window.supabase
      .from('property_sale_offers')
      .insert({
        property_id: property.id,
        buyer_id: '00000000-0000-0000-0000-000000000000',
        status: 'pendiente',
        offered_price: 150000000,
        currency: 'CLP',
        conditions: 'Pago al contado, escritura inmediata'
      })
      .select()
      .single();

    if (offerError) {
      console.log('❌ Error creando oferta:', offerError);
      return;
    }

    console.log('✅ Oferta creada exitosamente!');
    console.log('🆔 ID de la oferta:', offer.id);
    console.log('🌐 Ve a esta URL para probar:', `http://localhost:5173/sales/offer/${offer.id}`);

    // Crear enlace clickeable
    const link = document.createElement('a');
    link.href = `http://localhost:5173/sales/offer/${offer.id}`;
    link.textContent = `Ver oferta ${offer.id}`;
    link.style.cssText = 'color: blue; text-decoration: underline; font-weight: bold; display: block; margin-top: 10px;';

    console.log('%c🔗 Haz click en el enlace de abajo para ver la oferta:', 'color: blue; font-weight: bold;');
    console.log(link);

  } catch (error) {
    console.error('❌ Error general:', error);
  }
};

// Hacer que la función esté disponible globalmente
window.createTestOffer = createTestOffer;

console.log('✅ Función createTestOffer() lista para usar.');
console.log('📝 Ejecuta: createTestOffer() en la consola del navegador.');
console.log('🌐 Asegúrate de estar en http://localhost:5173');


