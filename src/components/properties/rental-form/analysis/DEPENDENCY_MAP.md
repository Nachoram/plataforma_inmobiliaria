# 🗺️ MAPA DE DEPENDENCIAS - RentalPublicationForm

## 📊 RESUMEN EJECUTIVO

**Componente Analizado:** `RentalPublicationForm.tsx`
**Líneas de Código:** 3,394
**Complejidad:** Alta (monolítico con múltiples responsabilidades)

---

## 🔗 DEPENDENCIAS EXTERNAS

### **React & Hooks**
```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
```

### **UI Components**
```typescript
import {
  Upload, X, FileText, Image, Check, AlertCircle, Loader2,
  Building, User, Building2, CheckCircle, Car, Archive
} from 'lucide-react';
```

### **Servicios y Utilidades**
```typescript
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
```

### **Subcomponentes Existentes**
```typescript
import ParkingSpaceForm, { ParkingSpace } from './ParkingSpaceForm';
import StorageSpaceForm, { StorageSpace } from './StorageSpaceForm';
import { ProgressiveDocumentUpload, DocumentType } from '../documents/ProgressiveDocumentUpload';
```

---

## 📦 ESTADO INTERNO (useState)

### **Estado Principal**
```typescript
// UI State
const [showDocUpload, setShowDocUpload] = useState(false);
const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
const [initializing, setInitializing] = useState(isEditing);
const [uploading, setUploading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});

// Business Logic State
const [propertyType, setPropertyType] = useState(() => getPropertyType());
const [owners, setOwners] = useState<Owner[]>(getInitialOwners);
const [formData, setFormData] = useState(getInitialFormData);
const [photoFiles, setPhotoFiles] = useState<File[]>([]);
const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
```

### **Estado Derivado (useMemo)**
```typescript
const getInitialOwners: Owner[]
const getInitialFormData: FormData
```

---

## ⚙️ FUNCIONES PRINCIPALES

### **Gestión de Propietarios**
```typescript
const addOwner = () => void
const removeOwner = (ownerId: string) => void
const updateOwner = (ownerId: string, field: keyof Owner, value: string) => void
const handleOwnerDocumentUpload = (ownerId: string, documentType: string, file: File) => Promise<void>
const handleOwnerDocumentRemove = (ownerId: string, documentType: string) => void
```

### **Gestión de Archivos**
```typescript
const handlePhotoUpload = (files: FileList) => Promise<void>
const removePhoto = (index: number) => void
const handleDocumentUpload = (documentType: string, file: File) => Promise<void>
const removeDocument = (documentType: string) => void
```

### **Utilidades**
```typescript
const getAvailableCommunes = (regionKey: string) => Commune[]
const handleRegionChange = (regionKey: string, isOwner: boolean = false) => void
```

### **Validación y Submit**
```typescript
const validateForm = () => boolean
const handleSubmit = async (e: React.FormEvent) => Promise<void>
const saveParkingSpaces = async (propertyId: string, parkingSpaces: ParkingSpace[]) => Promise<void>
const saveStorageSpaces = async (propertyId: string, storageSpaces: StorageSpace[]) => Promise<void>
```

---

## 🎯 PUNTOS DE RESPONSABILIDAD

### **1. Información Básica de Propiedad**
**Estado:** `formData` (parcial), `propertyType`
**Funciones:** `handleRegionChange`, `getAvailableCommunes`
**UI:** Campos de dirección, precio, tipo de propiedad

### **2. Características Internas**
**Estado:** `formData` (metros, dormitorios, baños, etc.)
**Funciones:** Ninguna específica
**UI:** Campos numéricos y booleanos

### **3. Espacios Adicionales**
**Estado:** ParkingSpace[], StorageSpace[] (a través de props)
**Funciones:** `saveParkingSpaces`, `saveStorageSpaces`
**UI:** `ParkingSpaceForm`, `StorageSpaceForm`

### **4. Gestión de Propietarios**
**Estado:** `owners`, `errors` (parcial)
**Funciones:** `addOwner`, `removeOwner`, `updateOwner`, `handleOwnerDocument*`
**UI:** Formularios dinámicos de propietarios

### **5. Gestión de Fotos**
**Estado:** `photoFiles`, `photoPreviews`
**Funciones:** `handlePhotoUpload`, `removePhoto`
**UI:** Upload y preview de imágenes

### **6. Gestión de Documentos**
**Estado:** Ninguno directo (gestionado por ProgressiveDocumentUpload)
**Funciones:** `handleDocumentUpload`, `removeDocument`
**UI:** `ProgressiveDocumentUpload`

### **7. Validación y Submit**
**Estado:** `loading`, `errors`, `uploading`
**Funciones:** `validateForm`, `handleSubmit`, `saveParkingSpaces`, `saveStorageSpaces`
**UI:** Estados de carga, mensajes de error

---

## 🔄 FLUJOS DE DATOS

### **Flujo Principal de Submit:**
1. `validateForm()` → valida todo el estado
2. `handleSubmit()` → coordina el envío
3. `saveParkingSpaces()` + `saveStorageSpaces()` → guarda espacios
4. Supabase operations → persiste en BD
5. `navigate()` → redirección

### **Flujo de Propietarios:**
1. `addOwner()` → agrega nuevo propietario vacío
2. `updateOwner()` → actualiza campos individuales
3. `handleOwnerDocumentUpload()` → gestiona archivos
4. `validateForm()` → valida consistencia

### **Flujo de Archivos:**
1. `handlePhotoUpload()` → procesa FileList
2. `removePhoto()` → elimina de arrays
3. `handleDocumentUpload()` → coordina con ProgressiveDocumentUpload

---

## ⚠️ DEPENDENCIAS CRUZADAS PROBLEMÁTICAS

### **Estado Compartido**
- `formData` usado por múltiples secciones
- `errors` compartido entre validaciones
- `propertyType` afecta lógica de múltiples componentes

### **Funciones con Efectos Secundarios**
- `handleSubmit` maneja múltiples responsabilidades
- `validateForm` valida todo el formulario
- Funciones de archivo modifican múltiples estados

### **Dependencias Circulares**
- `propertyType` determina qué campos mostrar
- Campos afectan validaciones
- Validaciones afectan estado de errores

---

## 📈 MÉTRICAS DE COMPLEJIDAD

| Aspecto | Valor | Nivel |
|---------|-------|-------|
| Líneas de Código | 3,394 | Muy Alto |
| Funciones | 15+ | Alto |
| Estados useState | 11 | Alto |
| Props del Componente | 4 | Bajo |
| Responsabilidades | 7 | Muy Alto |
| Imports | 8 | Moderado |

---

## 🎯 CONCLUSIONES DEL ANÁLISIS

### **Problemas Identificados:**
1. **Monolítico:** Una sola función maneja 7 responsabilidades
2. **Estado Acoplado:** Múltiples secciones comparten estado
3. **Funciones Grandes:** `handleSubmit` y `validateForm` son muy complejas
4. **Dependencias Cruzadas:** Cambios en una sección afectan otras

### **Oportunidades de Mejora:**
1. **Separación por Responsabilidades:** Extraer 5-6 subcomponentes
2. **Estado Local:** Cada componente maneja su propio estado
3. **Props Interface:** Comunicación clara entre componentes
4. **Validación Modular:** Validar secciones individualmente

---

*Documento generado: $(date)*
*Análisis realizado por: Sistema de Optimización*
