# HanapBahay Production Deployment Checklist

## 🔐 Security Setup (CRITICAL)

### 1. Barangay Official Accounts
- [ ] Update barangay official email addresses in `scripts/create-brgy-officials.ts`
- [ ] Update phone numbers to real contact numbers
- [ ] Set environment to production: `export NODE_ENV=production`
- [ ] Run: `npx tsx scripts/create-brgy-officials.ts`
- [ ] Save all generated passwords securely (use password manager)
- [ ] Share credentials with officials through secure channels only
- [ ] Instruct officials to change passwords on first login

### 2. Environment Variables
- [ ] Create `.env.production` file
- [ ] Set `EXPO_PUBLIC_ENV=production`
- [ ] Update Supabase URL and keys for production database
- [ ] Remove any test/development credentials

### 3. Database Setup
- [ ] Create production Supabase project
- [ ] Run database migrations
- [ ] Set up Row Level Security (RLS) policies
- [ ] Configure storage buckets with proper permissions
- [ ] Disable email confirmation for owner accounts (if desired)

### 4. Remove Test Data
- [ ] Delete all test accounts from development
- [ ] Clear test listings and bookings
- [ ] Remove development barangay accounts
- [ ] Verify no test data in production database

---

## 📱 App Configuration

### 5. Update App Information
- [ ] Update app name in `app.json`
- [ ] Update package name/bundle identifier
- [ ] Set correct version number
- [ ] Update app description and keywords

### 6. Assets
- [ ] Use production logo and icons
- [ ] Update splash screen
- [ ] Add proper app store screenshots
- [ ] Update barangay logos if needed

---

## 🚀 Deployment

### 7. Build Configuration
- [ ] Configure EAS Build for production
- [ ] Set up signing certificates
- [ ] Configure app store credentials
- [ ] Test build on real devices

### 8. API & Backend
- [ ] Deploy backend server (if separate)
- [ ] Update API endpoints to production URLs
- [ ] Test all API integrations
- [ ] Set up error monitoring (Sentry, etc.)

### 9. Push Notifications
- [ ] Configure FCM for Android
- [ ] Configure APNs for iOS
- [ ] Test notification delivery

---

## ✅ Testing

### 10. Pre-Launch Testing
- [ ] Test complete user flows (tenant, owner, barangay)
- [ ] Test payment integration (PayMongo)
- [ ] Test image/video uploads
- [ ] Test on multiple devices and OS versions
- [ ] Verify barangay approval workflow
- [ ] Test chat/messaging functionality
- [ ] Load test with expected user volume

### 11. Security Testing
- [ ] Test authentication and authorization
- [ ] Verify RLS policies work correctly
- [ ] Test for SQL injection vulnerabilities
- [ ] Check for exposed API keys or secrets
- [ ] Verify HTTPS for all connections

---

## 📄 Documentation

### 12. User Documentation
- [ ] Create user guides for tenants
- [ ] Create user guides for owners
- [ ] Create admin guide for barangay officials
- [ ] Document common issues and solutions

### 13. Legal & Compliance
- [ ] Prepare privacy policy
- [ ] Prepare terms of service
- [ ] Ensure GDPR/data protection compliance
- [ ] Document data retention policies

---

## 🔍 Monitoring

### 14. Set Up Monitoring
- [ ] Configure error tracking (Sentry, Bugsnag)
- [ ] Set up analytics (Google Analytics, Mixpanel)
- [ ] Configure performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure alerts for critical issues

---

## 📦 Post-Deployment

### 15. Launch
- [ ] Submit to Google Play Store
- [ ] Submit to Apple App Store
- [ ] Set up landing page/website
- [ ] Prepare marketing materials

### 16. Support
- [ ] Set up support email/chat
- [ ] Create FAQ section
- [ ] Train support staff
- [ ] Monitor user feedback and reviews

---

## ⚠️ CRITICAL REMINDERS

🔴 **DO NOT deploy with:**
- Test/development credentials
- Debug mode enabled
- Console.log statements exposing sensitive data
- Hardcoded API keys or secrets
- Sample/test data in production database

🟢 **ALWAYS:**
- Use environment variables for configuration
- Enable HTTPS everywhere
- Implement proper error handling
- Log security events
- Have a rollback plan
- Backup production data regularly

---

## 🆘 Emergency Contacts

**Technical Issues:**
- Database: [Supabase Support]
- Hosting: [Your Hosting Provider]
- Developer: [Your Contact]

**Security Issues:**
- Security Officer: [Contact]
- Supabase Security: security@supabase.io

---

## 📝 Deployment Notes

**Date Deployed:**
**Deployed By:**
**Version:**
**Notes:**
