import fs from 'fs';

const content = fs.readFileSync('src/components/properties/RentalPublicationForm.tsx', 'utf8');
const lines = content.split('\n');

// Encontrar el bloque roto (líneas con select de tipo de propiedad)
let brokenCodeStart = -1;
let brokenCodeEnd = -1;

for (let i = 0; i < lines.length; i++) {
  // Buscar el inicio del bloque roto
  if (lines[i].includes('className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"') &&
      lines[i+1] === '                >') {
    brokenCodeStart = i;
  }

  // Buscar el fin del bloque roto
  if (lines[i].includes('Campo específico: Número de Bodega') && brokenCodeStart !== -1) {
    brokenCodeEnd = i - 1;
    break;
  }
}

console.log(`Broken code starts at line: ${brokenCodeStart + 1}`);
console.log(`Broken code ends at line: ${brokenCodeEnd + 1}`);

if (brokenCodeStart !== -1 && brokenCodeEnd !== -1) {
  // Remover el bloque roto
  const newLines = [
    ...lines.slice(0, brokenCodeStart),
    ...lines.slice(brokenCodeEnd + 1)
  ];

  fs.writeFileSync('src/components/properties/RentalPublicationForm.tsx', newLines.join('\n'), 'utf8');
  console.log('Broken code removed successfully');
} else {
  console.log('Broken code not found');
}

