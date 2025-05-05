const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ghpages = require("gh-pages");

// Configuration
const config = {
  // Files and directories required for deployment
  requiredFiles: ["index.html", "css/styles.css", "js/app.js", "js/avatars.js"],
  // Files to exclude from deployment
  excludeFiles: ["node_modules", ".git", ".github", "server.js", "deploy.js"],
};

// Utility functions
const log = {
  info: (msg) => console.log("\x1b[36m%s\x1b[0m", `[INFO] ${msg}`),
  success: (msg) => console.log("\x1b[32m%s\x1b[0m", `[SUCCESS] ${msg}`),
  warn: (msg) => console.log("\x1b[33m%s\x1b[0m", `[WARNING] ${msg}`),
  error: (msg) => console.log("\x1b[31m%s\x1b[0m", `[ERROR] ${msg}`),
};

// Validate project structure
function validateProject() {
  log.info("Validating project structure...");

  // Check required files
  const missingFiles = config.requiredFiles.filter(
    (file) => !fs.existsSync(file)
  );

  if (missingFiles.length > 0) {
    log.error("Missing required files:");
    missingFiles.forEach((file) => log.error(`- ${file}`));
    return false;
  }

  return true;
}

// Deploy to GitHub Pages
function deployToGitHubPages() {
  log.info("Starting deployment to GitHub Pages...");

  // Get repository details from git
  let repoUrl = "";
  try {
    repoUrl = execSync("git config --get remote.origin.url").toString().trim();
    log.info(`Repository URL: ${repoUrl}`);
  } catch (error) {
    log.warn(
      "Could not get repository URL. Make sure your project is a git repository with a remote origin."
    );
    log.warn(
      "You may need to run: git init && git remote add origin YOUR_REPO_URL"
    );
  }

  // Deploy options
  const options = {
    branch: "gh-pages",
    src: "**/*",
    dest: ".",
    add: true,
    message: "Auto-deployment [ci skip]",
    repo: repoUrl || undefined,
    silent: false,
    dotfiles: true,
    exclude: config.excludeFiles,
  };

  // Deploy
  ghpages.publish(".", options, (err) => {
    if (err) {
      log.error("Deployment failed:");
      log.error(err);
      process.exit(1);
    } else {
      log.success("Deployment successful!");

      // Extract repository information for the GitHub Pages URL
      let pagesUrl = "";
      if (repoUrl) {
        try {
          // Extract username and repo name from the repository URL
          const match = repoUrl.match(
            /github\.com[:\/]([^\/]+)\/([^\/\.]+)(?:\.git)?$/
          );
          if (match) {
            const [, username, repo] = match;
            pagesUrl = `https://${username}.github.io/${repo}`;
            log.success(`Your site is now available at: ${pagesUrl}`);
          }
        } catch (error) {
          log.warn("Could not determine GitHub Pages URL.");
        }
      }

      log.info(
        "Note: It may take a few minutes for changes to be visible on GitHub Pages."
      );
    }
  });
}

// Main function
async function main() {
  log.info("Starting deployment process...");

  // Validate project
  if (!validateProject()) {
    log.error("Project validation failed. Aborting deployment.");
    process.exit(1);
  }

  log.success("Project validation successful!");

  // Check if node_modules and gh-pages exist
  if (
    !fs.existsSync("node_modules") ||
    !fs.existsSync("node_modules/gh-pages")
  ) {
    log.info("Installing dependencies...");
    try {
      execSync("npm install", { stdio: "inherit" });
      log.success("Dependencies installed successfully.");
    } catch (error) {
      log.error("Failed to install dependencies:");
      log.error(error.message);
      process.exit(1);
    }
  }

  // Deploy to GitHub Pages
  deployToGitHubPages();
}

// Run the script
main().catch((error) => {
  log.error("Deployment failed:");
  log.error(error);
  process.exit(1);
});
