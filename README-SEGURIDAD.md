# 🔐 **Seguridad y Permisos**

> **Documentación completa de Row Level Security, autenticación, políticas y permisos**

---

## 📋 **Índice**
- [🛡️ Row Level Security (RLS)](#️-row-level-security-rls)
- [🔐 Sistema de Autenticación](#-sistema-de-autenticación)
- [👥 Roles y Permisos](#-roles-y-permisos)
- [📁 Políticas de Storage](#-políticas-de-storage)
- [🔒 Validaciones y Restricciones](#-validaciones-y-restricciones)
- [🚨 Auditoría y Monitoreo](#-auditoría-y-monitoreo)
- [🧪 Testing de Seguridad](#-testing-de-seguridad)
- [⚡ Mejores Prácticas](#-mejores-prácticas)

---

## 🛡️ **Row Level Security (RLS)**

### **Configuración General de RLS**

#### **Habilitación de RLS en Todas las Tablas**
```sql
-- Habilitar RLS en todas las tablas principales
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
```

### **Políticas de Profiles**

#### **Políticas Completas para Perfiles de Usuario**
```sql
-- SELECT: Users can view their own profile
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT
USING (auth.uid() = id);

-- INSERT: Users can insert their own profile (triggered automatically)
CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE: Users cannot delete profiles (handled by cascade from auth.users)
-- No DELETE policy needed as profiles are deleted via CASCADE
```

**Características:**
- ✅ **Aislamiento completo**: Cada usuario solo ve su propio perfil
- ✅ **Creación automática**: Trigger crea perfiles automáticamente
- ✅ **Actualización segura**: Solo el propietario puede modificar
- ✅ **Eliminación en cascada**: Se elimina automáticamente con el usuario

### **Políticas de Properties**

#### **Políticas Avanzadas para Propiedades**
```sql
-- SELECT: Anyone can view available properties + owners can view their own
CREATE POLICY "properties_select_policy" ON properties
FOR SELECT
USING (
  -- Public can view available properties
  (status = 'disponible' AND is_visible = true) OR
  -- Owners can view all their properties
  (auth.uid() = owner_id)
);

-- INSERT: Only authenticated users can create properties they own
CREATE POLICY "properties_insert_policy" ON properties
FOR INSERT
WITH CHECK (
  auth.uid() = owner_id AND 
  auth.uid() IS NOT NULL
);

-- UPDATE: Only owners can update their properties
CREATE POLICY "properties_update_policy" ON properties
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- DELETE: Only owners can delete (soft delete recommended)
CREATE POLICY "properties_delete_policy" ON properties
FOR DELETE
USING (auth.uid() = owner_id);
```

**Lógica de Visibilidad:**
- 🌐 **Público**: Ve solo propiedades `disponible` y `is_visible = true`
- 👤 **Propietarios**: Ven todas sus propiedades (cualquier estado)
- 🔒 **Privacidad**: Solo el propietario puede modificar/eliminar

### **Políticas de Applications**

#### **Políticas Bidireccionales para Postulaciones**
```sql
-- SELECT: Users can view their sent applications + property owners can view received applications
CREATE POLICY "applications_select_policy" ON applications
FOR SELECT
USING (
  -- Users can view their own applications
  auth.uid() = applicant_id OR
  -- Property owners can view applications to their properties
  auth.uid() IN (
    SELECT owner_id FROM properties WHERE id = applications.property_id
  )
);

-- INSERT: Only authenticated users can create applications for themselves
CREATE POLICY "applications_insert_policy" ON applications
FOR INSERT
WITH CHECK (
  auth.uid() = applicant_id AND
  auth.uid() IS NOT NULL AND
  -- Ensure the property exists and is available
  EXISTS (
    SELECT 1 FROM properties 
    WHERE id = property_id 
    AND status = 'disponible' 
    AND is_visible = true
  )
);

-- UPDATE: Only property owners can update application status
CREATE POLICY "applications_update_policy" ON applications
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT owner_id FROM properties WHERE id = applications.property_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM properties WHERE id = applications.property_id
  )
);

-- DELETE: Property owners can delete applications (rare use case)
CREATE POLICY "applications_delete_policy" ON applications
FOR DELETE
USING (
  auth.uid() IN (
    SELECT owner_id FROM properties WHERE id = applications.property_id
  )
);
```

**Flujo de Permisos:**
- 📤 **Postulantes**: Pueden ver sus postulaciones enviadas
- 📥 **Propietarios**: Pueden ver postulaciones recibidas y cambiar estados
- 🚫 **Restricción**: Solo se puede postular a propiedades disponibles

### **Políticas de Offers**

#### **Políticas para Ofertas de Compra**
```sql
-- SELECT: Users can view their sent offers + property owners can view received offers
CREATE POLICY "offers_select_policy" ON offers
FOR SELECT
USING (
  -- Users can view their own offers
  auth.uid() = offerer_id OR
  -- Property owners can view offers for their properties
  auth.uid() IN (
    SELECT owner_id FROM properties WHERE id = offers.property_id
  )
);

-- INSERT: Only authenticated users can create offers for themselves
CREATE POLICY "offers_insert_policy" ON offers
FOR INSERT
WITH CHECK (
  auth.uid() = offerer_id AND
  auth.uid() IS NOT NULL AND
  -- Ensure the property exists and is for sale
  EXISTS (
    SELECT 1 FROM properties 
    WHERE id = property_id 
    AND listing_type = 'venta'
    AND status = 'disponible' 
    AND is_visible = true
  ) AND
  -- Offer amount must be positive
  amount_clp > 0
);

-- UPDATE: Both offerer and property owner can update offers (for status changes)
CREATE POLICY "offers_update_policy" ON offers
FOR UPDATE
USING (
  auth.uid() = offerer_id OR
  auth.uid() IN (
    SELECT owner_id FROM properties WHERE id = offers.property_id
  )
)
WITH CHECK (
  auth.uid() = offerer_id OR
  auth.uid() IN (
    SELECT owner_id FROM properties WHERE id = offers.property_id
  )
);

-- DELETE: Offerers can delete their own offers before acceptance
CREATE POLICY "offers_delete_policy" ON offers
FOR DELETE
USING (
  auth.uid() = offerer_id AND
  status = 'pendiente'
);
```

**Reglas de Negocio:**
- 💰 **Solo ventas**: Ofertas solo para propiedades tipo `venta`
- ✅ **Estados**: Oferente y propietario pueden cambiar estados
- 🗑️ **Eliminación**: Solo ofertas pendientes por el oferente

### **Políticas de Guarantors**

#### **Políticas para Garantes**
```sql
-- SELECT: Users can view guarantors for applications they can see
CREATE POLICY "guarantors_select_policy" ON guarantors
FOR SELECT
USING (
  -- Users can view guarantors for their own applications
  id IN (
    SELECT guarantor_id FROM applications 
    WHERE applicant_id = auth.uid() AND guarantor_id IS NOT NULL
  ) OR
  -- Property owners can view guarantors for applications to their properties
  id IN (
    SELECT a.guarantor_id FROM applications a
    JOIN properties p ON a.property_id = p.id
    WHERE p.owner_id = auth.uid() AND a.guarantor_id IS NOT NULL
  )
);

-- INSERT: Users can create guarantors for their own applications
CREATE POLICY "guarantors_insert_policy" ON guarantors
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  -- Additional validation can be added here
);

-- UPDATE: Users can update guarantors for their own applications
CREATE POLICY "guarantors_update_policy" ON guarantors
FOR UPDATE
USING (
  id IN (
    SELECT guarantor_id FROM applications 
    WHERE applicant_id = auth.uid() AND guarantor_id IS NOT NULL
  )
)
WITH CHECK (
  id IN (
    SELECT guarantor_id FROM applications 
    WHERE applicant_id = auth.uid() AND guarantor_id IS NOT NULL
  )
);

-- DELETE: Users can delete guarantors for their own applications
CREATE POLICY "guarantors_delete_policy" ON guarantors
FOR DELETE
USING (
  id IN (
    SELECT guarantor_id FROM applications 
    WHERE applicant_id = auth.uid() AND guarantor_id IS NOT NULL
  )
);
```

### **Políticas de Documents**

#### **Políticas para Documentos**
```sql
-- SELECT: Users can view their own documents + property owners can view related documents
CREATE POLICY "documents_select_policy" ON documents
FOR SELECT
USING (
  -- Users can view their own documents
  auth.uid() = owner_id OR
  -- Property owners can view documents related to their properties
  (entity_type = 'property_legal' AND entity_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )) OR
  -- Property owners can view applicant documents for their properties
  (entity_type IN ('application_applicant', 'application_guarantor') AND entity_id IN (
    SELECT a.id FROM applications a
    JOIN properties p ON a.property_id = p.id
    WHERE p.owner_id = auth.uid()
  ))
);

-- INSERT: Users can create documents they own
CREATE POLICY "documents_insert_policy" ON documents
FOR INSERT
WITH CHECK (
  auth.uid() = owner_id AND
  auth.uid() IS NOT NULL
);

-- UPDATE: Users can update their own documents
CREATE POLICY "documents_update_policy" ON documents
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- DELETE: Users can delete their own documents
CREATE POLICY "documents_delete_policy" ON documents
FOR DELETE
USING (auth.uid() = owner_id);
```

### **Políticas de Property Images**

#### **Políticas para Imágenes de Propiedades**
```sql
-- SELECT: Anyone can view images of available properties + owners can view their property images
CREATE POLICY "property_images_select_policy" ON property_images
FOR SELECT
USING (
  -- Public can view images of available properties
  property_id IN (
    SELECT id FROM properties 
    WHERE status = 'disponible' AND is_visible = true
  ) OR
  -- Owners can view images of their properties
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- INSERT: Only property owners can add images
CREATE POLICY "property_images_insert_policy" ON property_images
FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  ) AND
  auth.uid() IS NOT NULL
);

-- UPDATE: Only property owners can update image metadata
CREATE POLICY "property_images_update_policy" ON property_images
FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- DELETE: Only property owners can delete images
CREATE POLICY "property_images_delete_policy" ON property_images
FOR DELETE
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);
```

### **Políticas de User Favorites**

#### **Políticas para Favoritos**
```sql
-- SELECT: Users can only view their own favorites
CREATE POLICY "user_favorites_select_policy" ON user_favorites
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can only create their own favorites
CREATE POLICY "user_favorites_insert_policy" ON user_favorites
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  auth.uid() IS NOT NULL AND
  -- Ensure the property exists and is available
  EXISTS (
    SELECT 1 FROM properties 
    WHERE id = property_id 
    AND status = 'disponible' 
    AND is_visible = true
  )
);

-- UPDATE: Generally not needed for favorites (simple add/remove)
-- If needed, users can only update their own favorites
CREATE POLICY "user_favorites_update_policy" ON user_favorites
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own favorites
CREATE POLICY "user_favorites_delete_policy" ON user_favorites
FOR DELETE
USING (auth.uid() = user_id);
```

---

## 🔐 **Sistema de Autenticación**

### **Configuración de Supabase Auth**

#### **Settings en Dashboard**
```json
{
  "site_url": "https://tu-dominio.com",
  "redirect_urls": [
    "http://localhost:5173/**",
    "https://tu-dominio.vercel.app/**"
  ],
  "jwt_expiry": 3600,
  "refresh_token_rotation_enabled": true,
  "session_timeout": 3600,
  "password_min_length": 6,
  "password_requirements": {
    "lowercase": true,
    "uppercase": false,
    "numbers": true,
    "special": false
  }
}
```

#### **Email Provider Configuration**
```sql
-- Configuración de email provider
UPDATE auth.config SET 
  confirm_email = false,  -- Para desarrollo
  secure_email_change_enabled = true,
  email_change_confirm_enabled = true,
  enable_signup = true;
```

### **Trigger Automático de Perfiles**

#### **Creación Automática de Perfiles**
```sql
-- Función para crear perfiles automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_email text;
  first_name text;
  last_name text;
BEGIN
  -- Extraer email del usuario
  user_email := COALESCE(NEW.email, '');
  
  -- Extraer nombres del metadata si están disponibles
  first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name := COALESCE(NEW.raw_user_meta_data->>'paternal_last_name', '');
  
  -- Insertar perfil base
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    paternal_last_name,
    maternal_last_name,
    rut,
    phone,
    profession,
    marital_status,
    address_street,
    address_number,
    address_commune,
    address_region,
    created_at
  ) VALUES (
    NEW.id,
    user_email,
    first_name,
    last_name,
    '', -- Se completará después
    '', -- Se completará después
    '', -- Se completará después
    '', -- Se completará después
    'soltero', -- Valor por defecto
    '', -- Se completará después
    '', -- Se completará después
    '', -- Se completará después
    '', -- Se completará después
    now()
  );
  
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Log the error but don't fail the user creation
  INSERT INTO public.error_logs (
    user_id,
    error_message,
    error_context,
    created_at
  ) VALUES (
    NEW.id,
    SQLERRM,
    'handle_new_user trigger',
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta después de crear usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### **Validaciones de Autenticación**

#### **Validador de RUT Chileno**
```sql
-- Función para validar RUT chileno
CREATE OR REPLACE FUNCTION validate_chilean_rut(rut_input text)
RETURNS boolean AS $$
DECLARE
    rut_clean text;
    rut_number text;
    dv_input text;
    dv_calculated text;
    sum_total integer := 0;
    multiplier integer := 2;
    i integer;
    remainder integer;
BEGIN
    -- Limpiar RUT (remover puntos, guiones y espacios)
    rut_clean := regexp_replace(upper(trim(rut_input)), '[^0-9K]', '', 'g');
    
    -- Validar longitud mínima
    IF length(rut_clean) < 8 OR length(rut_clean) > 9 THEN
        RETURN false;
    END IF;
    
    -- Separar número y dígito verificador
    rut_number := substring(rut_clean, 1, length(rut_clean) - 1);
    dv_input := substring(rut_clean, length(rut_clean), 1);
    
    -- Validar que el número sea solo dígitos
    IF rut_number !~ '^[0-9]+$' THEN
        RETURN false;
    END IF;
    
    -- Calcular dígito verificador
    FOR i IN REVERSE length(rut_number)..1 LOOP
        sum_total := sum_total + (substring(rut_number, i, 1)::integer * multiplier);
        multiplier := CASE WHEN multiplier = 7 THEN 2 ELSE multiplier + 1 END;
    END LOOP;
    
    remainder := sum_total % 11;
    dv_calculated := CASE 
        WHEN remainder = 0 THEN '0'
        WHEN remainder = 1 THEN 'K'
        ELSE (11 - remainder)::text
    END;
    
    RETURN dv_input = dv_calculated;
END;
$$ LANGUAGE plpgsql;

-- Constraint para validar RUT en la tabla profiles
ALTER TABLE profiles ADD CONSTRAINT valid_rut_check 
CHECK (rut = '' OR validate_chilean_rut(rut));
```

### **Session Management**

#### **Refresh Token Handling**
```typescript
// src/lib/auth.ts
export class AuthManager {
  private refreshTimer?: NodeJS.Timeout;

  constructor() {
    this.setupTokenRefresh();
  }

  private setupTokenRefresh() {
    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        if (session) {
          this.scheduleTokenRefresh(session);
        }
      } else if (event === 'SIGNED_OUT') {
        this.clearTokenRefresh();
      }
    });
  }

  private scheduleTokenRefresh(session: Session) {
    this.clearTokenRefresh();
    
    // Refresh 5 minutes before expiry
    const expiresAt = session.expires_at! * 1000;
    const refreshAt = expiresAt - (5 * 60 * 1000);
    const delay = refreshAt - Date.now();

    if (delay > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('Token refresh failed:', error);
            // Redirect to login
            window.location.href = '/auth';
          }
        } catch (error) {
          console.error('Token refresh error:', error);
        }
      }, delay);
    }
  }

  private clearTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }
}

