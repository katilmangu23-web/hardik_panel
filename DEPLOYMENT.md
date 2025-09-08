# Netlify Deployment Guide

This guide will help you deploy your Device Management Dashboard to Netlify.

## Prerequisites

- A Netlify account (free at [netlify.com](https://netlify.com))
- Git installed on your machine
- Node.js 18+ installed

## Deployment Steps

### Option 1: Deploy via Netlify UI (Recommended)

1. **Push to GitHub/GitLab/Bitbucket**
   ```bash
   # Create a new repository on GitHub/GitLab/Bitbucket
   # Then push your code:
   git remote add origin <your-repository-url>
   git push -u origin main
   ```

2. **Deploy on Netlify**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "New site from Git"
   - Choose your Git provider and select your repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - Click "Deploy site"

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   # Build the project
   npm run build
   
   # Deploy to Netlify
   netlify deploy --prod --dir=dist
   ```

### Option 3: Drag & Drop Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Drag and drop the `dist` folder to the deployment area

## Configuration

The project includes a `netlify.toml` file with the following configuration:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18
- **SPA routing**: All routes redirect to `index.html`
- **Security headers**: Added for better security

## Environment Variables

If your app uses environment variables (like Firebase config), you'll need to add them in Netlify:

1. Go to your site's dashboard on Netlify
2. Navigate to Site settings > Environment variables
3. Add your environment variables

## Custom Domain (Optional)

1. Go to your site's dashboard on Netlify
2. Navigate to Domain management
3. Add your custom domain
4. Follow the DNS configuration instructions

## Troubleshooting

### Build Failures
- Check that Node.js version is 18+
- Ensure all dependencies are in `package.json`
- Verify the build command works locally: `npm run build`

### Routing Issues
- The `netlify.toml` and `public/_redirects` files handle SPA routing
- All routes should redirect to `index.html`

### Environment Variables
- Make sure to add any required environment variables in Netlify dashboard
- Firebase configuration should be added as environment variables

## Support

If you encounter issues:
1. Check the build logs in Netlify dashboard
2. Verify your local build works: `npm run build`
3. Check the Netlify documentation: [docs.netlify.com](https://docs.netlify.com)
