# Railway Deployment Guide for Wishluv HRMS

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Code should be pushed to GitHub
3. **Environment Variables**: Prepare all required environment variables

## Deployment Steps

### 1. Create New Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `wishluv_hrms` repository

### 2. Add PostgreSQL Database

1. In your Railway project dashboard, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL instance
4. Copy the `DATABASE_URL` from the database service

### 3. Configure Environment Variables

In your Railway project settings, add these environment variables:

```bash
# Database (automatically provided by Railway PostgreSQL)
DATABASE_URL=postgresql://...

# Authentication
REPLIT_CLIENT_ID=your_replit_client_id
REPLIT_CLIENT_SECRET=your_replit_client_secret
SESSION_SECRET=your_random_session_secret

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_STORAGE_BUCKET=your_bucket_name
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json

# Application
NODE_ENV=production
PORT=3000

# Security
TRUST_PROXY=true
```

### 4. Upload Google Cloud Service Account Key

1. Create a service account key in Google Cloud Console
2. Download the JSON file
3. In Railway, go to your service settings
4. Upload the JSON file or set the credentials as environment variables

### 5. Database Migration

After deployment, run database migrations:

1. Go to your Railway project
2. Open the service terminal
3. Run: `npm run db:push`

### 6. Custom Domain (Optional)

1. In Railway project settings, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed

## Important Configuration Files

### railway.toml
```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[environments.production]
variables = { NODE_ENV = "production" }
```

### Procfile
```
web: npm start
```

### nixpacks.toml
```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "npm"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"

[variables]
NODE_ENV = "production"
PORT = "3000"
```

### Dockerfile (Optional)
A multi-stage Dockerfile is provided for containerized deployment:
- Uses Node.js 18 Alpine for smaller image size
- Optimized build process with dependency caching
- Non-root user for security
- Production-ready configuration

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REPLIT_CLIENT_ID` | Replit OAuth client ID | Yes |
| `REPLIT_CLIENT_SECRET` | Replit OAuth client secret | Yes |
| `SESSION_SECRET` | Session encryption key | Yes |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP project ID | Yes |
| `GOOGLE_CLOUD_STORAGE_BUCKET` | GCS bucket name | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON | Yes |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Public object search paths | No |
| `PRIVATE_OBJECT_DIR` | Private object directory | No |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `NODE_ENV` | Environment (production) | Yes |
| `PORT` | Application port (3000) | No |
| `TRUST_PROXY` | Trust proxy headers | No |

## Post-Deployment Checklist

- [ ] Application starts successfully
- [ ] Database connection works
- [ ] Authentication flow works
- [ ] File uploads work (Google Cloud Storage)
- [ ] CORS configuration allows frontend requests
- [ ] Environment variables are properly set
- [ ] SSL/HTTPS is working
- [ ] Database migrations have been applied
- [ ] All API endpoints respond correctly
- [ ] Frontend loads and functions properly
- [ ] SSL certificate is active
- [ ] Custom domain (if configured) works

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Railway dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correctly set
   - Check if database service is running
   - Run `npm run db:push` to apply schema

3. **Authentication Problems**
   - Verify Replit OAuth credentials
   - Check redirect URLs in Replit app settings
   - Ensure session secret is set

4. **File Upload Issues**
   - Verify Google Cloud credentials
   - Check bucket permissions
   - Ensure service account has proper roles

### Logs and Monitoring

- View application logs in Railway dashboard
- Monitor resource usage and performance
- Set up alerts for critical issues

## Scaling and Performance

- Railway automatically handles scaling
- Monitor database performance
- Consider Redis for session storage at scale
- Implement CDN for static assets

## Security Considerations

- All environment variables are encrypted
- Use HTTPS only (Railway provides SSL)
- Regularly rotate secrets
- Monitor for security vulnerabilities

---

**Note**: This deployment guide assumes you have already set up Google Cloud Storage and Replit OAuth applications. Make sure to configure these services before deploying to Railway.