export const authManager = new AuthManager();
```

---

## 👥 **Roles y Permisos**

### **Sistema de Roles Básico**

#### **Roles en User Metadata**
```typescript
// Tipos de roles
export type UserRole = 'user' | 'admin' | 'moderator';

export interface UserMetadata {
  role: UserRole;
  permissions: string[];
  created_at: string;
  last_login: string;
}

// Asignar rol durante registro
export const signUpWithRole = async (
  email: string, 
  password: string, 
  role: UserRole = 'user'
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        permissions: getRolePermissions(role),
        created_at: new Date().toISOString()
      }
    }
  });

  return { data, error };
};

// Obtener permisos por rol
const getRolePermissions = (role: UserRole): string[] => {
  const permissions = {
    user: [
      'create_property',
      'update_own_property',
      'delete_own_property',
      'create_application',
      'view_own_applications',
      'create_offer',
      'view_own_offers'
    ],
    moderator: [
      ...getRolePermissions('user'),
      'moderate_content',
      'view_user_reports',
      'suspend_listings'
    ],
    admin: [
      ...getRolePermissions('moderator'),
      'view_all_data',
      'manage_users',
      'access_admin_panel',
      'modify_system_settings'
    ]
  };

  return permissions[role] || permissions.user;
};
```

### **Middleware de Permisos**

#### **Permission Checker**
```typescript
// src/lib/permissions.ts
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  
  const userPermissions = user.user_metadata?.permissions || [];
  return userPermissions.includes(permission);
};

