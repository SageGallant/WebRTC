#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}GitHub Pages Deployment Verification Script${NC}"
echo -e "${YELLOW}This script will help diagnose common GitHub Pages deployment issues${NC}"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed. Please install git first.${NC}"
    exit 1
fi

# Get repository information
REPO_URL=$(git config --get remote.origin.url)
if [ -z "$REPO_URL" ]; then
    echo -e "${RED}Error: Could not determine repository URL. Make sure you're in a git repository with a remote named 'origin'.${NC}"
    exit 1
fi

echo -e "${YELLOW}Repository URL: $REPO_URL${NC}"

# Extract username and repo name
if [[ $REPO_URL == *"github.com"* ]]; then
    # Handle SSH URLs like git@github.com:username/repo.git
    if [[ $REPO_URL == git@github.com:* ]]; then
        REPO_PATH=${REPO_URL#git@github.com:}
        REPO_PATH=${REPO_PATH%.git}
        USERNAME=$(echo $REPO_PATH | cut -d '/' -f 1)
        REPO_NAME=$(echo $REPO_PATH | cut -d '/' -f 2)
    # Handle HTTPS URLs like https://github.com/username/repo.git
    elif [[ $REPO_URL == https://github.com/* ]]; then
        REPO_PATH=${REPO_URL#https://github.com/}
        REPO_PATH=${REPO_PATH%.git}
        USERNAME=$(echo $REPO_PATH | cut -d '/' -f 1)
        REPO_NAME=$(echo $REPO_PATH | cut -d '/' -f 2)
    else
        echo -e "${RED}Error: Unrecognized GitHub URL format.${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: This doesn't appear to be a GitHub repository.${NC}"
    exit 1
fi

echo -e "${GREEN}Username: $USERNAME${NC}"
echo -e "${GREEN}Repository: $REPO_NAME${NC}"

# Expected GitHub Pages URL
GH_PAGES_URL="https://$USERNAME.github.io/$REPO_NAME/"
echo -e "${YELLOW}Your GitHub Pages URL should be: $GH_PAGES_URL${NC}"

# Check if gh-pages branch exists
if git show-ref --verify --quiet refs/heads/gh-pages; then
    echo -e "${GREEN}✓ gh-pages branch exists locally${NC}"
else
    echo -e "${RED}✗ gh-pages branch does not exist locally${NC}"
    echo -e "${YELLOW}Solution: Create a gh-pages branch using 'git checkout -b gh-pages'${NC}"
fi

# Check if gh-pages branch exists on remote
if git ls-remote --exit-code --heads origin gh-pages &>/dev/null; then
    echo -e "${GREEN}✓ gh-pages branch exists on remote${NC}"
else
    echo -e "${RED}✗ gh-pages branch does not exist on remote${NC}"
    echo -e "${YELLOW}Solution: Push your gh-pages branch using 'git push -u origin gh-pages'${NC}"
fi

# Check for index.html in repo root
echo ""
echo -e "${YELLOW}Checking for critical files in gh-pages branch:${NC}"

# Save current branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)

# Check out gh-pages branch temporarily
if git show-ref --verify --quiet refs/heads/gh-pages; then
    git checkout gh-pages --quiet
    
    # Check for index.html
    if [ -f "index.html" ]; then
        echo -e "${GREEN}✓ index.html exists in gh-pages branch root${NC}"
    else
        echo -e "${RED}✗ index.html is missing from gh-pages branch root${NC}"
        echo -e "${YELLOW}Solution: Your index.html must be at the root of the gh-pages branch${NC}"
    fi
    
    # Check for .nojekyll
    if [ -f ".nojekyll" ]; then
        echo -e "${GREEN}✓ .nojekyll file exists${NC}"
    else
        echo -e "${RED}✗ .nojekyll file is missing${NC}"
        echo -e "${YELLOW}Solution: Create an empty .nojekyll file to bypass Jekyll processing${NC}"
    fi
    
    # Return to original branch
    git checkout $CURRENT_BRANCH --quiet
else
    echo -e "${RED}Cannot check gh-pages contents because the branch doesn't exist locally${NC}"
fi

# Check GitHub Pages settings via API (requires GitHub CLI if available)
echo ""
echo -e "${YELLOW}Checking GitHub Pages settings:${NC}"
if command -v gh &> /dev/null; then
    echo -e "${GREEN}GitHub CLI is installed, attempting to check Pages settings...${NC}"
    if gh auth status &>/dev/null; then
        PAGES_INFO=$(gh api repos/$USERNAME/$REPO_NAME/pages 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ GitHub Pages is enabled for this repository${NC}"
            echo -e "${YELLOW}Pages Information:${NC}"
            echo $PAGES_INFO | grep -o '"html_url":"[^"]*"' | cut -d'"' -f4
            echo $PAGES_INFO | grep -o '"source":{[^}]*}' | tr ',' '\n'
        else
            echo -e "${RED}✗ GitHub Pages is not enabled for this repository${NC}"
            echo -e "${YELLOW}Solution: Go to repository Settings > Pages and enable GitHub Pages${NC}"
        fi
    else
        echo -e "${RED}GitHub CLI is not authenticated. Run 'gh auth login' first${NC}"
    fi
else
    echo -e "${YELLOW}GitHub CLI is not installed. Install it to check Pages settings automatically.${NC}"
    echo -e "${YELLOW}Manual check: Go to https://github.com/$USERNAME/$REPO_NAME/settings/pages${NC}"
fi

echo ""
echo -e "${GREEN}Verification complete!${NC}"
echo -e "${YELLOW}If you're still getting a 404 error, please check:${NC}"
echo -e "${YELLOW}1. GitHub Pages is enabled in your repository settings${NC}"
echo -e "${YELLOW}2. The gh-pages branch is selected as the source${NC}"
echo -e "${YELLOW}3. Your index.html file is at the ROOT of the gh-pages branch${NC}"
echo -e "${YELLOW}4. Wait a few minutes for GitHub to build and deploy your site${NC}"
echo -e "${YELLOW}5. Clear your browser cache or try in an incognito window${NC}" 