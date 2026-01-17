# Barangay Official Accounts Setup

## 🎯 Overview

This guide explains how to set up the 5 Barangay Official accounts that will approve owner applications.

**Barangays:**
- Rizal
- Talolong
- Gomez
- Magsaysay
- Burgos

---

## 📋 Prerequisites

Before running the setup script, you need:

1. ✅ Real email addresses for each barangay official
2. ✅ Contact phone numbers for each barangay official
3. ✅ Supabase project set up and running
4. ✅ Environment variables configured (`.env`)

---

## 🚀 Setup Steps

### Step 1: Update Email Addresses and Phone Numbers

Open `scripts/create-brgy-officials.ts` and update the contact information:

```typescript
const BARANGAY_OFFICIALS = [
  {
    barangay: 'RIZAL',
    email: 'actual.email@barangay.gov.ph', // ⚠️ UPDATE THIS
    password: generateSecurePassword(),
    name: 'Barangay Rizal Official',
    phone: '+639171234567', // ⚠️ UPDATE THIS
  },
  // ... update all 5 barangays
];
```

### Step 2: Run the Setup Script

```bash
cd Desktop/hanapbahay
npx tsx scripts/create-brgy-officials.ts
```

### Step 3: Save the Generated Passwords

The script will output credentials like this:

```
🎉 Barangay Officials Setup Complete!

📋 LOGIN CREDENTIALS - SAVE THESE SECURELY:
================================================================================

RIZAL:
  Email:    actual.email@barangay.gov.ph
  Password: xK9#mP2@vL4$nQ7!
  Phone:    +639171234567

TALOLONG:
  Email:    another.email@barangay.gov.ph
  Password: yL3$pQ8#wM5@rN9!
  Phone:    +639181234567

...
================================================================================
```

**⚠️ IMPORTANT:** Save these passwords immediately in a password manager!

---

## 🔐 Distributing Credentials

### Secure Methods:
✅ **In-Person:** Hand deliver printed credentials in sealed envelopes
✅ **Encrypted Chat:** Use Signal or WhatsApp with disappearing messages
✅ **Password Manager:** Use shared vault (LastPass Teams, 1Password Business)

### Insecure Methods (DON'T USE):
❌ Regular email
❌ SMS/Text message
❌ Phone call
❌ Facebook Messenger
❌ Written on paper left unattended

---

## 📱 First Login Instructions for Officials

1. Open HanapBahay app
2. Click "Login"
3. Enter your email and temporary password
4. You will be redirected to the Barangay Dashboard
5. **IMPORTANT:** Change your password immediately

---

## 🔄 What Can Barangay Officials Do?

Once logged in, barangay officials can:

- ✅ View pending owner applications for their barangay
- ✅ Review submitted business documents
- ✅ Approve or reject applications with reasons
- ✅ Request reapplication if documents are incomplete
- ✅ View statistics and reports for their barangay
- ✅ Monitor properties and complaints in their area

---

## 🛠️ Troubleshooting

### "Account Not Found" Error
- Make sure you ran the setup script
- Check that the email in the script matches what they're entering
- Verify the account was created in Supabase → Authentication → Users

### "Invalid Password" Error
- Make sure they're using the password from the setup output
- Check for copy-paste errors (extra spaces, etc.)
- Have them try typing it manually

### Need to Reset Password
1. Go to Supabase Dashboard → Authentication → Users
2. Find the user by email
3. Click "..." menu → Send reset password email

### Need to Create Additional Officials
Edit the script to add more barangays and run it again. Existing accounts won't be duplicated.

---

## 📊 Verifying Setup

After running the script, verify the accounts:

1. **Check Supabase Dashboard**
   - Go to Authentication → Users
   - Should see 5 new users with emails you specified

2. **Check Database**
   - Go to Table Editor → users
   - Should see 5 records with `role = 'brgy_official'`

3. **Test Login**
   - Try logging in with one account
   - Should redirect to Barangay Dashboard

---

## ⚠️ Security Best Practices

1. **Never** share credentials in plain text
2. **Always** use strong, unique passwords
3. **Enable** password changes on first login
4. **Implement** 2FA in future versions
5. **Regularly** audit official accounts
6. **Log** all approval/rejection actions

---

## 📞 Support

If you encounter issues during setup:

1. Check the console output for error messages
2. Verify Supabase connection is working
3. Ensure you have proper permissions in Supabase
4. Contact the development team with error logs

---

## ✅ Checklist

Before considering setup complete:

- [ ] Updated all 5 email addresses in the script
- [ ] Updated all 5 phone numbers in the script
- [ ] Ran the setup script successfully
- [ ] Saved all passwords in password manager
- [ ] Verified accounts in Supabase Dashboard
- [ ] Tested login with at least one account
- [ ] Distributed credentials securely to officials
- [ ] Instructed officials to change passwords
- [ ] Documented who received what credentials
- [ ] Set up support process for password resets

---

**Last Updated:** 2026-01-14
**Version:** 1.0
