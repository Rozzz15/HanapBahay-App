-- ============================================
-- Simple check - shows all tables in your database
-- ============================================

-- List all tables that exist
SELECT 
    'Table exists: ' || table_name as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Count total tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
