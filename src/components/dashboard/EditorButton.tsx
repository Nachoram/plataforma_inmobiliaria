import React, { useState } from 'react';
import { Edit3, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';

interface EditorButtonProps {
  contractId?: string;
  applicationId: string;
  propertyId?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const EditorButton: React.FC<EditorButtonProps> = ({
  contractId,
  applicationId,
  propertyId,
  className = '',
  variant = 'outline',
  size = 'md',
  showText = true
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const checkAdminAccess = async () => {
    if (!user) return false;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin access:', error);
        return false;
      }

      return profile?.role === 'admin' || profile?.role === 'owner';
    } catch (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
  };

  const handleOpenEditor = async () => {
    setCheckingAccess(true);

    try {
      const access = await checkAdminAccess();
      setHasAccess(access);

      if (!access) {
        toast.error('No tienes permisos para acceder al editor de contratos');
        return;
      }

      // Navigate to contract editor with parameters
      const params = new URLSearchParams({
        applicationId,
        ...(contractId && { contractId }),
        ...(propertyId && { propertyId })
      });

      navigate(`/admin/contracts/editor?${params.toString()}`);
    } catch (error) {
      console.error('Error opening editor:', error);
      toast.error('Error al abrir el editor');
    } finally {
      setCheckingAccess(false);
    }
  };

  // Don't render anything if user doesn't have access (checked)
  if (hasAccess === false) {
    return null;
  }

  return (
    <CustomButton
      onClick={handleOpenEditor}
      variant={variant}
      size={size}
      className={`flex items-center ${className}`}
      loading={checkingAccess}
      disabled={checkingAccess}
      title="Abrir editor de contrato (Solo administradores)"
    >
      <Edit3 className="h-4 w-4 mr-2" />
      {showText && 'Abrir Editor'}
    </CustomButton>
  );
};

// Hook version for programmatic access
export const useContractEditor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const openEditor = async (params: {
    applicationId: string;
    contractId?: string;
    propertyId?: string;
  }) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      // Check admin access
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin access:', error);
        toast.error('Error al verificar permisos');
        return;
      }

      if (profile?.role !== 'admin' && profile?.role !== 'owner') {
        toast.error('No tienes permisos para acceder al editor de contratos');
        return;
      }

      // Navigate to editor
      const queryParams = new URLSearchParams({
        applicationId: params.applicationId,
        ...(params.contractId && { contractId: params.contractId }),
        ...(params.propertyId && { propertyId: params.propertyId })
      });

      navigate(`/admin/contracts/editor?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error opening contract editor:', error);
      toast.error('Error al abrir el editor de contratos');
    }
  };

  const canAccessEditor = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking editor access:', error);
        return false;
      }

      return profile?.role === 'admin' || profile?.role === 'owner';
    } catch (error) {
      console.error('Error checking editor access:', error);
      return false;
    }
  };

  return {
    openEditor,
    canAccessEditor
  };
};

// Compact version for use in tables/lists
export const EditorButtonCompact: React.FC<Omit<EditorButtonProps, 'showText' | 'size'>> = (props) => (
  <EditorButton {...props} showText={false} size="sm" />
);

export default EditorButton;

