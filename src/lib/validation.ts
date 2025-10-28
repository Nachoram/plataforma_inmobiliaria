/**
 * Utilidades de validación para el sistema inmobiliario
 */

/**
 * Valida si una cadena es un UUID válido (formato estándar)
 * @param value - Valor a validar
 * @returns true si es un UUID válido, false en caso contrario
 */
export function isValidUUID(value: any): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  // Patrón regex para UUID v4 (el más común en PostgreSQL)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(value);
}

/**
 * Valida si una cadena es un código personalizado del sistema (PROP_, APP_, GUAR_, etc.)
 * @param value - Valor a validar
 * @returns true si es un código personalizado, false en caso contrario
 */
export function isCustomCode(value: any): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  // Patrones de códigos personalizados
  const customCodePatterns = [
    /^PROP_\d+_[a-f0-9]+$/,  // PROP_1704067200_a1b2c3d4
    /^APP_\d+_[a-f0-9]+$/,   // APP_1704067200_a1b2c3d4
    /^GUAR_\d+_[a-f0-9]+$/,  // GUAR_1704067200_a1b2c3d4
    /^OWNER_\d+_[a-f0-9]+$/, // OWNER_1704067200_a1b2c3d4
  ];

  return customCodePatterns.some(pattern => pattern.test(value));
}

/**
 * Determina el tipo de identificador
 * @param value - Valor a evaluar
 * @returns Tipo de identificador o null si no es válido
 */
export function getIdentifierType(value: any): 'uuid' | 'custom_code' | 'invalid' {
  if (isValidUUID(value)) {
    return 'uuid';
  }

  if (isCustomCode(value)) {
    return 'custom_code';
  }

  return 'invalid';
}

/**
 * Valida y prepara un identificador para consultas de base de datos
 * @param value - Identificador a validar
 * @param expectedType - Tipo esperado ('uuid' o 'custom_code')
 * @param context - Contexto para el mensaje de error
 * @throws Error si el identificador no es válido o del tipo esperado
 */
export function validateIdentifier(
  value: any,
  expectedType: 'uuid' | 'custom_code',
  context: string = 'consulta'
): string {
  const type = getIdentifierType(value);

  if (type === 'invalid') {
    throw new Error(
      `Identificador inválido en ${context}: "${value}". ` +
      'Se esperaba un UUID válido o código personalizado.'
    );
  }

  if (type !== expectedType) {
    throw new Error(
      `Tipo de identificador incorrecto en ${context}: "${value}" es un ${type} ` +
      `pero se esperaba un ${expectedType}.`
    );
  }

  return value;
}

/**
 * Función helper segura para consultas que esperan UUIDs
 * @param identifier - Identificador a usar en la consulta
 * @param tableName - Nombre de la tabla para contexto
 * @param columnName - Nombre de la columna para contexto
 * @returns El identificador si es válido
 * @throws Error con mensaje descriptivo si no es válido
 */
export function safeUUIDQuery(
  identifier: any,
  tableName: string,
  columnName: string = 'id'
): string {
  return validateIdentifier(
    identifier,
    'uuid',
    `consulta a ${tableName}.${columnName}`
  );
}

/**
 * Función helper segura para consultas que esperan códigos personalizados
 * @param identifier - Identificador a usar en la consulta
 * @param tableName - Nombre de la tabla para contexto
 * @param columnName - Nombre de la columna para contexto
 * @returns El identificador si es válido
 * @throws Error con mensaje descriptivo si no es válido
 */
export function safeCustomCodeQuery(
  identifier: any,
  tableName: string,
  columnName: string
): string {
  return validateIdentifier(
    identifier,
    'custom_code',
    `consulta a ${tableName}.${columnName}`
  );
}

/**
 * Convierte un código personalizado a UUID si es necesario
 * Esta función es un placeholder - en una implementación real,
 * debería consultar la base de datos para hacer la conversión
 * @param code - Código personalizado
 * @returns Promise que resuelve al UUID correspondiente
 */
export async function convertCustomCodeToUUID(code: string): Promise<string | null> {
  // Esta función necesitaría implementar la lógica específica
  // para convertir códigos personalizados a UUIDs
  // Por ahora retorna null para indicar que no está implementada
  console.warn(`Conversión de código personalizado no implementada: ${code}`);
  return null;
}
