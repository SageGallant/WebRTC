#!/bin/bash

# Deployment script for GitHub Pages

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment to GitHub Pages...${NC}"

# Save current branch to return to it later
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
echo -e "${YELLOW}Saving current branch: $CURRENT_BRANCH${NC}"

# Create a temp directory for deployment
echo -e "${YELLOW}Creating temporary deployment directory...${NC}"
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Temporary directory: $TEMP_DIR${NC}"

# Create or switch to gh-pages branch
echo -e "${YELLOW}Creating/switching to gh-pages branch...${NC}"
git checkout -B gh-pages

# Clean the working directory to ensure no conflicts
echo -e "${YELLOW}Cleaning the working directory...${NC}"
# Preserve .git directory and client directory
find . -mindepth 1 -maxdepth 1 -not -name '.git' -not -name 'client' -exec rm -rf {} \;

# Copy client files to root of gh-pages branch
echo -e "${YELLOW}Copying client files to root...${NC}"
cp -r client/* .

# Create a simple .nojekyll file to bypass Jekyll processing
echo -e "${YELLOW}Creating .nojekyll file...${NC}"
touch .nojekyll

# Create a CNAME file if you have a custom domain (uncomment and modify if needed)
# echo "yourdomain.com" > CNAME

# Configure client to use external hosting for backend if needed
echo -e "${YELLOW}Updating frontend configuration...${NC}"
echo "<!-- Note: When deployed to GitHub Pages, the backend must be hosted separately. Configure your backend URL in js/config.js -->" >> index.html

# Add all files to git
echo -e "${YELLOW}Adding files to git...${NC}"
git add .

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "Deploy to GitHub Pages"

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub Pages...${NC}"
git push -f origin gh-pages

# Return to the original branch
echo -e "${YELLOW}Returning to original branch: $CURRENT_BRANCH${NC}"
git checkout $CURRENT_BRANCH

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your site should be available at https://YOUR_USERNAME.github.io/WebRTC/${NC}"
echo -e "${YELLOW}NOTE: If you're getting a 404 error, please check:${NC}"
echo -e "${YELLOW}1. GitHub Pages is enabled in your repository settings${NC}"
echo -e "${YELLOW}2. The gh-pages branch is selected as the source in GitHub Pages settings${NC}"
echo -e "${YELLOW}3. Wait a few minutes for GitHub to build and deploy your site${NC}"
echo -e "${YELLOW}4. Since this is a WebRTC application with a backend, you will need to host the server separately.${NC}"
echo -e "${YELLOW}   Consider platforms like Heroku, Render, or Railway for hosting the backend server.${NC}" 