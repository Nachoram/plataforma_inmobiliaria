
export function sanitizeText(text: string, maxLength: number = 50): string {
  if (!text) return '';
  
  // Normalizar acentos
  let sanitized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'n');
  
  // Reemplazar espacios múltiples
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Reemplazar espacios con guiones bajos
  sanitized = sanitized.replace(/\s/g, '_');
  
  // Remover caracteres especiales
  sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '');
  
  // Limitar longitud
  sanitized = sanitized.substring(0, maxLength);
  
  return sanitized;
}

export function extractUserName(user?: { name?: string; last_name?: string; first_name?: string; paternal_last_name?: string }): string {
  if (!user) return 'Usuario_Desconocido';
  
  let userName = '';
  
  // Support both snake_case (DB) and camelCase (frontend sometimes)
  const lastName = user.last_name || user.paternal_last_name;
  const firstName = user.name || user.first_name;

  if (lastName) {
    userName = lastName;
    if (firstName) {
      userName += ` ${firstName}`;
    }
  } else if (firstName) {
    userName = firstName;
  } else {
    return 'Usuario_Desconocido';
  }
  
  return sanitizeText(userName, 40);
}

export function extractPropertyAddress(property?: {
  street?: string;
  number?: string;
  address?: string;
  location?: string;
  commune?: string;
  address_street?: string;
  address_number?: string;
  id?: string;
}): string {
  if (!property) return 'Propiedad_Desconocida';
  
  let address = '';
  
  // Support different property structures
  const street = property.street || property.address_street;
  const number = property.number || property.address_number;

  if (street) {
    address = street;
    if (number) {
      address += ` ${number}`;
    }
  } else if (property.address) {
    address = property.address;
  } else if (property.location) {
    address = property.location;
  } else if (property.commune) {
    address = property.commune;
  } else if (property.id) {
    return `prop_${property.id.substring(0, 8)}`;
  } else {
    return 'Propiedad_Sin_Direccion';
  }
  
  return sanitizeText(address, 40);
}

export function extractFieldName(fieldLabel: string): string {
  return sanitizeText(fieldLabel, 50);
}

export function extractFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return fileName.substring(lastDotIndex).toLowerCase();
}

export function createDocumentFileName(
  user: { name?: string; last_name?: string; first_name?: string; paternal_last_name?: string },
  property: {
    street?: string;
    number?: string;
    address?: string;
    location?: string;
    commune?: string;
    address_street?: string;
    address_number?: string;
    id?: string;
  },
  fieldLabel: string,
  originalFileName: string
): string {
  const userNameStr = extractUserName(user);
  const propertyAddrStr = extractPropertyAddress(property);
  const fieldNameStr = extractFieldName(fieldLabel);
  const extension = extractFileExtension(originalFileName);
  
  return `${userNameStr}_${propertyAddrStr}_${fieldNameStr}${extension}`;
}

