import fs from 'fs';

const content = fs.readFileSync('src/components/properties/RentalPublicationForm.tsx', 'utf8');
const lines = content.split('\n');

// Encontrar PropertyOwners y la sección de fotos
let propertyOwnersEnd = -1;
let photosSection = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<PropertyOwners') && lines[i+9] === '          />') {
    propertyOwnersEnd = i + 9; // La línea de cierre />
  }
  if (lines[i].includes('Sección 3: Fotos de la Propiedad')) {
    photosSection = i;
    break;
  }
}

console.log(`PropertyOwners ends at line: ${propertyOwnersEnd + 1}`);
console.log(`Photos section starts at line: ${photosSection + 1}`);

// Remover desde propertyOwnersEnd + 2 hasta photosSection - 1
const startRemove = propertyOwnersEnd + 2;
const endRemove = photosSection - 1;

console.log(`Removing lines ${startRemove + 1} to ${endRemove + 1}`);

const newLines = [
  ...lines.slice(0, startRemove),
  ...lines.slice(endRemove + 1)
];

fs.writeFileSync('src/components/properties/RentalPublicationForm.tsx', newLines.join('\n'), 'utf8');

console.log('Old owners section removed successfully');
