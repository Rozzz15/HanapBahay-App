/**
 * Debug .env.local file
 * This will show you exactly what dotenv is reading
 */

require('dotenv').config({ path: '.env.local', debug: true });

console.log('\n=== .env.local Debug Info ===\n');

// Check if .env.local exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file does NOT exist!');
    console.log('   Create it in the root directory of your project');
    process.exit(1);
}

console.log('✅ .env.local file exists');

// Read the file content
const fileContent = fs.readFileSync(envPath, 'utf8');
console.log('\n📄 File size:', fileContent.length, 'bytes');
console.log('📄 Line count:', fileContent.split('\n').length);

// Show detected environment variables
console.log('\n🔍 Environment variables detected by dotenv:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET');
console.log('EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL ? '✅ SET' : '❌ NOT SET');

// Show actual values (first 50 chars)
console.log('\n📝 Values (first 50 characters):');
if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL =', process.env.DATABASE_URL.substring(0, 50) + '...');
}
if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
    console.log('EXPO_PUBLIC_SUPABASE_URL =', process.env.EXPO_PUBLIC_SUPABASE_URL);
}
if (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY =', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.substring(0, 50) + '...');
}
if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('EXPO_PUBLIC_API_URL =', process.env.EXPO_PUBLIC_API_URL);
}

// Analyze the file line by line
console.log('\n🔍 Line-by-line analysis:');
const lines = fileContent.split('\n');
lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmedLine = line.trim();

    if (trimmedLine === '') {
        // Empty line - OK
        return;
    }

    if (trimmedLine.startsWith('#')) {
        console.log(`Line ${lineNum}: Comment - OK`);
        return;
    }

    if (trimmedLine.includes('=')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=');

        // Check for common issues
        const issues = [];

        if (key !== key.trim()) {
            issues.push('⚠️ Key has spaces');
        }

        if (key.includes(' ')) {
            issues.push('⚠️ Key contains spaces');
        }

        if (value === '') {
            issues.push('⚠️ Empty value');
        }

        if (value.startsWith(' ') || value.endsWith(' ')) {
            issues.push('⚠️ Value has leading/trailing spaces');
        }

        if (value.startsWith('"') && value.endsWith('"')) {
            issues.push('⚠️ Value is quoted (quotes not needed)');
        }

        const status = issues.length === 0 ? '✅' : '❌';
        console.log(`Line ${lineNum}: ${status} ${key.trim()}=${value.substring(0, 30)}...`);

        if (issues.length > 0) {
            issues.forEach(issue => console.log(`         ${issue}`));
        }
    } else {
        console.log(`Line ${lineNum}: ❌ Invalid format (no = sign)`);
    }
});

console.log('\n' + '='.repeat(60));

// Final verdict
const allSet = process.env.DATABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.EXPO_PUBLIC_API_URL;

if (allSet) {
    console.log('✅ All environment variables are correctly configured!');
} else {
    console.log('❌ Some environment variables are missing or incorrectly formatted');
    console.log('\n💡 Your .env.local should look like this:');
    console.log('');
    console.log('DATABASE_URL=postgresql://user:pass@host:port/db');
    console.log('EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co');
    console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...');
    console.log('EXPO_PUBLIC_API_URL=https://xxx.railway.app');
    console.log('');
    console.log('⚠️ NO SPACES around the = sign');
    console.log('⚠️ NO QUOTES around values');
    console.log('⚠️ One variable per line');
}

console.log('='.repeat(60) + '\n');
