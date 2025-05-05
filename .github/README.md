# GitHub Configuration

This directory contains GitHub-specific configurations for the repository.

## Workflows

The `workflows` directory contains GitHub Actions workflow definitions:

### deploy.yml

This workflow automatically deploys the application to GitHub Pages whenever changes are pushed to the main branch.

The workflow:

1. Checks out the repository
2. Sets up Node.js
3. Installs dependencies
4. Configures Git with the actor's information
5. Deploys to GitHub Pages using the gh-pages npm package

## How to use

You don't need to do anything special to use this workflow. It will automatically run when you push changes to the main branch.

If you need to modify the workflow:

1. Edit the `.github/workflows/deploy.yml` file
2. Commit and push your changes
3. The workflow will be updated for future deployments

## Troubleshooting

If the deployment workflow fails:

1. Check the Actions tab in your repository to see the error details
2. Ensure that GitHub Pages is enabled in your repository settings
3. Make sure the gh-pages branch is selected as the source for GitHub Pages
4. Verify that the GitHub token has the necessary permissions

## Manual Deployment

If you prefer to deploy manually, you can still use:

```
npm run deploy
```

This will run the deploy script locally.
