import fs from 'fs';

// Leer el archivo
const content = fs.readFileSync('src/components/properties/RentalPublicationForm.tsx', 'utf8');

// Dividir en líneas
const lines = content.split('\n');

// Encontrar las líneas que contienen el componente PropertyOwners y la sección de fotos
let propertyOwnersLine = -1;
let photosSectionLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<PropertyOwners')) {
    propertyOwnersLine = i;
  }
  if (lines[i].includes('Sección 3: Fotos de la Propiedad')) {
    photosSectionLine = i;
    break;
  }
}

console.log(`PropertyOwners starts at line: ${propertyOwnersLine + 1}`);
console.log(`Photos section starts at line: ${photosSectionLine + 1}`);

// Encontrar dónde termina el componente PropertyOwners (línea con />)
let propertyOwnersEndLine = -1;
for (let i = propertyOwnersLine; i < lines.length; i++) {
  if (lines[i].includes('/>') && lines[i - 1].includes('PropertyOwners')) {
    propertyOwnersEndLine = i;
    break;
  }
}

console.log(`PropertyOwners ends at line: ${propertyOwnersEndLine + 1}`);

// Remover las líneas entre propertyOwnersEndLine + 1 y photosSectionLine - 1
const startRemove = propertyOwnersEndLine + 1;
const endRemove = photosSectionLine - 1;

console.log(`Removing lines ${startRemove + 1} to ${endRemove + 1}`);

const newLines = [
  ...lines.slice(0, startRemove),
  ...lines.slice(endRemove + 1)
];

// Escribir el archivo
fs.writeFileSync('src/components/properties/RentalPublicationForm.tsx', newLines.join('\n'), 'utf8');

console.log('File cleaned successfully');
