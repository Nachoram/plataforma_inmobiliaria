import fs from 'fs';

// Leer el archivo
const content = fs.readFileSync('src/components/properties/RentalPublicationForm.tsx', 'utf8');
const lines = content.split('\n');

// Mantener líneas 1-1671 y 2215 hasta el final
const newContent = [
  ...lines.slice(0, 1671), // Hasta el componente PropertyBasicInfo
  ...lines.slice(2214) // Desde la Sección 2 hasta el final
].join('\n');

// Escribir el archivo corregido
fs.writeFileSync('src/components/properties/RentalPublicationForm.tsx', newContent);

console.log('Archivo corregido exitosamente');
