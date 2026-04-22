// Recovery Script for bella27@gmail.com → bella15@gmail.com
// Run this in Node.js to check and fix the account

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function recoverAccount() {
  console.log('\n🔍 CHECKING ACCOUNT STATUS...\n');
  
  try {
    // Check what's in mockUsers storage
    const storedUsers = await AsyncStorage.getItem('mockUsers');
    
    if (!storedUsers) {
      console.log('❌ No users found in storage');
      return;
    }
    
    const users = JSON.parse(storedUsers);
    console.log(`📊 Total users in storage: ${users.length}\n`);
    
    // Look for both emails
    const oldEmail = 'bella27@gmail.com';
    const newEmail = 'bella15@gmail.com';
    const password = 'E@yana05';
    
    const oldAccount = users.find(u => u.email === oldEmail);
    const newAccount = users.find(u => u.email === newEmail);
    
    console.log('🔍 Checking for old email (bella27@gmail.com):');
    if (oldAccount) {
      console.log('✅ FOUND!');
      console.log('   ID:', oldAccount.id);
      console.log('   Has Password:', !!oldAccount.password ? 'YES ✅' : 'NO ❌');
      console.log('   Password Correct:', oldAccount.password === password ? 'YES ✅' : 'NO ❌');
    } else {
      console.log('❌ NOT FOUND');
    }
    
    console.log('\n🔍 Checking for new email (bella15@gmail.com):');
    if (newAccount) {
      console.log('✅ FOUND!');
      console.log('   ID:', newAccount.id);
      console.log('   Has Password:', !!newAccount.password ? 'YES ✅' : 'NO ❌');
      console.log('   Password Correct:', newAccount.password === password ? 'YES ✅' : 'NO ❌');
    } else {
      console.log('❌ NOT FOUND');
    }
    
    // If new account exists but no password, fix it
    if (newAccount && !newAccount.password && oldAccount) {
      console.log('\n🔧 FIXING: Copying password from old account to new account...');
      newAccount.password = oldAccount.password;
      
      // Save back to storage
      await AsyncStorage.setItem('mockUsers', JSON.stringify(users));
      console.log('✅ PASSWORD RESTORED!');
      console.log('\n✅ You can now login with:');
      console.log('   Email: bella15@gmail.com');
      console.log('   Password: E@yana05');
    } else if (newAccount && newAccount.password) {
      console.log('\n✅ New account has password! You should be able to login with:');
      console.log('   Email: bella15@gmail.com');
      console.log('   Password: E@yana05');
    } else if (oldAccount && oldAccount.password) {
      console.log('\n⚠️ Only old account found. Try logging in with:');
      console.log('   Email: bella27@gmail.com');
      console.log('   Password: E@yana05');
    } else {
      console.log('\n❌ Could not find either account with password');
      console.log('📋 All emails in storage:');
      users.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.id}, Password: ${!!u.password ? 'YES' : 'NO'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  recoverAccount().then(() => {
    console.log('\n✅ Done!\n');
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = { recoverAccount };
