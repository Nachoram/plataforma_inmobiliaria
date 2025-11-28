# 🧩 COMPONENTES CANDIDATOS A EXTRACCIÓN

## 🎯 ESTRATEGIA DE EXTRACCIÓN

Basado en el análisis de dependencias, identificamos **6 componentes principales** que pueden ser extraídos del monolítico `RentalPublicationForm`.

---

## 📦 COMPONENTE 1: PropertyBasicInfo

### **Responsabilidad:**
Gestionar la información básica de la propiedad (tipo, dirección, precio, gastos comunes)

### **Estado Propio:**
```typescript
interface PropertyBasicInfoState {
  tipoPropiedad: string;
  address_street: string;
  address_number: string;
  address_department?: string;
  region: string;
  commune: string;
  price: string;
  common_expenses: string;
  description: string;
}
```

### **Props Interface:**
```typescript
interface PropertyBasicInfoProps {
  data: PropertyBasicInfoState;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  onPropertyTypeChange: (type: string) => void;
}
```

### **Funciones a Extraer:**
- `getAvailableCommunes()`
- `handleRegionChange()` (lógica básica)

### **Tamaño Estimado:** ~300-400 líneas
### **Complejidad:** Media
### **Dependencias:** Solo utilidades geográficas

---

## 📦 COMPONENTE 2: PropertyInternalFeatures

### **Responsabilidad:**
Gestionar características internas (metros, dormitorios, baños, amenities)

### **Estado Propio:**
```typescript
interface PropertyInternalFeaturesState {
  metrosUtiles: string;
  metrosTotales: string;
  bedrooms: string;
  bathrooms: string;
  anoConstruccion: string;
  tieneTerraza: string;
  tieneSalaEstar: string;
  // Campos específicos por tipo
  numeroBodega?: string;
  ubicacionBodega?: string;
  metrosBodega?: string;
  ubicacionEstacionamiento?: string;
  parcela_number?: string;
}
```

### **Props Interface:**
```typescript
interface PropertyInternalFeaturesProps {
  data: PropertyInternalFeaturesState;
  onChange: (field: string, value: any) => void;
  propertyType: string;
  errors: Record<string, string>;
  showSection: boolean; // Solo visible para ciertos tipos
}
```

### **Funciones a Extraer:**
- Lógica condicional de campos por tipo de propiedad

### **Tamaño Estimado:** ~400-500 líneas
### **Complejidad:** Media-Alta
### **Dependencias:** `propertyType` del componente padre

---

## 📦 COMPONENTE 3: PropertySpaces

### **Responsabilidad:**
Gestionar espacios adicionales (estacionamientos y bodegas)

### **Estado Propio:**
```typescript
interface PropertySpacesState {
  parkingSpaces: ParkingSpace[];
  storageSpaces: StorageSpace[];
}
```

### **Props Interface:**
```typescript
interface PropertySpacesProps {
  parkingSpaces: ParkingSpace[];
  storageSpaces: StorageSpace[];
  onParkingChange: (spaces: ParkingSpace[]) => void;
  onStorageChange: (spaces: StorageSpace[]) => void;
  propertyType: string;
  errors: Record<string, string>;
}
```

### **Subcomponentes Reutilizados:**
- `ParkingSpaceForm`
- `StorageSpaceForm`

### **Funciones a Extraer:**
- `saveParkingSpaces()`
- `saveStorageSpaces()`

### **Tamaño Estimado:** ~200-300 líneas
### **Complejidad:** Media
### **Dependencias:** Componentes existentes ya extraídos

---

## 📦 COMPONENTE 4: PropertyOwners

### **Responsabilidad:**
Gestionar la información de propietarios (múltiples propietarios soportados)

### **Estado Propio:**
```typescript
interface PropertyOwnersState {
  owners: Owner[];
}
```

### **Props Interface:**
```typescript
interface PropertyOwnersProps {
  owners: Owner[];
  onOwnersChange: (owners: Owner[]) => void;
  errors: Record<string, string>;
  onDocumentUpload: (ownerId: string, docType: string, file: File) => Promise<void>;
  onDocumentRemove: (ownerId: string, docType: string) => void;
}
```

### **Funciones a Extraer:**
- `addOwner()`
- `removeOwner()`
- `updateOwner()`
- `handleOwnerDocumentUpload()`
- `handleOwnerDocumentRemove()`

### **Tamaño Estimado:** ~600-700 líneas
### **Complejidad:** Alta
### **Dependencias:** Lógica compleja de propietarios

---

## 📦 COMPONENTE 5: PropertyPhotos

### **Responsabilidad:**
Gestionar la subida y preview de fotos de la propiedad

### **Estado Propio:**
```typescript
interface PropertyPhotosState {
  photoFiles: File[];
  photoPreviews: string[];
  uploading: boolean;
}
```

