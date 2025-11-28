import fs from 'fs';

const content = fs.readFileSync('src/components/properties/RentalPublicationForm.tsx', 'utf8');
let lines = content.split('\n');

// 1. Agregar imports
const importIndex = lines.findIndex(line => line.includes('ProgressiveDocumentUpload'));
if (importIndex !== -1) {
  lines.splice(importIndex + 1, 0,
    "import { PropertyBasicInfo } from './rental-form/components/PropertyBasicInfo/PropertyBasicInfo';",
    "import { PropertyInternalFeatures } from './rental-form/components/PropertyInternalFeatures/PropertyInternalFeatures';",
    "import { PropertyOwners } from './rental-form/components/PropertyOwners/PropertyOwners';"
  );
}

// 2. Reemplazar PropertyBasicInfo (Sección 1)
const basicInfoStart = lines.findIndex(line => line.includes('Sección 1: Información de la Propiedad') && line.includes('div className="space-y-3"'));
const basicInfoEnd = lines.findIndex(line => line.includes('Sección 2: Características Internas'));

if (basicInfoStart !== -1 && basicInfoEnd !== -1) {
  const replacement = `          {/* Sección 1: Información de la Propiedad */}
          <PropertyBasicInfo
            data={formData}
            onChange={(field, value) => setFormData({ ...formData, [field]: value })}
            onPropertyTypeChange={setPropertyType}
            errors={errors}
            chileRegionsCommunes={CHILE_REGIONS_COMMUNES}
            handleRegionChange={handleRegionChange}
            propertyType={propertyType}
            isParking={isParking}
          />

          {/* Sección 2: Características Internas */}`;

  lines.splice(basicInfoStart, basicInfoEnd - basicInfoStart, replacement);
}

// 3. Reemplazar PropertyInternalFeatures (Sección 2)
const internalStart = lines.findIndex(line => line.includes('Sección 2: Características Internas') && !line.includes('PropertyBasicInfo'));
const spacesStart = lines.findIndex(line => line.includes('Sección 2.5: Espacios'));

if (internalStart !== -1 && spacesStart !== -1) {
  const replacement = `          {/* Sección 2: Características Internas */}
          <PropertyInternalFeatures
            data={{
              sistemaAguaCaliente: formData.sistemaAguaCaliente,
              tipoCocina: formData.tipoCocina,
              tieneSalaEstar: formData.tieneSalaEstar,
              parkingSpaces: formData.parkingSpaces,
              storageSpaces: formData.storageSpaces
            }}
            onChange={(field, value) => setFormData({ ...formData, [field]: value })}
            propertyType={propertyType}
            showSection={['Casa', 'Departamento', 'Oficina'].includes(propertyType)}
            errors={{}}
          />

          {/* Sección 3.5: Características de Oficina */}`;

  lines.splice(internalStart, spacesStart - internalStart, replacement);
}

// 4. Reemplazar PropertyOwners (Sección 4)
const ownersStart = lines.findIndex(line => line.includes('Sección 4: Datos del Propietario') && !line.includes('PropertyInternalFeatures'));
const photosStart = lines.findIndex(line => line.includes('Sección 3: Fotos de la Propiedad'));

if (ownersStart !== -1 && photosStart !== -1) {
  const replacement = `          {/* Sección 4: Datos del Propietario */}
          <PropertyOwners
            owners={owners}
            onAddOwner={addOwner}
            onRemoveOwner={removeOwner}
            onUpdateOwner={updateOwner}
            onDocumentUpload={handleOwnerDocumentUpload}
            onDocumentRemove={handleOwnerDocumentRemove}
            maxOwners={5}
            errors={errors}
          />

          {/* Sección 3: Fotos de la Propiedad */}`;

  lines.splice(ownersStart, photosStart - ownersStart, replacement);
}

fs.writeFileSync('src/components/properties/RentalPublicationForm.tsx', lines.join('\n'), 'utf8');

console.log('Complete integration completed successfully');

