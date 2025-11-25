import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { OfferDetailsPanel } from './OfferDetailsPanel';
import { SaleOffer, OfferDocument, OfferCommunication } from './types';
import { Loader, AlertCircle } from 'lucide-react';

export const OfferDetailsPage: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<SaleOffer | null>(null);
  const [documents, setDocuments] = useState<OfferDocument[]>([]);
  const [communications, setCommunications] = useState<OfferCommunication[]>([]);

  const loadData = async () => {
    if (!offerId || !user) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Offer Details with Property
      const { data: offerData, error: offerError } = await supabase
        .from('property_sale_offers')
        .select(`
          *,
          property:properties (
            id,
            address_street,
            address_number,
            address_commune,
            address_region,
            price_clp,
            listing_type,
            owner_id
          )
        `)
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;
      if (!offerData) throw new Error('Oferta no encontrada');

      // Security check: Ensure user is the buyer
      if (offerData.buyer_id !== user.id) {
          throw new Error('No tienes permiso para ver esta oferta');
      }

      setOffer(offerData);

      // 2. Fetch Documents
      const { data: docsData, error: docsError } = await supabase
        .from('offer_documents')
        .select('*')
        .eq('offer_id', offerId);

      if (docsError && docsError.code !== '42P01') { // Ignore if table doesn't exist yet
          console.error('Error fetching documents:', docsError);
      }
      setDocuments(docsData || []);

      // 3. Fetch Communications
      const { data: msgsData, error: msgsError } = await supabase
        .from('offer_communications')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: true });

      if (msgsError && msgsError.code !== '42P01') {
          console.error('Error fetching communications:', msgsError);
      }
      setCommunications(msgsData || []);

    } catch (err: any) {
      console.error('Error loading offer details:', err);
      setError(err.message || 'Error al cargar la oferta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [offerId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Cargando detalles de la oferta...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-6 text-center">{error}</p>
        <button 
          onClick={() => navigate('/my-offers')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver a Mis Ofertas
        </button>
      </div>
    );
  }

  if (!offer) return null;

  return (
    <OfferDetailsPanel 
      offer={offer}
      initialDocuments={documents}
      initialCommunications={communications}
      onBack={() => navigate('/my-offers')}
      onRefresh={loadData}
    />
  );
};

