/**
 * Configuration settings for the WebRTC application
 * This file allows easy switching between local development and production URLs
 */

const CONFIG = {
  // Backend server configuration
  SERVER: {
    // For local development (default)
    LOCAL_URL: "http://localhost:3000",

    // For production deployment - change this when deploying to your backend hosting service
    PRODUCTION_URL: "https://your-backend-url.com",

    // Set this to true when deploying to GitHub Pages to use the production URL
    USE_PRODUCTION: false,
  },

  // Get the appropriate backend URL based on configuration
  getServerURL() {
    // Auto-detect GitHub Pages URL if we're on GitHub Pages
    if (window.location.hostname.endsWith("github.io")) {
      console.log("Detected GitHub Pages environment, using production URL");
      return this.SERVER.PRODUCTION_URL;
    }

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
  },
};

// When deployed on GitHub Pages, you'll need to update CONFIG.SERVER.PRODUCTION_URL
// and set CONFIG.SERVER.USE_PRODUCTION to true

// Log configuration on load (if in development)
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  console.log("WebRTC App Config:", CONFIG);
}
