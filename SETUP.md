# Setup Guide

## Initial Setup

After logging in for the first time, you need to set up user roles and client records.

### Setting Up User Roles

1. **For Admin Users:**
   Run this SQL in your Supabase SQL editor:
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ('YOUR_USER_ID_HERE', 'admin')
   ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
   ```

2. **For Client Users:**
   Run this SQL in your Supabase SQL editor:
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ('YOUR_USER_ID_HERE', 'client')
   ON CONFLICT (user_id) DO UPDATE SET role = 'client';
   ```

   Then create a client record:
   ```sql
   INSERT INTO clients (name, user_id)
   VALUES ('Client Name', 'YOUR_USER_ID_HERE');
   ```

### Finding Your User ID

1. After logging in, check the browser console (F12)
2. Or run this in Supabase SQL editor:
   ```sql
   SELECT id, email FROM auth.users;
   ```

### Quick Setup Script

You can also run this SQL to set up a test admin (replace with your email):

```sql
-- Get user ID from email
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'your-email@example.com';
  
  -- Create admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  
  RAISE NOTICE 'Admin role created for user: %', v_user_id;
END $$;
```

For a client user:

```sql
DO $$
DECLARE
  v_user_id UUID;
  v_client_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'client-email@example.com';
  
  -- Create client role
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'client')
  ON CONFLICT (user_id) DO UPDATE SET role = 'client';
  
  -- Create client record
  INSERT INTO clients (name, user_id)
  VALUES ('Client Name', v_user_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_client_id;
  
  RAISE NOTICE 'Client setup complete. User ID: %, Client ID: %', v_user_id, v_client_id;
END $$;
```

