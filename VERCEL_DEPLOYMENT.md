# Vercel Deployment Configuration

This document outlines the configuration for deploying the Covid Slayer backend to Vercel.

## Environment Variables

### Required Environment Variables

Set the following environment variables in your Vercel dashboard:

1. **MONGODB_URI** (Required)
   - Your MongoDB Atlas connection string
   - Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`
   - Example: `mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/covid-slayer?retryWrites=true&w=majority`

2. **JWT_SECRET** (Required)
   - Secret key for JWT token signing
   - Should be a long, random string
   - Example: `your-super-secret-jwt-key-here-make-it-long-and-random`

3. **NODE_ENV** (Optional)
   - Set to `production` for Vercel deployment
   - Defaults to `production` in vercel.json

## MongoDB Atlas Configuration

### Network Access
1. Go to MongoDB Atlas Dashboard
2. Navigate to Network Access
3. Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
   - This is required for Vercel's serverless functions as they don't have fixed IP addresses

### Database User
1. Create a database user with read/write permissions
2. Use this user's credentials in your MONGODB_URI

## Vercel Configuration

The project includes a `vercel.json` file with the following configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "index.js": {
      "maxDuration": 30
    }
  }
}
```

## Database Connection Optimization

The application uses a connection caching mechanism optimized for serverless environments:

- Each API route calls `await dbConnect()` to ensure database connectivity
- Connections are cached globally to prevent connection pool exhaustion
- Automatic reconnection handling for serverless cold starts

## Deployment Steps

1. **Connect Repository to Vercel**
   - Import your GitHub repository in Vercel dashboard
   - Select the backend folder as the root directory

2. **Set Environment Variables**
   - Add MONGODB_URI and JWT_SECRET in Vercel dashboard
   - Ensure MongoDB Atlas allows connections from all IPs (0.0.0.0/0)

3. **Deploy**
   - Vercel will automatically build and deploy your application
   - The API will be available at your Vercel domain

## API Endpoints

After deployment, your API will be available at:
- `https://your-app-name.vercel.app/api/auth/*` - Authentication routes
- `https://your-app-name.vercel.app/api/games/*` - Game management routes
- `https://your-app-name.vercel.app/api/users/*` - User management routes
- `https://your-app-name.vercel.app/api/health` - Health check endpoint

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify MONGODB_URI is correctly set
   - Check MongoDB Atlas network access allows 0.0.0.0/0
   - Ensure database user has proper permissions

2. **CORS Issues**
   - Update CORS origin in `index.js` to include your frontend domain
   - Add your Vercel frontend URL to the allowed origins

3. **Environment Variables**
   - Double-check all required environment variables are set
   - Ensure no typos in variable names

### Logs and Debugging

- Check Vercel function logs in the dashboard
- Use `console.log()` statements for debugging (they appear in Vercel logs)
- Monitor MongoDB Atlas for connection attempts

## Performance Considerations

- Each API route ensures database connection before processing
- Connection caching reduces cold start latency
- Consider implementing connection pooling for high-traffic applications
- Monitor function execution time and optimize as needed

## Security Notes

- Never commit sensitive environment variables to version control
- Use strong, unique JWT secrets
- Regularly rotate database credentials
- Monitor API usage and implement rate limiting
- Use HTTPS for all API communications (handled by Vercel)