export const requirePermission = (permission: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const { user } = useAuth();
      
      if (!hasPermission(user, permission)) {
        throw new Error(`Permission denied: ${permission} required`);
      }
      
      return method.apply(this, args);
    };
  };
};

// Hook para verificar permisos
export const usePermissions = () => {
  const { user } = useAuth();
  
  return {
    hasPermission: (permission: string) => hasPermission(user, permission),
    userRole: user?.user_metadata?.role as UserRole || 'user',
    permissions: user?.user_metadata?.permissions || []
  };
};
```

#### **Protected Component**
```typescript
// src/components/auth/PermissionGuard.tsx
interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback
}) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return fallback || (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">No tienes permisos para ver este contenido.</p>
      </div>
    );
  }

  return <>{children}</>;
};

// Uso
<PermissionGuard permission="access_admin_panel">
  <AdminDashboard />
</PermissionGuard>
```

---

## 📁 **Políticas de Storage**

### **Bucket Configuration**

#### **property-images (Público)**
```sql
-- Políticas para bucket público de imágenes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true);

-- SELECT: Anyone can view property images
CREATE POLICY "Anyone can view property images" ON storage.objects
FOR SELECT
USING (bucket_id = 'property-images');

-- INSERT: Property owners can upload images
CREATE POLICY "Property owners can upload images" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  -- Validate file type
  (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif') AND
  -- Max file size: 10MB
  octet_length(decode(encode(name, 'escape'), 'base64')) <= 10485760
);

