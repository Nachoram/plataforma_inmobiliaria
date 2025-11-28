import fs from 'fs';

const content = fs.readFileSync('src/components/properties/RentalPublicationForm.tsx', 'utf8');
const lines = content.split('\n');

// Encontrar exactamente dónde está la sección de propietarios
let ownersSectionStart = -1;
let ownersSectionEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Sección 4: Datos del Propietario') && lines[i+1].includes('<div className="space-y-3">')) {
    ownersSectionStart = i;
  }
  if (lines[i].includes('Sección 3: Fotos de la Propiedad') && lines[i-1] === '') {
    ownersSectionEnd = i - 1;
    break;
  }
}

console.log(`Owners section starts at line: ${ownersSectionStart + 1}`);
console.log(`Owners section ends at line: ${ownersSectionEnd + 1}`);

// Crear el reemplazo
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

// Reemplazar la sección completa
const beforeSection = lines.slice(0, ownersSectionStart).join('\n');
const afterSection = lines.slice(ownersSectionEnd + 1).join('\n');

const newContent = beforeSection + '\n' + replacement + '\n' + afterSection;

fs.writeFileSync('src/components/properties/RentalPublicationForm.tsx', newContent, 'utf8');

console.log('Owners section replaced successfully');

