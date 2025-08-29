# Railway Deployment Checklist

## Pre-Deployment Setup

### 1. Environment Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string from Railway
- [ ] `REPLIT_CLIENT_ID` - Replit OAuth client ID
- [ ] `REPLIT_CLIENT_SECRET` - Replit OAuth client secret
- [ ] `SESSION_SECRET` - Random string for session encryption
- [ ] `GOOGLE_CLOUD_PROJECT_ID` - Your GCP project ID
- [ ] `GOOGLE_CLOUD_STORAGE_BUCKET` - Your GCS bucket name
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON
- [ ] `NODE_ENV` - Set to "production"
- [ ] `FRONTEND_URL` - Your Railway app URL for CORS
- [ ] `PUBLIC_OBJECT_SEARCH_PATHS` - Set to "public" (optional)
- [ ] `PRIVATE_OBJECT_DIR` - Set to "private" (optional)

### 2. Google Cloud Setup
- [ ] Create GCP project
- [ ] Enable Cloud Storage API
- [ ] Create service account with Storage Admin role
- [ ] Download service account JSON key
- [ ] Create Cloud Storage bucket
- [ ] Set appropriate bucket permissions

### 3. Railway Project Setup
- [ ] Create new Railway project
- [ ] Add PostgreSQL plugin
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Upload Google Cloud service account key

## Deployment Process

### 4. Code Preparation
- [ ] Verify all configuration files are present:
  - [ ] `railway.toml`
  - [ ] `Procfile`
  - [ ] `nixpacks.toml`
  - [ ] `.env.example`
  - [ ] `Dockerfile` (optional)
  - [ ] `.dockerignore`
- [ ] Update package.json scripts for Railway
- [ ] CORS configuration added to server
- [ ] Database configuration compatible with Railway PostgreSQL

### 5. Initial Deployment
- [ ] Push code to connected GitHub repository
- [ ] Monitor build logs in Railway dashboard
- [ ] Verify successful build completion
- [ ] Check application startup logs

### 6. Database Setup
- [ ] Run database migrations: `npm run db:push`
- [ ] Verify database tables are created
- [ ] Test database connectivity

### 7. Post-Deployment Verification
- [ ] Application loads successfully
- [ ] Health check endpoint responds
- [ ] Database connection works
- [ ] Authentication flow functions
- [ ] File upload/download works
- [ ] CORS allows frontend requests
- [ ] All API endpoints respond correctly
- [ ] Frontend application loads
- [ ] SSL/HTTPS is working

## Domain Configuration (Optional)

### 8. Custom Domain Setup
- [ ] Add custom domain in Railway settings
- [ ] Update DNS records as instructed
- [ ] Verify domain SSL certificate
- [ ] Update FRONTEND_URL environment variable
- [ ] Test application with custom domain

## Monitoring and Maintenance

### 9. Post-Launch
- [ ] Set up monitoring/alerting
- [ ] Configure log retention
- [ ] Document deployment process
- [ ] Create backup strategy
- [ ] Plan for scaling if needed

## Troubleshooting Common Issues

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are listed in package.json
- Review build logs for specific errors
- Ensure environment variables are set correctly

### Runtime Errors
- Check application logs in Railway dashboard
- Verify database connection string
- Confirm Google Cloud credentials are valid
- Test API endpoints individually

### CORS Issues
- Verify FRONTEND_URL environment variable
- Check CORS configuration in server/index.ts
- Ensure credentials are included in requests

### File Upload Issues
- Verify Google Cloud Storage bucket exists
- Check service account permissions
- Confirm GOOGLE_APPLICATION_CREDENTIALS path
- Test bucket accessibility

## Security Considerations

### 10. Security Checklist
- [ ] All secrets stored as environment variables
- [ ] No hardcoded credentials in code
- [ ] HTTPS enforced
- [ ] Proper CORS configuration
- [ ] Database access restricted
- [ ] Service account has minimal required permissions
- [ ] Session secret is strong and unique
- [ ] Regular security updates planned

## Performance Optimization

### 11. Performance Checklist
- [ ] Build optimization enabled
- [ ] Static assets properly cached
- [ ] Database queries optimized
- [ ] Connection pooling configured
- [ ] Monitoring performance metrics
- [ ] CDN setup for static assets (if needed)

---

**Note**: This checklist should be completed in order. Each section builds upon the previous one, and skipping steps may cause deployment issues.