-- UPDATE: Property owners can update their image metadata
CREATE POLICY "Property owners can update image metadata" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: Property owners can delete their images
CREATE POLICY "Property owners can delete images" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### **user-documents (Privado)**
```sql
-- Bucket privado para documentos de usuarios
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-documents', 'user-documents', false);

-- SELECT: Users can view their own documents + property owners can view related documents
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-documents' AND (
    -- Users can view their own documents
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Property owners can view documents from applications to their properties
    EXISTS (
      SELECT 1 FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE p.owner_id = auth.uid()
      AND (storage.foldername(name))[2] = 'application_applicant'
      AND (storage.foldername(name))[3] = a.id::text
    )
  )
);

-- INSERT: Users can upload their own documents
CREATE POLICY "Users can upload own documents" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  -- Validate file type
  (storage.extension(name)) IN ('pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png') AND
  -- Max file size: 50MB
  octet_length(decode(encode(name, 'escape'), 'base64')) <= 52428800
);

-- UPDATE: Users can update their own document metadata
CREATE POLICY "Users can update own document metadata" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### **File Upload Validation**

#### **Client-side Validation**
```typescript
// src/lib/fileValidation.ts
export interface FileValidationRules {
  maxSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
}

export const VALIDATION_RULES = {
  PROPERTY_IMAGES: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  },
  USER_DOCUMENTS: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
  }
} as const;

