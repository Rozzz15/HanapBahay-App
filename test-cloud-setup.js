/**
 * Alternative env loader - bypasses dotenv issues
 */

const fs = require('fs');
const path = require('path');

// Read .env.local directly
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('\n🔍 Reading .env.local directly...\n');

// Parse the file line by line
const lines = envContent.split('\n');
let loaded = 0;

lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
    }

    // Parse KEY=VALUE
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        const value = trimmedLine.substring(equalIndex + 1).trim();

        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');

        // Set environment variable
        process.env[key] = cleanValue;
        loaded++;

        console.log(`✅ Loaded: ${key} = ${cleanValue.substring(0, 50)}...`);
    }
});

console.log(`\n📊 Total variables loaded: ${loaded}\n`);

// Now run the actual tests
console.log('='.repeat(60));
console.log('🧪 Testing Railway PostgreSQL + Supabase Storage');
console.log('='.repeat(60) + '\n');

// Colors
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const blue = '\x1b[36m';
const reset = '\x1b[0m';

// Test 1: Check Environment Variables
console.log(yellow + '📋 Step 1: Checking environment variables...' + reset);

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const API_URL = process.env.EXPO_PUBLIC_API_URL;

let envCheckPassed = true;

if (!DATABASE_URL) {
    console.log(red + '❌ DATABASE_URL not found!' + reset);
    envCheckPassed = false;
} else {
    console.log(green + '✅ DATABASE_URL configured' + reset);
    console.log('   ' + DATABASE_URL.substring(0, 50) + '...');
}

if (!SUPABASE_URL) {
    console.log(red + '❌ EXPO_PUBLIC_SUPABASE_URL not found!' + reset);
    envCheckPassed = false;
} else {
    console.log(green + '✅ EXPO_PUBLIC_SUPABASE_URL configured' + reset);
    console.log('   ' + SUPABASE_URL);
}

if (!SUPABASE_KEY) {
    console.log(red + '❌ EXPO_PUBLIC_SUPABASE_ANON_KEY not found!' + reset);
    envCheckPassed = false;
} else {
    console.log(green + '✅ EXPO_PUBLIC_SUPABASE_ANON_KEY configured' + reset);
    console.log('   ' + SUPABASE_KEY.substring(0, 30) + '...');
}

if (!API_URL) {
    console.log(red + '❌ EXPO_PUBLIC_API_URL not found!' + reset);
    envCheckPassed = false;
} else {
    console.log(green + '✅ EXPO_PUBLIC_API_URL configured' + reset);
    console.log('   ' + API_URL);
}

console.log('');

if (!envCheckPassed) {
    console.log(red + '⚠️  Some environment variables are missing!' + reset);
    process.exit(1);
}

console.log(green + '✅ All environment variables configured!\n' + reset);

// Test 2: Railway PostgreSQL
console.log(yellow + '📋 Step 2: Testing Railway PostgreSQL connection...' + reset);

const { Pool } = require('pg');

const testRailway = async () => {
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes('railway.app') ? { rejectUnauthorized: false } : undefined,
    });

    try {
        const client = await pool.connect();
        console.log(green + '✅ Connected to Railway PostgreSQL!' + reset);

        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        console.log(green + '✅ Database is responsive' + reset);
        console.log('   Server time: ' + result.rows[0].current_time);

        // Check tables
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

        if (tablesResult.rows.length === 0) {
            console.log(yellow + '\n⚠️  No tables found - run the SQL script!' + reset);
        } else {
            console.log(green + '✅ Found ' + tablesResult.rows.length + ' tables' + reset);
        }

        client.release();
        await pool.end();
        return true;
    } catch (error) {
        console.log(red + '❌ Railway PostgreSQL connection failed!' + reset);
        console.log(red + '   ' + error.message + reset);
        await pool.end();
        return false;
    }
};

// Test 3: Supabase Storage
console.log('\n' + yellow + '📋 Step 3: Testing Supabase Storage connection...' + reset);

const testSupabase = async () => {
    try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) {
            console.log(red + '❌ Supabase Storage connection failed!' + reset);
            console.log(red + '   HTTP Status: ' + response.status + reset);
            return false;
        }

        const buckets = await response.json();
        console.log(green + '✅ Connected to Supabase Storage!' + reset);

        if (buckets && buckets.length > 0) {
            console.log(green + '✅ Found ' + buckets.length + ' bucket(s)' + reset);

            const propertyBucket = buckets.find(b => b.name === 'property-images');
            if (propertyBucket) {
                console.log(green + '✅ property-images bucket found!' + reset);
            } else {
                console.log(yellow + '⚠️  property-images bucket not found - create it!' + reset);
            }
        } else {
            console.log(yellow + '⚠️  No buckets found - create property-images bucket!' + reset);
        }

        return true;
    } catch (error) {
        console.log(red + '❌ Supabase test failed: ' + error.message + reset);
        return false;
    }
};

// Run all tests
(async () => {
    const railwayPassed = await testRailway();
    const supabasePassed = await testSupabase();

    console.log('\n' + blue + '='.repeat(60) + reset);
    console.log(blue + '📊 Test Results Summary' + reset);
    console.log(blue + '='.repeat(60) + reset + '\n');

    console.log('Environment Variables: ' + (envCheckPassed ? green + '✅ PASS' : red + '❌ FAIL') + reset);
    console.log('Railway PostgreSQL:    ' + (railwayPassed ? green + '✅ PASS' : red + '❌ FAIL') + reset);
    console.log('Supabase Storage:      ' + (supabasePassed ? green + '✅ PASS' : red + '❌ FAIL') + reset);

    const allPassed = envCheckPassed && railwayPassed && supabasePassed;

    if (allPassed) {
        console.log('\n' + green + '🎉 All tests passed! Your cloud setup is working!' + reset);
    } else {
        console.log('\n' + red + '⚠️  Some tests failed. Check errors above.' + reset);
    }

    console.log('\n' + blue + '='.repeat(60) + reset + '\n');
    process.exit(allPassed ? 0 : 1);
})();
