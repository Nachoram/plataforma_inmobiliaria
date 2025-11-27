import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OfferDetailsPanel } from './OfferDetailsPanel';

export const OfferDetailsPage: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();

  // Usar la nueva versión refactorizada por defecto
  // Para activar feature flags posteriormente, descomentar las líneas comentadas arriba
  return (
    <OfferDetailsPanel
      offerId={offerId || ''}
      onBack={() => navigate('/my-offers')}
    />
  );
};

