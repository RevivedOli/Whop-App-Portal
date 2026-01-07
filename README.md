# Whop App Portal

A modern admin portal for managing client configurations with Supabase authentication. Admins can manage multiple clients, while clients can access their own dashboard.

## Features

- **Authentication**: Secure login with Supabase Auth
- **Role-based Access**: Separate admin and client dashboards
- **Client Management**: Admins can select and edit client configurations
- **Multiple Configuration Tabs**:
  - AI Configuration (name, avatar, prompt)
  - Welcome (messages, disclaimers, color)
  - Knowledge (modules and training status)
  - Members (user management)
  - Reports (generation and history)
  - Re-engage Members (automation settings)

## Tech Stack

- **Next.js 14+** with App Router
- **TypeScript**
- **Tailwind CSS** for styling
- **Supabase** for authentication and database
- **Supabase MCP** for database management

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Schema**:
   The database schema has been created using Supabase MCP migrations. The following tables exist:
   - `user_roles` - User role assignments (admin/client)
   - `clients` - Client information
   - `ai_config` - AI assistant configuration
   - `welcome_config` - Welcome page settings
   - `knowledge_modules` - Knowledge base modules
   - `members` - Member data
   - `reports` - Generated reports

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/app
  /login - Login page
  /admin/clients - Admin client picker
  /admin/clients/[clientId] - Admin client dashboard
  /admin/clients/[clientId]/[tab] - Admin client dashboard tabs
  /dashboard - Client dashboard
  /dashboard/[tab] - Client dashboard tabs
/components
  /auth - Authentication components
  /dashboard - Dashboard layout and navigation
  /tabs - Tab components for each configuration section
/lib
  /supabase - Supabase client and auth helpers
  /types - TypeScript type definitions
```

## Authentication Flow

1. **Admin Login**: Admins log in and are redirected to `/admin/clients` to select a client
2. **Client Login**: Clients log in and are redirected directly to `/dashboard`
3. **Route Protection**: All routes are protected and require authentication

## Database Setup

The database schema includes Row Level Security (RLS) policies:
- Admins can view all clients and their data
- Clients can only view their own data
- All tables have appropriate RLS policies enabled

## Development

- The UI is fully functional for viewing and editing (UI only - no data persistence yet)
- Authentication is fully functional
- All forms have proper structure and validation
- Mobile-responsive design throughout

## Next Steps

- Implement data persistence for form submissions
- Add data fetching for existing configurations
- Implement report generation
- Add member management actions
- Implement notification system
