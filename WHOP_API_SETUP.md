# Whop API Setup

This application uses the Whop API to fetch company information (like the community name) for each client.

## Required Credentials

To enable Whop API integration, you need to add the following to your `.env` file:

```bash
# Add this to your .env file
WHOP_API_KEY="your_whop_api_key_here"

# If using an App API key (required for accessing multiple companies), also add:
WHOP_APP_ID="app_xxxxxxxxxxxxxx"
```

**Note**: Create a `.env` file in the root of your project if it doesn't exist. You can copy `.env.example` as a template (if it exists) or create it manually.

## How to Get Your Whop API Key

### For App API Keys (Recommended for Admin Portal)

Since this is an admin portal that manages multiple companies, you'll need an **App API Key**:

1. Go to [Whop Developer Dashboard](https://whop.com/apps)
2. Sign in to your Whop account
3. Click **"Create app"** button and give your app a name
4. Your **API key** is in the `Environment variables` section (hidden text after `WHOP_API_KEY`)
5. Your **App ID** is also shown in the same section (format: `app_xxxxxxxxxxxxxx`)
6. Copy both values to your `.env` file as `WHOP_API_KEY` and `WHOP_APP_ID`
7. Make sure your app has the required permissions:
   - `company:basic:read` - Required to fetch company information
   - `courses:read` - Required to fetch courses data
   - `experiences:read` - Required to fetch experiences

### For Company API Keys (Single Company Only)

If you only need to access one company's data:

1. Go to [Whop Developer Dashboard](https://whop.com/apps)
2. Click the **"Create"** button in the **"Company API Keys"** section
3. Give your API key a name
4. Select appropriate permissions
5. Copy the API key to your `.env` file as `WHOP_API_KEY`
6. **Note**: Company API keys don't require `WHOP_APP_ID`

## What This Does

Once configured, the application will:
- Automatically fetch the Whop company name (community name) for each client
- Display it in the dashboard header below "Whop App Portal"
- Use the `whop_company_id` stored in the `clients` table to look up company information

## API Endpoint Used

The application uses the Whop API endpoint:
```
GET https://api.whop.com/api/v2/companies/{company_id}
```

This endpoint requires:
- **Authentication**: Bearer token (your API key)
- **Permission**: `company:basic:read`

## Troubleshooting

If the company name is not showing:

1. **Check your API key**: Make sure `WHOP_API_KEY` is set in your `.env` file
2. **Verify permissions**: Ensure your API key has `company:basic:read` permission
3. **Check the company ID**: Verify that the client has a valid `whop_company_id` in the database
4. **Check browser console**: Look for any error messages in the browser console
5. **Check server logs**: Look for API errors in your Next.js server logs

## Example Response

The API returns company information including:
- `title`: The company/community name (displayed in the header)
- `id`: The company ID
- `route`: The company slug/route
- `description`: Company description
- `logo`: Company logo URL
- `member_count`: Number of members
- And more...

