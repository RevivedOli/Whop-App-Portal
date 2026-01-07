# Whop API Setup

This application uses the Whop API to fetch company information (like the community name) for each client.

## Required Credentials

To enable Whop API integration, you need to add the following to your `.env` file:

```bash
# Add this to your .env file
WHOP_API_KEY="your_whop_api_key_here"
```

**Note**: Create a `.env` file in the root of your project if it doesn't exist. You can copy `.env.example` as a template (if it exists) or create it manually.

## How to Get Your Whop API Key

1. Go to [Whop Apps](https://whop.com/apps)
2. Sign in to your Whop account
3. Navigate to your app settings
4. Go to the "API Keys" or "Developer" section
5. Create a new API key or copy an existing one
6. Make sure the API key has the following permissions:
   - `company:basic:read` - Required to fetch company information

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

