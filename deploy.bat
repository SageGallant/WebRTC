@echo off
echo Starting deployment to GitHub Pages...

REM Save current branch to return to it later
FOR /F "tokens=* USEBACKQ" %%F IN (`git rev-parse --abbrev-ref HEAD`) DO (
  SET CURRENT_BRANCH=%%F
)
echo Saving current branch: %CURRENT_BRANCH%

REM Create or switch to gh-pages branch
echo Creating/switching to gh-pages branch...
git checkout -B gh-pages

REM Clean the working directory to ensure no conflicts
echo Cleaning the working directory...
REM Create a list of directories to preserve
FOR /D %%D IN (*) DO (
  IF NOT "%%D"==".git" IF NOT "%%D"=="client" (
    RMDIR /S /Q %%D
  )
)
REM Remove files in root except specific ones
FOR %%F IN (*) DO (
  IF NOT "%%F"==".git" IF NOT "%%F"=="client" (
    DEL /Q %%F
  )
)

REM Copy client files to root of gh-pages branch
echo Copying client files to root...
xcopy /E /Y /I client\* .

REM Create a simple .nojekyll file to bypass Jekyll processing
echo Creating .nojekyll file...
type nul > .nojekyll

REM Create a CNAME file if you have a custom domain (uncomment and modify if needed)
REM echo yourdomain.com > CNAME

REM Configure client to use external hosting for backend if needed
echo Updating frontend configuration...
echo ^<!-- Note: When deployed to GitHub Pages, the backend must be hosted separately. Configure your backend URL in js/config.js --^> >> index.html

REM Add all files to git
echo Adding files to git...
git add .

REM Commit changes
echo Committing changes...
git commit -m "Deploy to GitHub Pages"

REM Push to GitHub
echo Pushing to GitHub Pages...
git push -f origin gh-pages

REM Return to the original branch
echo Returning to original branch: %CURRENT_BRANCH%
git checkout %CURRENT_BRANCH%

echo Deployment complete!
echo Your site should be available at https://YOUR_USERNAME.github.io/WebRTC/
echo NOTE: If you're getting a 404 error, please check:
echo 1. GitHub Pages is enabled in your repository settings
echo 2. The gh-pages branch is selected as the source in GitHub Pages settings
echo 3. Wait a few minutes for GitHub to build and deploy your site
echo 4. Since this is a WebRTC application with a backend, you will need to host the server separately.
echo    Consider platforms like Heroku, Render, or Railway for hosting the backend server. 