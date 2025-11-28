import fs from 'fs';

const content = fs.readFileSync('src/components/properties/RentalPublicationForm.tsx', 'utf8');
const lines = content.split('\n');

// Remover desde línea 1684 hasta línea 1794 (contenido antiguo de PropertyInternalFeatures)
const startRemove = 1683; // Después de PropertyInternalFeatures
const endRemove = 1794;   // Antes de Sección 3.5

console.log(`Removing lines ${startRemove + 1} to ${endRemove + 1}`);

const newLines = [
  ...lines.slice(0, startRemove),
  ...lines.slice(endRemove + 1)
];

fs.writeFileSync('src/components/properties/RentalPublicationForm.tsx', newLines.join('\n'), 'utf8');

console.log('Old PropertyInternalFeatures content removed successfully');

