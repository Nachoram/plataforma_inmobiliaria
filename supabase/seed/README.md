# 🗃️ Database Seeds - Datos Iniciales para Desarrollo

Este directorio contiene scripts SQL para poblar la base de datos con datos de prueba realistas, ideales para desarrollo y testing de la plataforma inmobiliaria.

## 📁 Estructura de Archivos

```
supabase/seed/
├── seed_users.sql           # 👥 Usuarios y perfiles base
├── seed_properties.sql      # 🏠 Propiedades en arriendo y venta
├── seed_applications.sql    # 📋 Aplicaciones/postulaciones
├── seed_applicants.sql      # 👤 Perfiles detallados de postulantes
├── seed_documents.sql       # 📄 Documentos de prueba
├── init_seed_database.sql   # 🚀 Script maestro
└── README.md               # 📖 Este archivo
```

## 🎯 Propósito

Los seeds proporcionan:
- **Datos realistas** para testing de UI/UX
- **Escenarios completos** de uso de la plataforma
- **Diferentes tipos de usuarios** y propiedades
- **Estados variados** (pendiente, aprobado, rechazado)
- **Documentos de prueba** con diferentes estados de procesamiento

## 🚀 Cómo Ejecutar

### Opción 1: Script Maestro (Recomendado)
```bash
# Ejecutar todos los seeds automáticamente
supabase db seed --file supabase/seed/init_seed_database.sql
```

### Opción 2: Seeds Individuales
```bash
# Ejecutar seeds uno por uno (en orden)
supabase db seed --file supabase/seed/seed_users.sql
supabase db seed --file supabase/seed/seed_properties.sql
supabase db seed --file supabase/seed/seed_applications.sql
supabase db seed --file supabase/seed/seed_applicants.sql
supabase db seed --file supabase/seed/seed_documents.sql
```

### Opción 3: Usando psql
```bash
# Conectar a la base de datos y ejecutar
psql -h localhost -U postgres -d postgres -f supabase/seed/init_seed_database.sql
```

## 👥 Usuarios de Prueba

| Email | Rol | Tipo | Descripción |
|-------|-----|------|-------------|
| `admin@test.com` | Administrador | Natural | Usuario administrador del sistema |
| `owner@test.com` | Propietario | Natural | María González - Arquitecta |
| `owner2@test.com` | Propietario | Jurídica | Inmobiliaria Premium SPA |
| `applicant@test.com` | Postulante | Natural | Juan Pérez - Ingeniero Civil |
| `applicant2@test.com` | Postulante | Natural | Ana Rodríguez - Médica |
| `applicant3@test.com` | Postulante | Jurídica | Constructora Moderna Ltda. |

## 🏠 Propiedades Incluidas

### Arriendo (4 propiedades)
- **Departamento Santiago Centro** - $450.000 + $80.000 gastos comunes
- **Casa Las Condes** - $1.200.000 + $150.000 gastos comunes
- **Departamento Ñuñoa** - $650.000 + $120.000 gastos comunes
- **Departamento Concepción** - $380.000 + $60.000 gastos comunes

### Venta (4 propiedades)
- **Casa Viña del Mar** - $95.000.000
- **Penthouse Providencia** - $180.000.000
- **Oficina Santiago Centro** - $250.000.000
- **Local comercial La Reina** - $120.000.000

### Estados Especiales (2 propiedades)
- **Arrendada** - Departamento en Providencia
- **Vendida** - Casa en Las Condes

## 📋 Aplicaciones de Prueba

| Aplicación | Postulante | Propiedad | Estado | Broker Type |
|------------|------------|-----------|--------|-------------|
| App 1 | Juan Pérez | Depto Santiago | Pendiente | Independiente |
| App 2 | Ana Rodríguez | Casa Las Condes | Pendiente | Firma |
| App 3 | Constructora Moderna | Oficina Santiago | Pendiente | Firma |
| App 4 | Juan Pérez | Depto Ñuñoa | Aprobada | Independiente |
| App 5 | Ana Rodríguez | Penthouse Providencia | Rechazada | Independiente |
| App 6 | Constructora Moderna | Local La Chascona | Info solicitada | Firma |

## 👤 Perfiles de Postulantes

