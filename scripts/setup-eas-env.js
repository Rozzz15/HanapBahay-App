/**
 * Setup EAS Environment Variables
 * This script helps set up the backend URL for all build profiles
 */

const { execSync } = require('child_process');

const BACKEND_URL = 'https://web-production-e66fb.up.railway.app';
const VAR_NAME = 'EXPO_PUBLIC_API_URL';

console.log('🔧 Setting up EAS Environment Variables\n');
console.log(`Backend URL: ${BACKEND_URL}\n`);

const profiles = ['development', 'preview', 'production'];

console.log('Setting environment variable for all profiles...\n');

profiles.forEach((profile) => {
  try {
    console.log(`Setting for ${profile} profile...`);
    // Note: This will still require user interaction for visibility selection
    // But we'll provide clear instructions
    console.log(`Run: eas env:create --scope project --name ${VAR_NAME} --value "${BACKEND_URL}" --environment ${profile} --force`);
    console.log('When prompted, select "Plain text"\n');
  } catch (error) {
    console.error(`Error for ${profile}:`, error.message);
  }
});

console.log('\n✅ Instructions:');
console.log('1. Run the commands above for each profile');
console.log('2. Select "Plain text" when prompted for visibility');
console.log('3. Then run: eas build --platform android --profile preview');


