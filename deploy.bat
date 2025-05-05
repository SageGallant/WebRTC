@echo off
echo Starting deployment to GitHub Pages...

REM Create or switch to gh-pages branch
echo Creating/switching to gh-pages branch...
git checkout -B gh-pages

REM Copy client files to root of gh-pages branch
echo Copying client files to root...
xcopy /E /Y /I client\* .

REM Create a simple .nojekyll file to bypass Jekyll processing
echo Creating .nojekyll file...
type nul > .nojekyll

REM Create a CNAME file if you have a custom domain (uncomment and modify if needed)
REM echo yourdomain.com > CNAME

REM Configure client to use external hosting for backend if needed
echo Adding note about backend configuration...
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
echo Returning to original branch...
git checkout -

echo Deployment complete! Your site should be available at https://YOUR_USERNAME.github.io/YOUR_REPO/
echo NOTE: Since this is a WebRTC application with a backend, you will need to host the server separately.
echo Consider platforms like Heroku, Render, or Railway for hosting the backend server. 