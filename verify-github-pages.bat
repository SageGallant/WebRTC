@echo off
echo GitHub Pages Deployment Verification Script
echo This script will help diagnose common GitHub Pages deployment issues
echo.

REM Check if git is installed
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: git is not installed. Please install git first.
    exit /b 1
)

REM Get repository information
for /f "tokens=*" %%a in ('git config --get remote.origin.url') do set REPO_URL=%%a
if "%REPO_URL%"=="" (
    echo Error: Could not determine repository URL. Make sure you're in a git repository with a remote named 'origin'.
    exit /b 1
)

echo Repository URL: %REPO_URL%

REM Extract username and repo name from URL
set GITHUB_PREFIX=https://github.com/
set GITHUB_PREFIX_LEN=19
set GITHUB_SSH_PREFIX=git@github.com:
set GITHUB_SSH_PREFIX_LEN=15

if "%REPO_URL:~0,19%"=="%GITHUB_PREFIX%" (
    set REPO_PATH=%REPO_URL:~19%
    set REPO_PATH=%REPO_PATH:.git=%
    for /f "tokens=1,2 delims=/" %%a in ("%REPO_PATH%") do (
        set USERNAME=%%a
        set REPO_NAME=%%b
    )
) else if "%REPO_URL:~0,15%"=="%GITHUB_SSH_PREFIX%" (
    set REPO_PATH=%REPO_URL:~15%
    set REPO_PATH=%REPO_PATH:.git=%
    for /f "tokens=1,2 delims=/" %%a in ("%REPO_PATH%") do (
        set USERNAME=%%a
        set REPO_NAME=%%b
    )
) else (
    echo Error: This doesn't appear to be a GitHub repository.
    exit /b 1
)

echo Username: %USERNAME%
echo Repository: %REPO_NAME%

REM Expected GitHub Pages URL
set GH_PAGES_URL=https://%USERNAME%.github.io/%REPO_NAME%/
echo Your GitHub Pages URL should be: %GH_PAGES_URL%

REM Check if gh-pages branch exists locally
git show-ref --verify --quiet refs/heads/gh-pages
if %ERRORLEVEL% EQU 0 (
    echo [OK] gh-pages branch exists locally
) else (
    echo [ERROR] gh-pages branch does not exist locally
    echo Solution: Create a gh-pages branch using 'git checkout -b gh-pages'
)

REM Check if gh-pages branch exists on remote
git ls-remote --exit-code --heads origin gh-pages >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] gh-pages branch exists on remote
) else (
    echo [ERROR] gh-pages branch does not exist on remote
    echo Solution: Push your gh-pages branch using 'git push -u origin gh-pages'
)

REM Check for index.html in repo root
echo.
echo Checking for critical files in gh-pages branch:

REM Save current branch
for /f "tokens=*" %%a in ('git symbolic-ref --short HEAD') do set CURRENT_BRANCH=%%a

REM Check out gh-pages branch temporarily
git show-ref --verify --quiet refs/heads/gh-pages
if %ERRORLEVEL% EQU 0 (
    git checkout gh-pages --quiet
    
    REM Check for index.html
    if exist "index.html" (
        echo [OK] index.html exists in gh-pages branch root
    ) else (
        echo [ERROR] index.html is missing from gh-pages branch root
        echo Solution: Your index.html must be at the root of the gh-pages branch
    )
    
    REM Check for .nojekyll
    if exist ".nojekyll" (
        echo [OK] .nojekyll file exists
    ) else (
        echo [ERROR] .nojekyll file is missing
        echo Solution: Create an empty .nojekyll file to bypass Jekyll processing
    )
    
    REM Return to original branch
    git checkout %CURRENT_BRANCH% --quiet
) else (
    echo Cannot check gh-pages contents because the branch doesn't exist locally
)

echo.
echo Verification complete!
echo If you're still getting a 404 error, please check:
echo 1. GitHub Pages is enabled in your repository settings
echo 2. The gh-pages branch is selected as the source
echo 3. Your index.html file is at the ROOT of the gh-pages branch
echo 4. Wait a few minutes for GitHub to build and deploy your site
echo 5. Clear your browser cache or try in an incognito window 