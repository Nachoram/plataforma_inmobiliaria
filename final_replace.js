import fs from 'fs';

const content = fs.readFileSync('src/components/properties/RentalPublicationForm.tsx', 'utf8');
const lines = content.split('\n');

// La sección de propietarios comienza en la línea 2343 (índice 2342)
// y termina en la línea 1650 (índice 1649)
const startReplace = 2342; // Línea 2343 - 1 (0-indexed)
const endReplace = 1649;   // Línea 1650 - 1 (0-indexed)

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
          />`;

const beforeSection = lines.slice(0, startReplace).join('\n');
const afterSection = lines.slice(endReplace + 1).join('\n');

const newContent = beforeSection + '\n' + replacement + '\n' + afterSection;

fs.writeFileSync('src/components/properties/RentalPublicationForm.tsx', newContent, 'utf8');

console.log('PropertyOwners section replaced successfully');

