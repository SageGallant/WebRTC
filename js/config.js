/**
 * Configuration settings for the WebRTC application
 * This file allows easy switching between local development and production URLs
 */

const CONFIG = {
  // Backend server configuration
  SERVER: {
    // For local development (default)
    LOCAL_URL: "http://localhost:3000",

    // For production deployment - change this to your actual backend server URL
    // If you don't have a backend server yet, use a service like Render, Railway, or Heroku
    PRODUCTION_URL: "http://localhost:3000",

    // Set this to true when deploying to GitHub Pages AND you have a production backend
    USE_PRODUCTION: false,
  },

  // Get the appropriate backend URL based on configuration
  getServerURL() {
    // If we're running on GitHub Pages
    if (window.location.hostname.endsWith("github.io")) {
      console.log("Detected GitHub Pages environment");

      // If we have a real production URL configured, use it
      if (this.SERVER.PRODUCTION_URL !== "http://localhost:3000") {
        console.log(
          "Using production backend URL:",
          this.SERVER.PRODUCTION_URL
        );
        return this.SERVER.PRODUCTION_URL;
      } else {
        console.warn(
          "WARNING: Using localhost as backend URL. This won't work in production!"
        );
        console.warn(
          "Please update CONFIG.SERVER.PRODUCTION_URL in js/config.js with your actual backend URL"
        );
        return this.SERVER.LOCAL_URL;
      }
    }

    // If we're running locally
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.log(
        "Local development environment detected, using local backend URL"
      );
      return this.SERVER.LOCAL_URL;
    }

    // Default case
    return this.SERVER.USE_PRODUCTION
      ? this.SERVER.PRODUCTION_URL
      : this.SERVER.LOCAL_URL;
  },

  // Debug info
  logConfig() {
    console.log(
      "Environment:",
      this.SERVER.USE_PRODUCTION ? "Production" : "Development"
    );
    console.log("Server URL:", this.getServerURL());
    console.log("Host:", window.location.hostname);

    if (
      this.getServerURL() === this.SERVER.LOCAL_URL &&
      window.location.hostname.endsWith("github.io")
    ) {
      console.error(
        "ERROR: Your application is trying to connect to localhost from GitHub Pages!"
      );
      console.error(
        "This won't work because browsers block cross-origin requests to localhost."
      );
      console.error(
        "Please deploy your backend to a proper hosting service and update PRODUCTION_URL in js/config.js"
      );
    }
  },
};

// When deployed on GitHub Pages, you'll need to update CONFIG.SERVER.PRODUCTION_URL
// and set CONFIG.SERVER.USE_PRODUCTION to true

// Log configuration on load
CONFIG.logConfig();

// Additional message when in development
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  console.log("WebRTC App Config:", CONFIG);

  if (CONFIG.SERVER.PRODUCTION_URL === "http://localhost:3000") {
    console.info(
      "HINT: Before deploying to GitHub Pages, update PRODUCTION_URL in js/config.js with your backend URL"
    );
  }
}