### **Props Interface:**
```typescript
interface PropertyPhotosProps {
  photoFiles: File[];
  photoPreviews: string[];
  onPhotosChange: (files: File[], previews: string[]) => void;
  maxPhotos?: number;
  errors: Record<string, string>;
}
```

### **Funciones a Extraer:**
- `handlePhotoUpload()`
- `removePhoto()`

### **Tamaño Estimado:** ~200-250 líneas
### **Complejidad:** Media-Baja
### **Dependencias:** File API y Supabase Storage

---

## 📦 COMPONENTE 6: PropertyDocuments

### **Responsabilidad:**
Gestionar documentos legales y certificados

### **Estado Propio:**
```typescript
interface PropertyDocumentsState {
  // Estado mínimo - la lógica compleja queda en ProgressiveDocumentUpload
}
```

### **Props Interface:**
```typescript
interface PropertyDocumentsProps {
  propertyType: string;
  owners: Owner[];
  onDocumentUpload: (docType: string, file: File) => Promise<void>;
  onDocumentRemove: (docType: string) => void;
  errors: Record<string, string>;
}
```

### **Subcomponentes Reutilizados:**
- `ProgressiveDocumentUpload`

### **Funciones a Extraer:**
- `handleDocumentUpload()`
- `removeDocument()`

### **Tamaño Estimado:** ~150-200 líneas
### **Complejidad:** Baja-Media
### **Dependencias:** `ProgressiveDocumentUpload` existente

---

## 🔄 ESTRATEGIA DE EXTRACCIÓN POR FASES

### **Fase 1: Componentes Independientes (Baja Riesgo)**
1. `PropertyPhotos` - Estado aislado, lógica simple
2. `PropertyDocuments` - Usa componente existente
3. `PropertyBasicInfo` - Lógica de direcciones

### **Fase 2: Componentes con Dependencias (Riesgo Medio)**
4. `PropertyInternalFeatures` - Depende de `propertyType`
5. `PropertySpaces` - Depende de `propertyType`

### **Fase 3: Componentes Complejos (Alto Riesgo)**
6. `PropertyOwners` - Lógica más compleja, múltiples responsabilidades

---

## 📊 IMPACTO ESTIMADO

### **Métricas por Componente:**

| Componente | Líneas Originales | Líneas Extraídas | Reducción |
|------------|-------------------|------------------|-----------|
| PropertyBasicInfo | ~400 | ~350 | ~50 |
| PropertyInternalFeatures | ~400 | ~350 | ~50 |
| PropertySpaces | ~300 | ~250 | ~50 |
| PropertyOwners | ~700 | ~600 | ~100 |
| PropertyPhotos | ~250 | ~200 | ~50 |
| PropertyDocuments | ~200 | ~150 | ~50 |
| **TOTAL** | ~2,250 | ~2,000 | **~250** |

### **Componente Principal Después de Extracción:**
- **Líneas restantes:** ~1,144 (de 3,394)
- **Reducción total:** ~2,250 líneas (~66%)
- **Funciones restantes:** `validateForm`, `handleSubmit`, coordinación

---

## 🔧 INTERFACES COMUNES

### **Shared Types:**
```typescript
// Tipos compartidos entre componentes
type PropertyType = 'Casa' | 'Departamento' | 'Oficina' | 'Local Comercial' | 'Bodega' | 'Estacionamiento' | 'Parcela';

interface ValidationErrors {
  [field: string]: string;
}

interface ComponentWithErrors {
  errors: ValidationErrors;
  onErrorChange?: (field: string, error: string) => void;
}
```

### **Event Handlers:**
```typescript
// Handlers estandarizados
type FieldChangeHandler = (field: string, value: any) => void;
type FileUploadHandler = (type: string, file: File) => Promise<void>;
type FileRemoveHandler = (type: string) => void;
```

---

## ⚠️ CONSIDERACIONES DE MIGRACIÓN

### **Estado Compartido:**
- `propertyType`: Necesita ser pasado como prop a componentes dependientes
- `errors`: Sistema de errores centralizado vs. local por componente

### **Validación:**
- Validación global vs. validación por secciones
- Coordinación de errores entre componentes

### **Testing:**
- Tests unitarios para cada componente
- Tests de integración para el formulario completo
- Mocks para dependencias externas

---

## 🎯 CRITERIOS DE ÉXITO

### **Por Componente:**
- ✅ Funcionalidad idéntica al original
- ✅ Props interface clara y documentada
- ✅ Tests unitarios con >80% cobertura
- ✅ Storybook stories para desarrollo

### **Global:**
- ✅ Reducción de complejidad del componente principal
- ✅ Mantenibilidad mejorada
- ✅ Performance similar o mejorada
- ✅ Developer experience optimizada

---

*Documento generado: $(date)*
*Análisis realizado por: Sistema de Optimización*
