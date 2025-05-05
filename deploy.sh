#!/bin/bash

# Deployment script for GitHub Pages

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment to GitHub Pages...${NC}"

# Create or switch to gh-pages branch
echo -e "${YELLOW}Creating/switching to gh-pages branch...${NC}"
git checkout -B gh-pages

# Copy client files to root of gh-pages branch
echo -e "${YELLOW}Copying client files to root...${NC}"
cp -r client/* .

# Create a simple .nojekyll file to bypass Jekyll processing
echo -e "${YELLOW}Creating .nojekyll file...${NC}"
touch .nojekyll

# Create a CNAME file if you have a custom domain (uncomment and modify if needed)
# echo "yourdomain.com" > CNAME

# Configure client to use external hosting for backend if needed
echo -e "${YELLOW}Adding note about backend configuration...${NC}"
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
echo -e "${YELLOW}Returning to original branch...${NC}"
git checkout -

echo -e "${GREEN}Deployment complete! Your site should be available at https://YOUR_USERNAME.github.io/YOUR_REPO/${NC}"
echo -e "${YELLOW}NOTE: Since this is a WebRTC application with a backend, you will need to host the server separately.${NC}"
echo -e "${YELLOW}Consider platforms like Heroku, Render, or Railway for hosting the backend server.${NC}" 