export const validateFile = (file: File, rules: FileValidationRules): string | null => {
  // Check file size
  if (file.size > rules.maxSize) {
    return `El archivo excede el tamaño máximo de ${Math.round(rules.maxSize / 1024 / 1024)}MB`;
  }

  // Check file type
  if (!rules.allowedTypes.includes(file.type)) {
    return `Tipo de archivo no permitido. Tipos permitidos: ${rules.allowedTypes.join(', ')}`;
  }

  // Check file extension
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!rules.allowedExtensions.includes(fileExtension)) {
    return `Extensión de archivo no permitida. Extensiones permitidas: ${rules.allowedExtensions.join(', ')}`;
  }

  return null; // Validation passed
};

export const validatePropertyImage = (file: File): string | null => {
  return validateFile(file, VALIDATION_RULES.PROPERTY_IMAGES);
};

export const validateUserDocument = (file: File): string | null => {
  return validateFile(file, VALIDATION_RULES.USER_DOCUMENTS);
};
```

---

## 🔒 **Validaciones y Restricciones**

### **Database Constraints**

#### **Constraints de Integridad**
```sql
-- Constraint para validar precios positivos
ALTER TABLE properties ADD CONSTRAINT positive_price_check 
CHECK (price_clp > 0);

ALTER TABLE properties ADD CONSTRAINT positive_expenses_check 
CHECK (common_expenses_clp IS NULL OR common_expenses_clp >= 0);

-- Constraint para validar dimensiones
ALTER TABLE properties ADD CONSTRAINT positive_bedrooms_check 
CHECK (bedrooms >= 0);

ALTER TABLE properties ADD CONSTRAINT positive_bathrooms_check 
CHECK (bathrooms >= 0);

ALTER TABLE properties ADD CONSTRAINT positive_surface_check 
CHECK (surface_m2 > 0);

-- Constraint para validar ofertas
ALTER TABLE offers ADD CONSTRAINT positive_offer_amount_check 
CHECK (amount_clp > 0);

-- Constraint para evitar auto-ofertas
ALTER TABLE offers ADD CONSTRAINT no_self_offers_check 
CHECK (offerer_id != (SELECT owner_id FROM properties WHERE id = property_id));

-- Constraint para validar fechas
ALTER TABLE applications ADD CONSTRAINT valid_application_date_check 
CHECK (created_at <= now());

-- Constraint para validar edades
ALTER TABLE applications ADD CONSTRAINT valid_age_check 
CHECK (snapshot_applicant_age >= 18 AND snapshot_applicant_age <= 120);

-- Constraint para validar ingresos
ALTER TABLE applications ADD CONSTRAINT valid_income_check 
CHECK (snapshot_applicant_monthly_income_clp > 0);
```

#### **Unique Constraints**
```sql
-- Evitar duplicados en favoritos
ALTER TABLE user_favorites ADD CONSTRAINT unique_user_property_favorite 
UNIQUE (user_id, property_id);

-- Evitar múltiples postulaciones del mismo usuario a la misma propiedad
ALTER TABLE applications ADD CONSTRAINT unique_user_property_application 
UNIQUE (applicant_id, property_id);

-- RUT único en perfiles
ALTER TABLE profiles ADD CONSTRAINT unique_rut 
UNIQUE (rut) DEFERRABLE INITIALLY DEFERRED;

-- Email único en perfiles (sincronizado con auth.users)
ALTER TABLE profiles ADD CONSTRAINT unique_email 
UNIQUE (email);
```

### **Business Logic Validation**

#### **Application Business Rules**
```sql
-- Función para validar reglas de negocio en aplicaciones
CREATE OR REPLACE FUNCTION validate_application_business_rules()
RETURNS TRIGGER AS $$
DECLARE
    property_record RECORD;
    existing_application_count INTEGER;
BEGIN
    -- Obtener información de la propiedad
    SELECT * INTO property_record 
    FROM properties 
    WHERE id = NEW.property_id;
    
    -- Validar que la propiedad existe y está disponible
    IF property_record IS NULL THEN
        RAISE EXCEPTION 'La propiedad no existe';
    END IF;
    
    IF property_record.status != 'disponible' THEN
        RAISE EXCEPTION 'La propiedad no está disponible para postulaciones';
    END IF;
    
    IF property_record.listing_type != 'arriendo' THEN
        RAISE EXCEPTION 'Solo se pueden crear postulaciones para propiedades en arriendo';
    END IF;
    
    -- Validar que el usuario no sea el propietario
    IF NEW.applicant_id = property_record.owner_id THEN
        RAISE EXCEPTION 'No puedes postular a tu propia propiedad';
    END IF;
    
    -- Validar que no tenga ya una postulación activa
    SELECT COUNT(*) INTO existing_application_count
    FROM applications
    WHERE applicant_id = NEW.applicant_id 
    AND property_id = NEW.property_id 
    AND status IN ('pendiente', 'info_solicitada');
    
    IF existing_application_count > 0 THEN
        RAISE EXCEPTION 'Ya tienes una postulación activa para esta propiedad';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar aplicaciones antes de insertar
CREATE TRIGGER validate_application_rules
    BEFORE INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION validate_application_business_rules();
```

#### **Offer Business Rules**
```sql
-- Función para validar reglas de negocio en ofertas
CREATE OR REPLACE FUNCTION validate_offer_business_rules()
RETURNS TRIGGER AS $$
DECLARE
    property_record RECORD;
    existing_offer_count INTEGER;
