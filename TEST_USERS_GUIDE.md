# Test Users Guide

## Current Status
✅ **Your current user now has ADMIN role with full system privileges**
✅ **Sample test data created successfully**

## How to Create Additional Test Users

Since Supabase requires actual authentication records, you need to create test users through the Auth system. Here's how:

### Method 1: Use Supabase Dashboard
1. Go to [Supabase Users Dashboard](https://supabase.com/dashboard/project/byaxcqhxxxdjogvdhyqn/auth/users)
2. Click "Add user" 
3. Create users with these emails and assign roles:

**Test Users to Create:**
- `coach@testclub.com` - Role: `coach`
- `athlete@testclub.com` - Role: `athlete` 
- `delegate@testclub.com` - Role: `delegate`
- `finance@testclub.com` - Role: `finance`
- `leader@testclub.com` - Role: `leader`

### Method 2: Create via Your App's Signup
1. Use your app's signup form
2. Create accounts with the test emails above
3. Then update their roles in the database

### Method 3: SQL Update (After Creating Users)
After creating users through auth, update their roles:

```sql
-- Update user roles (run after creating auth users)
UPDATE profiles SET role = 'coach' WHERE email = 'coach@testclub.com';
UPDATE profiles SET role = 'athlete' WHERE email = 'athlete@testclub.com';  
UPDATE profiles SET role = 'delegate' WHERE email = 'delegate@testclub.com';
UPDATE profiles SET role = 'finance' WHERE email = 'finance@testclub.com';
UPDATE profiles SET role = 'leader' WHERE email = 'leader@testclub.com';
```

## Admin Privileges Confirmed ✅

Your admin user now has access to:
- ✅ All dashboard sections
- ✅ User management (create, edit, delete users)
- ✅ Club configuration and logo uploads  
- ✅ System settings
- ✅ All financial data
- ✅ Equipment management
- ✅ Competition management
- ✅ Storage bucket access (profiles, club-logos)

## Test Data Available
- Sample teams, competitions, equipment
- Sample financial transactions
- Sample athletes and coaches
- Sample notifications

## Next Steps
1. Try uploading the club logo - it should work now!
2. Create additional test users as needed
3. Test different role permissions
4. Explore all dashboard sections with your admin privileges