# GitHub Pages Deployment Guide

This document provides detailed instructions for deploying this WebRTC application to GitHub Pages and troubleshooting common 404 errors.

## Prerequisites

- Git installed on your machine
- A GitHub account
- Repository pushed to GitHub

## Deployment Options

### Option 1: Automated Deployment (GitHub Actions)

1. **Enable GitHub Pages with GitHub Actions:**

   - Go to your repository on GitHub
   - Click **Settings** > **Pages**
   - Select **GitHub Actions** as the source
   - The workflow file in `.github/workflows/deploy.yml` will handle deployments

2. **Trigger a deployment:**
   - Push to the `main` or `master` branch
   - OR manually trigger the workflow from the Actions tab

### Option 2: Manual Deployment

**On Windows:**

```
.\deploy.bat
```

**On Linux/Mac:**

```
bash deploy.sh
```

## Troubleshooting 404 Errors

If you're getting a 404 error when accessing your GitHub Pages site, try these solutions:

### 1. Run the Verification Script

**On Windows:**

```
.\verify-github-pages.bat
```

**On Linux/Mac:**

```
bash verify-github-pages.sh
```

This script will check your GitHub Pages configuration and identify common issues.

### 2. Common Issues and Solutions

#### GitHub Pages Not Enabled

- Go to your repository settings
- Navigate to the "Pages" section
- Ensure GitHub Pages is enabled
- For GitHub Actions deployment: select "GitHub Actions" as the source
- For manual deployment: select "Deploy from a branch" and choose "gh-pages" branch

#### Files Not in the Root of gh-pages Branch

Make sure your `index.html` file is at the root of the gh-pages branch, not in a subdirectory.

#### Missing .nojekyll File

GitHub Pages uses Jekyll by default, which can interfere with some files. Make sure you have a `.nojekyll` file in the root of your gh-pages branch.

#### Incorrect Repository Name

GitHub Pages URLs are case-sensitive. Make sure you're using the correct case in the URL.

#### Deployment Still in Progress

GitHub Pages deployments can take a few minutes to complete. Check the "Actions" tab to see if your deployment is still in progress.

#### Browser Cache Issues

Try accessing your site in an incognito/private window or clear your browser cache.

## Backend Configuration

Since GitHub Pages only serves static content, you'll need to host your backend separately:

1. **Deploy the backend:**

   - Choose a hosting provider that supports Node.js (Heroku, Render, Railway, etc.)
   - Follow their deployment instructions for Node.js applications

2. **Update the frontend configuration:**

   - Modify `client/js/config.js`:

   ```javascript
   CONFIG.SERVER.PRODUCTION_URL = "https://your-backend-url.com";
   CONFIG.SERVER.USE_PRODUCTION = true;
   ```

3. **Redeploy the frontend** using one of the deployment options above

## Advanced: Custom Domain

If you want to use a custom domain instead of the github.io URL:

1. **Add your domain in GitHub:**

   - Go to repository Settings > Pages
   - Enter your custom domain and save

2. **Update your DNS settings:**

   - Add a CNAME record pointing to `<username>.github.io`
   - OR for apex domains, add A records pointing to GitHub's IP addresses

3. **Uncomment the CNAME line in the deployment scripts:**
   ```
   echo "yourdomain.com" > CNAME
   ```

## Need More Help?

If you're still having issues, check:

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Community Forum](https://github.community/)