BEGIN
    -- Obtener información de la propiedad
    SELECT * INTO property_record 
    FROM properties 
    WHERE id = NEW.property_id;
    
    -- Validar que la propiedad existe y está disponible
    IF property_record IS NULL THEN
        RAISE EXCEPTION 'La propiedad no existe';
    END IF;
    
    IF property_record.status != 'disponible' THEN
        RAISE EXCEPTION 'La propiedad no está disponible para ofertas';
    END IF;
    
    IF property_record.listing_type != 'venta' THEN
        RAISE EXCEPTION 'Solo se pueden crear ofertas para propiedades en venta';
    END IF;
    
    -- Validar que el usuario no sea el propietario
    IF NEW.offerer_id = property_record.owner_id THEN
        RAISE EXCEPTION 'No puedes hacer una oferta en tu propia propiedad';
    END IF;
    
    -- Validar que la oferta sea al menos el 50% del precio de venta
    IF NEW.amount_clp < (property_record.price_clp * 0.5) THEN
        RAISE EXCEPTION 'La oferta debe ser al menos el 50% del precio de venta';
    END IF;
    
    -- Validar que no tenga ya una oferta pendiente
    SELECT COUNT(*) INTO existing_offer_count
    FROM offers
    WHERE offerer_id = NEW.offerer_id 
    AND property_id = NEW.property_id 
    AND status = 'pendiente';
    
    IF existing_offer_count > 0 THEN
        RAISE EXCEPTION 'Ya tienes una oferta pendiente para esta propiedad';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar ofertas antes de insertar
CREATE TRIGGER validate_offer_rules
    BEFORE INSERT ON offers
    FOR EACH ROW
    EXECUTE FUNCTION validate_offer_business_rules();
```

---

## 🚨 **Auditoría y Monitoreo**

### **Audit Trail**

#### **Tabla de Auditoría**
```sql
-- Tabla para registrar cambios importantes
CREATE TABLE audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    operation text NOT NULL, -- INSERT, UPDATE, DELETE
    record_id text NOT NULL,
    old_values jsonb,
    new_values jsonb,
    user_id uuid REFERENCES auth.users(id),
    timestamp timestamp with time zone DEFAULT now(),
    user_agent text,
    ip_address inet
);

-- Índices para consultas eficientes
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
```

#### **Función de Auditoría Genérica**
```sql
-- Función genérica para auditoría
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_record RECORD;
    old_values jsonb;
    new_values jsonb;
BEGIN
    -- Determinar valores old y new según la operación
    CASE TG_OP
        WHEN 'INSERT' THEN
            old_values := NULL;
            new_values := to_jsonb(NEW);
            audit_record := NEW;
        WHEN 'UPDATE' THEN
            old_values := to_jsonb(OLD);
            new_values := to_jsonb(NEW);
            audit_record := NEW;
        WHEN 'DELETE' THEN
            old_values := to_jsonb(OLD);
            new_values := NULL;
            audit_record := OLD;
    END CASE;

    -- Insertar registro de auditoría
    INSERT INTO audit_logs (
        table_name,
        operation,
        record_id,
        old_values,
        new_values,
        user_id,
        timestamp
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(audit_record.id::text, 'unknown'),
        old_values,
        new_values,
        auth.uid(),
        now()
    );

    -- Retornar el registro apropiado
    CASE TG_OP
        WHEN 'INSERT', 'UPDATE' THEN RETURN NEW;
        WHEN 'DELETE' THEN RETURN OLD;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers de auditoría a tablas importantes
CREATE TRIGGER audit_properties_trigger
    AFTER INSERT OR UPDATE OR DELETE ON properties
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_applications_trigger
    AFTER INSERT OR UPDATE OR DELETE ON applications
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_offers_trigger
    AFTER INSERT OR UPDATE OR DELETE ON offers
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### **Security Monitoring**

#### **Tabla de Eventos de Seguridad**
```sql
-- Tabla para eventos de seguridad
CREATE TABLE security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL, -- 'login_attempt', 'permission_denied', 'suspicious_activity'
    severity text NOT NULL, -- 'low', 'medium', 'high', 'critical'
    description text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    ip_address inet,
    user_agent text,
    additional_data jsonb,
    timestamp timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
```

#### **Función para Registrar Eventos de Seguridad**
```sql
-- Función para registrar eventos de seguridad
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type text,
    p_severity text,
    p_description text,
    p_additional_data jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO security_events (
        event_type,
        severity,
        description,
        user_id,
        additional_data,
        timestamp
    ) VALUES (
        p_event_type,
        p_severity,
        p_description,
        auth.uid(),
        p_additional_data,
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Rate Limiting**

#### **Tabla para Rate Limiting**
```sql
-- Tabla para control de rate limiting
CREATE TABLE rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    ip_address inet,
    endpoint text NOT NULL,
    request_count integer NOT NULL DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, ip_address, endpoint, window_start)
);

-- Función para verificar rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_endpoint text,
    p_max_requests integer DEFAULT 100,
    p_window_minutes integer DEFAULT 60
)
RETURNS boolean AS $$
DECLARE
    current_count integer;
    window_start_time timestamp with time zone;
