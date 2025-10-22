-- 🔍 Ver qué columnas tiene realmente la tabla guarantors

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'guarantors' 
ORDER BY ordinal_position;

