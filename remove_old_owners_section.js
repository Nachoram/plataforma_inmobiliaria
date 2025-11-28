import fs from 'fs';

const content = fs.readFileSync('src/components/properties/RentalPublicationForm.tsx', 'utf8');
const lines = content.split('\n');

// Encontrar las líneas
let startRemove = -1;
let endRemove = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<PropertyOwners') && lines[i+1] === '') {
    // La línea siguiente al PropertyOwners es donde comienza el contenido antiguo
    startRemove = i + 2; // Después de PropertyOwners />
  }
  if (lines[i].includes('{/* Sección 3: Fotos de la Propiedad */}') && lines[i-1] === '') {
    // La línea anterior al comentario de fotos es donde termina el contenido antiguo
    endRemove = i - 1;
    break;
  }
}

console.log(`Removing lines ${startRemove + 1} to ${endRemove + 1}`);

const newLines = [
  ...lines.slice(0, startRemove),
  ...lines.slice(endRemove + 1)
];

fs.writeFileSync('src/components/properties/RentalPublicationForm.tsx', newLines.join('\n'), 'utf8');

console.log('Old owners section removed successfully');
