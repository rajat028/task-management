# Deployment to Render

This guide will help you deploy your NestJS Task Management application to Render.

## Changes Made for Render Deployment

1. **Fixed deprecated dependencies**: Updated from `@hapi/joi` to `joi`
2. **Updated package.json scripts**: Modified start script to use compiled code
3. **Added health check endpoint**: Created `/health` route for Render health checks
4. **Enhanced database configuration**: Support for both DATABASE_URL and individual database variables
5. **Production-ready settings**: Disabled synchronize in production, added SSL support

## Prerequisites

- GitHub account with your code pushed to a repository
- Render account (free tier available)

## Deployment Steps

### 1. Push your code to GitHub
Make sure all changes are committed and pushed to your GitHub repository.

### 2. Create a PostgreSQL Database on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "PostgreSQL"
3. Fill in the details:
   - Name: `task-management-db`
   - Database: `task_management`
   - User: `task_user`
   - Region: Choose your preferred region
   - Plan: Free
4. Click "Create Database"
5. **Important**: Copy the "External Database URL" from the database info page

### 3. Deploy the Web Service
1. Click "New +" and select "Web Service"
2. Connect your GitHub repository
3. Fill in the details:
   - Name: `nestjs-task-management`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
4. **Set Environment Variables**:
   - `NODE_ENV`: `production`
   - `STAGE`: `prod`
   - `DATABASE_URL`: (paste the External Database URL from step 2)
   - `JWT_SECRET`: (generate a strong secret key)
   - `JWT_EXPIRES_IN`: `3600s`

### 4. Deploy
1. Click "Create Web Service"
2. Wait for the deployment to complete
3. Your application will be available at the provided Render URL

## Alternative: Using render.yaml (Blueprint)

You can also use the included `render.yaml` file for infrastructure-as-code deployment:

1. In your Render dashboard, go to "Blueprints"
2. Click "New Blueprint Instance"
3. Connect your GitHub repository
4. Render will automatically read the `render.yaml` file and set up both database and web service
5. You'll still need to set the `JWT_SECRET` environment variable manually

## Important Notes

- **Database URL**: Render automatically provides `DATABASE_URL` for PostgreSQL add-ons
- **SSL**: The application is configured to use SSL in production
- **Synchronization**: Database synchronization is disabled in production for safety
- **Health Check**: The `/health` endpoint is available for monitoring
- **API Documentation**: Swagger documentation is available at `/api`

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Set to `production` | Yes |
| `STAGE` | Set to `prod` | Yes |
| `DATABASE_URL` | PostgreSQL connection string (auto-provided by Render) | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time (default: 3600s) | No |

## Troubleshooting

- **Build Issues**: Check the build logs in Render dashboard
- **Database Connection**: Verify DATABASE_URL is correctly set
- **Environment Variables**: Ensure all required variables are set in Render dashboard
- **Health Check**: Visit `your-app-url/health` to verify the app is running

## API Endpoints

After successful deployment:
- **Health Check**: `GET /health`
- **API Documentation**: `GET /api`
- **Root Endpoint**: `GET /`
- **All other endpoints**: As defined in your controllers

Your NestJS Task Management API should now be successfully running on Render!