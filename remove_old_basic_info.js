import fs from 'fs';

const content = fs.readFileSync('src/components/properties/RentalPublicationForm.tsx', 'utf8');
const lines = content.split('\n');

// Remover desde línea 1669 hasta línea 2220 (contenido antiguo de PropertyBasicInfo)
const startRemove = 1668; // Línea después del comentario de Sección 2
const endRemove = 2220;   // Línea antes del comentario real de Sección 2

console.log(`Removing lines ${startRemove + 1} to ${endRemove + 1}`);

const newLines = [
  ...lines.slice(0, startRemove),
  ...lines.slice(endRemove + 1)
];

fs.writeFileSync('src/components/properties/RentalPublicationForm.tsx', newLines.join('\n'), 'utf8');

console.log('Old PropertyBasicInfo content removed successfully');

