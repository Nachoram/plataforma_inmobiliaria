import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface DocumentAuthorization {
  id: string;
  offer_id: string;
  authorized_user_id: string; // ID del usuario autorizado (vendedor)
  authorized_by_id: string; // ID del usuario que autoriza (comprador)
  permission_type: 'view_documents' | 'view_all' | 'view_specific';
  specific_documents?: string[]; // IDs de documentos específicos si permission_type es 'view_specific'
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

interface DocumentAuthorizationState {
  authorizations: DocumentAuthorization[];
  canViewDocuments: boolean;
  canAuthorize: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useDocumentAuthorization = (offerId: string) => {
  const { user } = useAuth();
  const [state, setState] = useState<DocumentAuthorizationState>({
    authorizations: [],
    canViewDocuments: false,
    canAuthorize: false,
    isLoading: true,
    error: null
  });

  // Cargar autorizaciones existentes
  const loadAuthorizations = useCallback(async () => {
    if (!user || !offerId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: offer, error: offerError } = await supabase
        .from('property_sale_offers')
        .select('buyer_id, property:properties(owner_id)')
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;

      const isBuyer = offer.buyer_id === user.id;
      const isSeller = offer.property?.owner_id === user.id;

      // Cargar autorizaciones (con manejo de tabla inexistente)
      let authorizations = [];
      try {
        const { data: authData, error: authError } = await supabase
          .from('document_authorizations')
          .select('*')
          .eq('offer_id', offerId)
          .eq('is_active', true);

        if (authError) {
          // Si la tabla no existe, continuar sin error (valores por defecto)
          console.warn('Tabla document_authorizations no encontrada, usando valores por defecto:', authError.message);
          authorizations = [];
        } else {
          authorizations = authData || [];
        }
      } catch (error) {
        // Fallback silencioso si hay problemas con la tabla
        console.warn('Error accediendo a document_authorizations:', error);
        authorizations = [];
      }

      // Determinar permisos
      const canAuthorize = isBuyer; // Solo el comprador puede autorizar
      const canViewDocuments = isSeller || isBuyer || authorizations.some(auth =>
        auth.authorized_user_id === user.id && auth.is_active
      );

      setState({
        authorizations: authorizations || [],
        canViewDocuments,
        canAuthorize,
        isLoading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Error loading document authorizations:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Error cargando autorizaciones'
      }));
    }
  }, [user, offerId]);

  // Autorizar a un usuario a ver documentos
  const authorizeUser = useCallback(async (
    authorizedUserId: string,
    permissionType: DocumentAuthorization['permission_type'] = 'view_all',
    specificDocuments?: string[],
    expiresAt?: string
  ) => {
    if (!user || !offerId || !state.canAuthorize) {
      throw new Error('No tienes permisos para autorizar usuarios');
    }

    try {
      const { data, error } = await supabase
        .from('document_authorizations')
        .insert({
          offer_id: offerId,
          authorized_user_id: authorizedUserId,
          authorized_by_id: user.id,
          permission_type: permissionType,
          specific_documents: specificDocuments,
          granted_at: new Date().toISOString(),
          expires_at: expiresAt,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        // Si la tabla no existe, mostrar mensaje pero no fallar
        console.warn('Tabla document_authorizations no encontrada. La migración debe aplicarse:', error.message);
        throw new Error('Sistema de autorizaciones no disponible. Contacta al administrador.');
      }

      // Recargar autorizaciones
      await loadAuthorizations();

      return data;
    } catch (error: any) {
      console.error('Error authorizing user:', error);
      throw new Error(error.message || 'Error autorizando usuario');
    }
  }, [user, offerId, state.canAuthorize, loadAuthorizations]);

  // Revocar autorización
  const revokeAuthorization = useCallback(async (authorizationId: string) => {
    if (!user || !state.canAuthorize) {
      throw new Error('No tienes permisos para revocar autorizaciones');
    }

    try {
      const { error } = await supabase
        .from('document_authorizations')
        .update({
          is_active: false,
          expires_at: new Date().toISOString()
        })
        .eq('id', authorizationId)
        .eq('authorized_by_id', user.id); // Solo el que autorizó puede revocar

      if (error) {
        console.warn('Tabla document_authorizations no encontrada. La migración debe aplicarse:', error.message);
        throw new Error('Sistema de autorizaciones no disponible. Contacta al administrador.');
      }

      // Recargar autorizaciones
      await loadAuthorizations();
    } catch (error: any) {
      console.error('Error revoking authorization:', error);
      throw new Error(error.message || 'Error revocando autorización');
    }
  }, [user, state.canAuthorize, loadAuthorizations]);

  // Verificar si un documento específico puede ser visto
  const canViewDocument = useCallback((documentId: string) => {
    if (!user) return false;

    return state.authorizations.some(auth => {
      if (auth.authorized_user_id !== user.id || !auth.is_active) return false;

      if (auth.permission_type === 'view_all') return true;
      if (auth.permission_type === 'view_documents') return true;
      if (auth.permission_type === 'view_specific' && auth.specific_documents?.includes(documentId)) return true;

      return false;
    });
  }, [user, state.authorizations]);

  // Cargar datos al montar
  useEffect(() => {
    loadAuthorizations();
  }, [loadAuthorizations]);

  return {
    ...state,
    authorizeUser,
    revokeAuthorization,
    canViewDocument,
    refresh: loadAuthorizations
  };
};

export default useDocumentAuthorization;