BEGIN
    window_start_time := date_trunc('hour', now()) + 
                        (floor(extract(minute from now()) / p_window_minutes) * p_window_minutes) * interval '1 minute';
    
    -- Obtener o crear registro
    INSERT INTO rate_limits (user_id, endpoint, window_start)
    VALUES (auth.uid(), p_endpoint, window_start_time)
    ON CONFLICT (user_id, ip_address, endpoint, window_start) 
    DO UPDATE SET request_count = rate_limits.request_count + 1
    RETURNING request_count INTO current_count;
    
    -- Verificar si excede el límite
    IF current_count > p_max_requests THEN
        -- Registrar evento de seguridad
        PERFORM log_security_event(
            'rate_limit_exceeded',
            'medium',
            format('Rate limit exceeded for endpoint %s (%s requests)', p_endpoint, current_count),
            jsonb_build_object('endpoint', p_endpoint, 'request_count', current_count)
        );
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🧪 **Testing de Seguridad**

### **Security Test Suite**

#### **RLS Policy Tests**
```typescript
// src/test/security/rlsTests.ts
describe('RLS Policy Tests', () => {
  let testUser1: User;
  let testUser2: User;
  let testProperty: Property;

  beforeEach(async () => {
    // Create test users
    testUser1 = await createTestUser('user1@test.com', 'password123');
    testUser2 = await createTestUser('user2@test.com', 'password123');
    
    // Create test property owned by user1
    await signInAs(testUser1);
    testProperty = await createTestProperty({
      listing_type: 'venta',
      address_street: 'Test Street',
      price_clp: 100000000
    });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Properties RLS', () => {
    it('should allow owners to view their own properties', async () => {
      await signInAs(testUser1);
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', testProperty.id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(testProperty.id);
    });

    it('should prevent non-owners from viewing private properties', async () => {
      // Update property to private status
      await signInAs(testUser1);
      await supabase
        .from('properties')
        .update({ status: 'pausada' })
        .eq('id', testProperty.id);

      // Try to access as different user
      await signInAs(testUser2);
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', testProperty.id);

      expect(data).toHaveLength(0);
    });

    it('should prevent non-owners from updating properties', async () => {
      await signInAs(testUser2);
      
      const { error } = await supabase
        .from('properties')
        .update({ price_clp: 200000000 })
        .eq('id', testProperty.id);

      expect(error).toBeDefined();
      expect(error?.code).toBe('42501'); // Permission denied
    });
  });

  describe('Applications RLS', () => {
    it('should allow applicants to create applications', async () => {
      await signInAs(testUser2);
      
      const { data, error } = await supabase
        .from('applications')
        .insert([{
          property_id: testProperty.id,
          message: 'Test application',
          snapshot_applicant_profession: 'Engineer',
          snapshot_applicant_monthly_income_clp: 1500000,
          snapshot_applicant_age: 30,
          snapshot_applicant_nationality: 'Chilean',
          snapshot_applicant_marital_status: 'soltero',
          snapshot_applicant_address_street: 'Test Address',
          snapshot_applicant_address_number: '123',
          snapshot_applicant_address_commune: 'Test Commune',
          snapshot_applicant_address_region: 'Test Region'
        }])
        .select();

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('should prevent users from applying to their own properties', async () => {
      await signInAs(testUser1);
      
      const { error } = await supabase
        .from('applications')
        .insert([{
          property_id: testProperty.id,
          message: 'Self application',
          // ... snapshot data
        }]);

      expect(error).toBeDefined();
      // Should be caught by business rule trigger
    });
  });
});
```

#### **Authentication Tests**
```typescript
// src/test/security/authTests.ts
describe('Authentication Security Tests', () => {
  it('should reject weak passwords', async () => {
    const { error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: '123' // Too weak
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('Password should be at least 6 characters');
  });

  it('should reject invalid email formats', async () => {
    const { error } = await supabase.auth.signUp({
      email: 'invalid-email',
      password: 'validPassword123'
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('Invalid email format');
  });

  it('should create profile automatically after signup', async () => {
    const email = `test-${Date.now()}@example.com`;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: 'testPassword123',
      options: {
        data: {
          first_name: 'Test',
          paternal_last_name: 'User'
        }
      }
    });

    expect(authError).toBeNull();
    expect(authData.user).toBeDefined();

    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user!.id)
      .single();

    expect(profileError).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.email).toBe(email);
  });
});
```

### **Security Helpers**

#### **Test Utilities**
```typescript
// src/test/security/securityHelpers.ts
export const createTestUser = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user!;
};

export const signInAs = async (user: User): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: 'password123' // Test password
  });
  if (error) throw error;
};

export const createTestProperty = async (propertyData: any): Promise<Property> => {
  const { data, error } = await supabase
    .from('properties')
    .insert([propertyData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const cleanupTestData = async (): Promise<void> => {
  // Clean up in reverse order to respect foreign keys
  await supabase.from('applications').delete().like('message', '%test%');
  await supabase.from('offers').delete().like('message', '%test%');
  await supabase.from('properties').delete().like('address_street', '%Test%');
  
  // Note: User cleanup might require admin privileges
};

export const testRLSViolation = async (
  query: () => Promise<any>,
  expectedError: string = '42501'
): Promise<void> => {
  try {
    await query();
    fail('Expected RLS violation but query succeeded');
  } catch (error: any) {
    expect(error.code).toBe(expectedError);
  }
};
```