### Características Incluidas:
- **Tipos de entidad**: Natural y Jurídica
- **Ingresos**: $1.8M - $15M mensuales
- **Profesiones**: Ingeniero, Médica, Abogado, Constructora
- **Broker types**: Independiente y de firma
- **Intentions**: Arriendo y compra

### Postulantes Destacados:
- **Juan Pérez**: Ingeniero Civil independiente, ingresos $2.5M
- **Ana & Carlos Rodríguez**: Familia médica, ingresos combinados $6M
- **Constructora Moderna**: Empresa constructora, ingresos $15M

## 📄 Documentos de Prueba

### Tipos Incluidos:
- **Identificación**: Cédula de identidad, pasaporte, certificado matrimonio
- **Laboral**: Liquidación sueldo, contrato trabajo, referencias
- **Financiero**: Extracto bancario, informe comercial

### Estados de Procesamiento:
- **Processed** (6 documentos) - Completamente procesados con OCR
- **Processing** (2 documentos) - En proceso de análisis
- **Uploaded** (1 documento) - Pendiente de procesamiento
- **Failed** (1 documento) - Error en procesamiento

## 🔧 Funcionalidades Probadas

Los seeds permiten probar:
- ✅ **Autenticación** y perfiles de usuario
- ✅ **Listado de propiedades** por tipo y ubicación
- ✅ **Sistema de postulaciones** con diferentes estados
- ✅ **Múltiples postulantes** por aplicación
- ✅ **Documentos y verificación** con OCR simulado
- ✅ **Brokers independientes** vs brokers de firma
- ✅ **Personas naturales** vs empresas
- ✅ **Diferentes flujos** de aprobación/rechazo

## ⚠️ Consideraciones Importantes

### Limpieza de Datos
- Los scripts incluyen secciones comentadas para limpiar datos existentes
- **Descomenta estas secciones solo en desarrollo**
- **Nunca ejecutes limpieza en producción**

### Dependencias
Los seeds deben ejecutarse en este orden:
1. `seed_users.sql` - Crea usuarios base
2. `seed_properties.sql` - Requiere propietarios
3. `seed_applications.sql` - Requiere propiedades y postulantes
4. `seed_applicants.sql` - Requiere aplicaciones
5. `seed_documents.sql` - Requiere postulantes

### IDs Consistentes
- Todos los IDs usan el prefijo `550e8400-e29b-41d4-a716-44665544`
- Los últimos dígitos varían por tipo de entidad
- **No modifiques los IDs** para mantener consistencia

## 🐛 Troubleshooting

### Error de Foreign Key
```
Si obtienes errores de foreign key, ejecuta los seeds en orden correcto
```

### Error de Duplicados
```
Los seeds usan ON CONFLICT DO NOTHING para evitar duplicados
```

### Error de Permisos
```
Asegúrate de tener permisos de escritura en la base de datos
```

## 📊 Verificación

Después de ejecutar los seeds, verifica con:
```sql
-- Contar registros por tabla
SELECT 'users' as table_name, COUNT(*) as count FROM profiles WHERE id LIKE '550e8400-e29b-41d4-a716-44665544%'
UNION ALL
SELECT 'properties', COUNT(*) FROM properties WHERE id LIKE '660e8400-e29b-41d4-a716-44665544%'
UNION ALL
SELECT 'applications', COUNT(*) FROM applications WHERE id LIKE '770e8400-e29b-41d4-a716-44665544%'
UNION ALL
SELECT 'applicants', COUNT(*) FROM application_applicants WHERE id LIKE '880e8400-e29b-41d4-a716-44665544%'
UNION ALL
SELECT 'documents', COUNT(*) FROM documents WHERE id LIKE '990e8400-e29b-41d4-a716-44665544%';
```

## 🎉 Resultado Esperado

Después de ejecutar exitosamente, tendrás:
- **6 usuarios** con perfiles completos
- **10 propiedades** en diferentes estados y ubicaciones
- **6 aplicaciones** con estados variados
- **7 postulantes detallados** (algunos con múltiples por aplicación)
- **10 documentos** en diferentes estados de procesamiento

¡La base de datos estará lista para desarrollo y testing completo! 🚀
