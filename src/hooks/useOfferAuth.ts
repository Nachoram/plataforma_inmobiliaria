import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

interface OfferAuthState {
  isAuthenticated: boolean;
  userId: string | null;
  userRole: 'buyer' | 'seller' | 'admin' | null;
  permissions: {
    canViewOffer: boolean;
    canEditOffer: boolean;
    canDeleteOffer: boolean;
    canUploadDocuments: boolean;
    canSendMessages: boolean;
  };
  isLoading: boolean;
  error: string | null;
}

interface UseOfferAuthOptions {
  offerId?: string;
  requiredRole?: 'buyer' | 'seller' | 'admin';
  autoRefresh?: boolean;
}

// Hook personalizado para autenticación y permisos en ofertas
export const useOfferAuth = (options: UseOfferAuthOptions = {}) => {
  const { user, loading: authLoading } = useAuth();
  const { offerId, requiredRole, autoRefresh = true } = options;

  const [authState, setAuthState] = useState<OfferAuthState>({
    isAuthenticated: false,
    userId: null,
    userRole: null,
    permissions: {
      canViewOffer: false,
      canEditOffer: false,
      canDeleteOffer: false,
      canUploadDocuments: false,
      canSendMessages: false,
    },
    isLoading: true,
    error: null
  });

  // Función para determinar permisos basados en el rol
  const getPermissionsForRole = useCallback((role: 'buyer' | 'seller' | 'admin') => {
    switch (role) {
      case 'admin':
        return {
          canViewOffer: true,
          canEditOffer: true,
          canDeleteOffer: true,
          canUploadDocuments: true,
          canSendMessages: true,
        };
      case 'seller':
        return {
          canViewOffer: true,
          canEditOffer: true,
          canDeleteOffer: false,
          canUploadDocuments: true,
          canSendMessages: true,
        };
      case 'buyer':
        return {
          canViewOffer: true,
          canEditOffer: false,
          canDeleteOffer: false,
          canUploadDocuments: true,
          canSendMessages: true,
        };
      default:
        return {
          canViewOffer: false,
          canEditOffer: false,
          canDeleteOffer: false,
          canUploadDocuments: false,
          canSendMessages: false,
        };
    }
  }, []);

  // Función para determinar el rol del usuario en una oferta específica
  const determineUserRole = useCallback(async (userId: string, offerId?: string): Promise<'buyer' | 'seller' | 'admin'> => {
    // Si no hay offerId específico, asumir buyer (para contexto general)
    if (!offerId) return 'buyer';

    try {
      const { data: offer, error } = await supabase
        .from('property_sale_offers')
        .select('buyer_id, property:properties(owner_id)')
        .eq('id', offerId)
        .single();

      if (error) {
        console.warn('Error determining user role:', error);
        return 'buyer'; // fallback
      }

      if (offer.buyer_id === userId) return 'buyer';
      if (offer.property?.owner_id === userId) return 'seller';

      // Verificar si es admin (podríamos tener una tabla de admins)
      // Por ahora, asumimos que cualquier otro usuario autenticado es buyer
      return 'buyer';
    } catch (error) {
      console.error('Error in determineUserRole:', error);
      return 'buyer';
    }
  }, []);

  // Función principal para actualizar el estado de autenticación
  const updateAuthState = useCallback(async (forceRefresh = false) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!user) {
        setAuthState({
          isAuthenticated: false,
          userId: null,
          userRole: null,
          permissions: getPermissionsForRole('buyer'), // permisos mínimos
          isLoading: false,
          error: null
        });
        return;
      }

      // Determinar el rol del usuario
      const userRole = await determineUserRole(user.id, offerId);

      // Validar rol requerido si se especificó
      if (requiredRole && userRole !== requiredRole) {
        setAuthState({
          isAuthenticated: true,
          userId: user.id,
          userRole,
          permissions: getPermissionsForRole(userRole),
          isLoading: false,
          error: `Se requiere rol ${requiredRole} pero el usuario tiene rol ${userRole}`
        });
        return;
      }

      // Actualizar estado con permisos apropiados
      setAuthState({
        isAuthenticated: true,
        userId: user.id,
        userRole,
        permissions: getPermissionsForRole(userRole),
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Error updating auth state:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error de autenticación'
      }));
    }
  }, [user, offerId, requiredRole, determineUserRole, getPermissionsForRole]);

  // Función para verificar permisos específicos
  const hasPermission = useCallback((permission: keyof OfferAuthState['permissions']): boolean => {
    return authState.permissions[permission];
  }, [authState.permissions]);

  // Función para verificar si el usuario puede acceder a una oferta específica
  const canAccessOffer = useCallback(async (targetOfferId: string): Promise<boolean> => {
    if (!authState.isAuthenticated || !authState.userId) return false;

    try {
      const { data: offer, error } = await supabase
        .from('property_sale_offers')
        .select('buyer_id, property:properties(owner_id)')
        .eq('id', targetOfferId)
        .single();

      if (error) return false;

      const isBuyer = offer.buyer_id === authState.userId;
      const isSeller = offer.property?.owner_id === authState.userId;
      const isAdmin = authState.userRole === 'admin';

      return isBuyer || isSeller || isAdmin;
    } catch (error) {
      console.error('Error checking offer access:', error);
      return false;
    }
  }, [authState.isAuthenticated, authState.userId, authState.userRole]);

  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    updateAuthState(true);
  }, [updateAuthState]);

  // Efecto para actualizar automáticamente cuando cambie la autenticación
  useEffect(() => {
    if (autoRefresh) {
      updateAuthState();
    }
  }, [updateAuthState, autoRefresh]);

  // Efecto para escuchar cambios en la autenticación
  useEffect(() => {
    if (!authLoading && autoRefresh) {
      updateAuthState();
    }
  }, [authLoading, updateAuthState, autoRefresh]);

  return {
    ...authState,
    hasPermission,
    canAccessOffer,
    refresh,
    // Utilidades adicionales
    isBuyer: authState.userRole === 'buyer',
    isSeller: authState.userRole === 'seller',
    isAdmin: authState.userRole === 'admin',
  };
};

// Hook específico para validación de acceso a ofertas
export const useOfferAccess = (offerId: string) => {
  const { canAccessOffer, isAuthenticated, userRole, isLoading, error } = useOfferAuth({ offerId });

  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (isLoading) return;

      if (!isAuthenticated) {
        setHasAccess(false);
        setAccessChecked(true);
        return;
      }

      const access = await canAccessOffer(offerId);
      setHasAccess(access);
      setAccessChecked(true);
    };

    checkAccess();
  }, [offerId, canAccessOffer, isAuthenticated, isLoading]);

  return {
    hasAccess,
    accessChecked,
    isAuthenticated,
    userRole,
    isLoading: isLoading || !accessChecked,
    error
  };
};

export default useOfferAuth;