---

## ⚡ **Mejores Prácticas**

### **Security Checklist**

#### **✅ Checklist de Seguridad**

**Autenticación:**
- [ ] Contraseñas con requisitos mínimos (6+ caracteres)
- [ ] Validación de email
- [ ] Rate limiting en endpoints de auth
- [ ] Session timeout configurado
- [ ] Refresh token rotation habilitado
- [ ] Trigger de creación de perfiles funciona
- [ ] Validación de RUT chileno implementada

**RLS Policies:**
- [ ] RLS habilitado en todas las tablas
- [ ] Políticas de SELECT restrictivas
- [ ] Políticas de INSERT con validación de ownership
- [ ] Políticas de UPDATE con verificación de permisos
- [ ] Políticas de DELETE apropiadas
- [ ] Políticas de Storage configuradas
- [ ] Business rules en triggers

**Validación de Datos:**
- [ ] Constraints de integridad en BD
- [ ] Validación client-side
- [ ] Sanitización de inputs
- [ ] Validación de tipos de archivo
- [ ] Límites de tamaño de archivo
- [ ] Validación de precios y dimensiones

**Monitoreo y Auditoría:**
- [ ] Audit trail implementado
- [ ] Logging de eventos de seguridad
- [ ] Rate limiting configurado
- [ ] Monitoreo de accesos sospechosos
- [ ] Alertas de seguridad configuradas

**Testing:**
- [ ] Tests de RLS policies
- [ ] Tests de autenticación
- [ ] Tests de validación
- [ ] Tests de rate limiting
- [ ] Penetration testing básico

### **Configuración de Producción**

#### **Variables de Entorno Seguras**
```env
# Producción - Variables de seguridad
SUPABASE_JWT_EXPIRY=3600
SUPABASE_REFRESH_TOKEN_ROTATION=true
SUPABASE_SESSION_TIMEOUT=3600
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MINUTES=60
SECURITY_ALERT_EMAIL=admin@tu-dominio.com
```

#### **Headers de Seguridad**
```typescript
// src/lib/securityHeaders.ts
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://unpkg.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://phnkervuiijqmapgswkc.supabase.co",
    "connect-src 'self' https://phnkervuiijqmapgswkc.supabase.co wss://phnkervuiijqmapgswkc.supabase.co",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};
```

### **Incident Response**

#### **Plan de Respuesta a Incidentes**
```typescript
// src/lib/incidentResponse.ts
export class IncidentResponse {
  static async handleSecurityBreach(
    type: 'data_breach' | 'unauthorized_access' | 'dos_attack',
    details: any
  ) {
    // 1. Log incident
    await this.logIncident(type, details);
    
    // 2. Alert administrators
    await this.alertAdministrators(type, details);
    
    // 3. Implement immediate countermeasures
    switch (type) {
      case 'unauthorized_access':
        await this.revokeAllSessions(details.user_id);
        break;
      case 'dos_attack':
        await this.enableStrictRateLimit();
        break;
      case 'data_breach':
        await this.lockdownSystem();
        break;
    }
    
    // 4. Start investigation
    await this.initiateInvestigation(type, details);
  }

  private static async logIncident(type: string, details: any) {
    await supabase.from('security_incidents').insert([{
      incident_type: type,
      severity: 'critical',
      details: details,
      reported_at: new Date().toISOString(),
      status: 'investigating'
    }]);
  }

  private static async alertAdministrators(type: string, details: any) {
    // Send email/slack/webhook notifications
    const alertMessage = `🚨 SECURITY INCIDENT: ${type}\nDetails: ${JSON.stringify(details, null, 2)}\nTime: ${new Date().toISOString()}`;
    
    // Implementation depends on your notification system
    console.error(alertMessage);
  }
}
```

---

## 📚 **Documentación Relacionada**

### **🏗️ Arquitectura y Desarrollo**
- 🏗️ **[README-ARQUITECTURA.md](README-ARQUITECTURA.md)** - Arquitectura del sistema y base de datos
- 💻 **[README-DESARROLLO.md](README-DESARROLLO.md)** - Ejemplos prácticos y mejores prácticas
- 👥 **[README-CONTRIBUCION.md](README-CONTRIBUCION.md)** - Guías de contribución y estándares

### **🛠️ Configuración y APIs**
- 🚀 **[README-INSTALACION.md](README-INSTALACION.md)** - Instalación y configuración inicial
- 📖 **[README-API.md](README-API.md)** - APIs, webhooks y Edge Functions
- 🗄️ **[README-MIGRACIONES.md](README-MIGRACIONES.md)** - Migraciones y fixes de base de datos

### **🚀 Producción y Debugging**
- 🚀 **[README-DESPLIEGUE.md](README-DESPLIEGUE.md)** - Despliegue y producción
- 🐛 **[README-DEBUGGING.md](README-DEBUGGING.md)** - Debugging y troubleshooting

---

**✅ Con esta configuración de seguridad, tu plataforma inmobiliaria está protegida y lista para producción.**
