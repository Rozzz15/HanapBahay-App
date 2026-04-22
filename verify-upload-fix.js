#!/usr/bin/env node
/**
 * Verification Script for Upload Fix
 * Run this script to verify all components are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Upload Fix Setup...\n');

let errors = 0;
let warnings = 0;

// Check 1: Enhanced storage file exists
console.log('1. Checking enhanced storage file...');
const enhancedStoragePath = path.join(__dirname, 'utils', 'supabase-storage-enhanced.ts');
if (fs.existsSync(enhancedStoragePath)) {
    console.log('   ✅ supabase-storage-enhanced.ts exists');
} else {
    console.log('   ❌ supabase-storage-enhanced.ts NOT FOUND');
    errors++;
}

// Check 2: SignUpModal updated
console.log('\n2. Checking SignUpModal.tsx...');
const signUpModalPath = path.join(__dirname, 'components', 'SignUpModal.tsx');
if (fs.existsSync(signUpModalPath)) {
    const content = fs.readFileSync(signUpModalPath, 'utf8');
    if (content.includes('supabase-storage-enhanced')) {
        console.log('   ✅ SignUpModal.tsx has enhanced upload integration');
    } else {
        console.log('   ⚠️  SignUpModal.tsx may not have enhanced upload');
        warnings++;
    }
} else {
    console.log('   ❌ SignUpModal.tsx NOT FOUND');
    errors++;
}

// Check 3: .env file exists
console.log('\n3. Checking environment configuration...');
const envPath = path.join(__dirname, '.env');
const envLocalPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envPath) || fs.existsSync(envLocalPath)) {
    const envFile = fs.existsSync(envPath) ? envPath : envLocalPath;
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    if (envContent.includes('EXPO_PUBLIC_SUPABASE_URL=https://pslcopwbzlfmuuqwshkx.supabase.co')) {
        console.log('   ✅ Supabase URL configured correctly');
    } else {
        console.log('   ⚠️  Supabase URL may be incorrect');
        warnings++;
    }
    
    if (envContent.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ')) {
        console.log('   ✅ Supabase anon key configured');
    } else {
        console.log('   ❌ Supabase anon key missing or invalid');
        errors++;
    }
} else {
    console.log('   ❌ .env or .env.local NOT FOUND');
    errors++;
}

// Check 4: SQL setup file
console.log('\n4. Checking SQL setup script...');
const sqlPath = path.join(__dirname, 'supabase-storage-setup.sql');
if (fs.existsSync(sqlPath)) {
    console.log('   ✅ supabase-storage-setup.sql exists');
} else {
    console.log('   ❌ supabase-storage-setup.sql NOT FOUND');
    errors++;
}

// Check 5: Dependencies
console.log('\n5. Checking package dependencies...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const required = [
        '@supabase/supabase-js',
        'expo-image-picker',
        'expo-file-system',
        'base64-arraybuffer',
        '@react-native-community/netinfo'
    ];
    
    required.forEach(dep => {
        if (deps[dep]) {
            console.log(`   ✅ ${dep} installed`);
        } else {
            console.log(`   ⚠️  ${dep} may not be installed`);
            warnings++;
        }
    });
} else {
    console.log('   ❌ package.json NOT FOUND');
    errors++;
}

// Check 6: Documentation
console.log('\n6. Checking documentation files...');
const docs = [
    'UPLOAD_FIX_INSTRUCTIONS.md',
    'TROUBLESHOOTING_UPLOAD_ISSUES.md'
];

docs.forEach(doc => {
    const docPath = path.join(__dirname, doc);
    if (fs.existsSync(docPath)) {
        console.log(`   ✅ ${doc} exists`);
    } else {
        console.log(`   ⚠️  ${doc} not found`);
        warnings++;
    }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
    console.log('✅ All checks passed! Your upload fix is ready.');
    console.log('\nNext steps:');
    console.log('1. Run the SQL script in Supabase Dashboard');
    console.log('2. Create storage buckets in Supabase');
    console.log('3. Rebuild your app: npx expo start --clear');
    console.log('4. Test on a device');
} else {
    if (errors > 0) {
        console.log(`❌ ${errors} error(s) found - fix these before proceeding`);
    }
    if (warnings > 0) {
        console.log(`⚠️  ${warnings} warning(s) - review these`);
    }
}

console.log('\n📖 For detailed instructions, see:');
console.log('   - UPLOAD_FIX_INSTRUCTIONS.md');
console.log('   - TROUBLESHOOTING_UPLOAD_ISSUES.md');
console.log('');

process.exit(errors > 0 ? 1 : 0);
